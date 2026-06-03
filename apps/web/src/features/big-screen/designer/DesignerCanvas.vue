<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, onBeforeUnmount, ref } from 'vue'
import { componentRegistry } from '../components/registry'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import { clampLayout, getCanvasBackgroundStyle } from './designerLayout'

type InteractionMode = 'move' | 'resize'

type InteractionState = {
  mode: InteractionMode
  componentId: string
  startClientX: number
  startClientY: number
  startLayout: DashboardComponent['layout']
  previewLayout: DashboardComponent['layout']
}

const designer = useDashboardDesignerStore()
const interaction = ref<InteractionState | null>(null)

const canvas = computed(() => designer.schema.canvas)
const components = computed(() =>
  [...designer.schema.components].sort((first, second) => first.layout.zIndex - second.layout.zIndex),
)
const stageStyle = computed(() => ({
  width: `${canvas.value.width * designer.zoom}px`,
  height: `${canvas.value.height * designer.zoom}px`,
}))
const surfaceStyle = computed(() => ({
  width: `${canvas.value.width}px`,
  height: `${canvas.value.height}px`,
  transform: `scale(${designer.zoom})`,
  ...getCanvasBackgroundStyle(canvas.value),
}))

function getRenderedLayout(component: DashboardComponent): DashboardComponent['layout'] {
  if (interaction.value?.componentId === component.id) {
    return interaction.value.previewLayout
  }

  return component.layout
}

function componentStyle(component: DashboardComponent) {
  const layout = getRenderedLayout(component)

  return {
    left: `${layout.x}px`,
    top: `${layout.y}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
    zIndex: layout.zIndex,
  }
}

function selectComponent(componentId: string) {
  designer.selectedComponentId = componentId
}

function isLocked(component: DashboardComponent) {
  return component.layout.locked === true
}

function clearSelection(event: PointerEvent) {
  if (event.target === event.currentTarget) {
    designer.selectedComponentId = null
  }
}

function beginInteraction(event: PointerEvent, component: DashboardComponent, mode: InteractionMode) {
  if (event.button !== 0) return

  selectComponent(component.id)
  if (isLocked(component)) {
    event.preventDefault()
    return
  }

  const layout = getRenderedLayout(component)
  interaction.value = {
    mode,
    componentId: component.id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startLayout: { ...layout },
    previewLayout: { ...layout },
  }
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', finishInteraction)
  window.addEventListener('pointercancel', cancelInteraction)
  event.preventDefault()
}

function handlePointerMove(event: PointerEvent) {
  const state = interaction.value
  if (!state) return

  const deltaX = (event.clientX - state.startClientX) / designer.zoom
  const deltaY = (event.clientY - state.startClientY) / designer.zoom
  const nextLayout =
    state.mode === 'move'
      ? {
          ...state.startLayout,
          x: state.startLayout.x + deltaX,
          y: state.startLayout.y + deltaY,
        }
      : {
          ...state.startLayout,
          width: state.startLayout.width + deltaX,
          height: state.startLayout.height + deltaY,
        }

  interaction.value = {
    ...state,
    previewLayout: clampLayout(nextLayout, canvas.value),
  }
}

function cleanupInteractionListeners() {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', finishInteraction)
  window.removeEventListener('pointercancel', cancelInteraction)
}

function finishInteraction() {
  const state = interaction.value
  if (state) {
    designer.updateComponent(state.componentId, { layout: state.previewLayout })
  }
  interaction.value = null
  cleanupInteractionListeners()
}

function cancelInteraction() {
  interaction.value = null
  cleanupInteractionListeners()
}

function handleComponentKeydown(event: KeyboardEvent, component: DashboardComponent) {
  selectComponent(component.id)

  if (isLocked(component)) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(event.key)) {
      event.preventDefault()
    }
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    designer.removeSelectedComponent()
    return
  }

  const step = event.shiftKey ? 10 : 1
  const deltas: Record<string, { x: number; y: number }> = {
    ArrowUp: { x: 0, y: -step },
    ArrowDown: { x: 0, y: step },
    ArrowLeft: { x: -step, y: 0 },
    ArrowRight: { x: step, y: 0 },
  }
  const delta = deltas[event.key]
  if (!delta) return

  event.preventDefault()
  designer.updateComponent(component.id, {
    layout: clampLayout({ ...component.layout, x: component.layout.x + delta.x, y: component.layout.y + delta.y }, canvas.value),
  })
}

onBeforeUnmount(() => {
  cleanupInteractionListeners()
})
</script>

<template>
  <section class="designer-canvas" aria-label="Designer canvas">
    <div class="designer-canvas__ruler">
      <span>{{ canvas.width }} x {{ canvas.height }}</span>
      <span>{{ Math.round(designer.zoom * 100) }}%</span>
    </div>

    <div class="designer-canvas__viewport">
      <div class="designer-canvas__stage" :style="stageStyle">
        <div class="designer-canvas__surface" :style="surfaceStyle" @pointerdown="clearSelection">
          <div v-if="components.length === 0" class="designer-canvas__empty" data-testid="canvas-empty-state">
            <strong>No components yet</strong>
            <span>Choose a block from the left panel.</span>
          </div>

          <div
            v-for="component in components"
            :key="component.id"
            class="designer-canvas__component-frame"
            :class="{
              'is-selected': designer.selectedComponentId === component.id,
              'is-dragging': interaction?.componentId === component.id,
              'is-hidden': component.layout.visible === false,
              'is-locked': component.layout.locked === true,
            }"
            :style="componentStyle(component)"
            role="button"
            tabindex="0"
            :aria-label="`${component.name} component`"
            :aria-pressed="designer.selectedComponentId === component.id"
            @click.stop="selectComponent(component.id)"
            @pointerdown.stop="beginInteraction($event, component, 'move')"
            @keydown="handleComponentKeydown($event, component)"
          >
            <component
              :is="componentRegistry[component.type].renderer"
              class="designer-canvas__renderer"
              :component="component"
              :data="null"
              :loading="false"
              error=""
            />

            <template v-if="designer.selectedComponentId === component.id">
              <span class="designer-canvas__corner designer-canvas__corner--nw" aria-hidden="true" />
              <span class="designer-canvas__corner designer-canvas__corner--ne" aria-hidden="true" />
              <span class="designer-canvas__corner designer-canvas__corner--sw" aria-hidden="true" />
              <button
                v-if="component.layout.locked !== true"
                class="designer-canvas__resize-handle"
                type="button"
                tabindex="-1"
                aria-label="Resize component"
                @click.stop
                @pointerdown.stop="beginInteraction($event, component, 'resize')"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.designer-canvas {
  display: grid;
  grid-template-rows: 38px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.06) 1px, transparent 1px),
    linear-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px),
    #e7edf6;
  background-size: 24px 24px;
}

.designer-canvas__ruler {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 0 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.designer-canvas__viewport {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 28px;
}

.designer-canvas__stage {
  position: relative;
  min-width: 240px;
  min-height: 180px;
  margin: 0 auto;
}

.designer-canvas__surface {
  position: relative;
  overflow: hidden;
  transform-origin: 0 0;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.22);
}

.designer-canvas__surface::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}

.designer-canvas__empty {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  gap: 8px;
  color: rgba(226, 232, 240, 0.76);
  pointer-events: none;
  text-align: center;
}

.designer-canvas__empty strong {
  color: #f8fafc;
  font-size: 28px;
}

.designer-canvas__empty span {
  font-size: 15px;
  font-weight: 700;
}

.designer-canvas__component-frame {
  position: absolute;
  z-index: 1;
  min-width: 24px;
  min-height: 24px;
  border: 1px solid transparent;
  outline: none;
  cursor: move;
  transition:
    border-color var(--motion-fast) var(--ease-enter),
    box-shadow var(--motion-fast) var(--ease-enter),
    opacity var(--motion-fast) var(--ease-enter);
}

.designer-canvas__component-frame:hover {
  border-color: rgba(125, 211, 252, 0.7);
}

.designer-canvas__component-frame:focus-visible {
  border-color: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.28);
}

.designer-canvas__component-frame.is-selected {
  border-color: #38bdf8;
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.7),
    0 0 0 4px rgba(56, 189, 248, 0.18);
}

.designer-canvas__component-frame.is-dragging {
  opacity: 0.86;
}

.designer-canvas__component-frame.is-hidden {
  opacity: 0.38;
}

.designer-canvas__component-frame.is-locked {
  cursor: default;
}

.designer-canvas__component-frame.is-locked.is-selected {
  border-style: dashed;
}

.designer-canvas__renderer {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.designer-canvas__corner,
.designer-canvas__resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid #38bdf8;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.22);
}

.designer-canvas__corner--nw {
  top: -6px;
  left: -6px;
}

.designer-canvas__corner--ne {
  top: -6px;
  right: -6px;
}

.designer-canvas__corner--sw {
  bottom: -6px;
  left: -6px;
}

.designer-canvas__resize-handle {
  right: -6px;
  bottom: -6px;
  padding: 0;
  border-radius: 2px;
  cursor: nwse-resize;
}
</style>
