<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed } from 'vue'
import { componentRegistry } from '../components/registry'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import { clampLayout, parseBoundedNumber } from './designerLayout'

type NumericLayoutField = 'x' | 'y' | 'width' | 'height' | 'zIndex'

const designer = useDashboardDesignerStore()

const selectedComponent = computed(() => designer.selectedComponent)
const selectedDefinition = computed(() =>
  selectedComponent.value ? componentRegistry[selectedComponent.value.type] : null,
)
const dataBindingIds = computed(() => Object.keys(designer.schema.dataBindings))
const hasMissingBinding = computed(() => {
  const bindingId = selectedComponent.value?.dataBindingId

  return Boolean(bindingId && !dataBindingIds.value.includes(bindingId))
})
const showTitleProp = computed(() => selectedComponent.value && 'title' in selectedComponent.value.props)
const showTextProp = computed(() => selectedComponent.value && 'text' in selectedComponent.value.props)
const showImageSourceProp = computed(() => selectedComponent.value?.type === 'image')
const showFontSize = computed(() => {
  const component = selectedComponent.value

  return Boolean(component && (component.type === 'text' || typeof component.style.fontSize === 'number'))
})
const isEditingLocked = computed(() => selectedComponent.value?.layout.locked === true)
const isEditingDisabled = computed(() => isEditingLocked.value || designer.isSaving)

function getInputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value
}

function updateComponentName(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const fallback = selectedDefinition.value?.title ?? 'Component'
  designer.updateComponent(component.id, { name: getInputValue(event).trim() || fallback })
}

function updateComponentProp(key: string, event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  designer.patchComponentProps(component.id, { [key]: getInputValue(event) })
}

function propString(component: DashboardComponent, key: string): string {
  const value = component.props[key]

  return typeof value === 'string' ? value : ''
}

function getLayoutBounds(component: DashboardComponent, field: NumericLayoutField) {
  const { canvas } = designer.schema
  const bounds: Record<NumericLayoutField, { min: number; max: number }> = {
    x: { min: 0, max: Math.max(0, canvas.width - component.layout.width) },
    y: { min: 0, max: Math.max(0, canvas.height - component.layout.height) },
    width: { min: 24, max: canvas.width },
    height: { min: 24, max: canvas.height },
    zIndex: { min: 0, max: 10000 },
  }

  return bounds[field]
}

function updateLayoutField(field: NumericLayoutField, event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const bounds = getLayoutBounds(component, field)
  const value = parseBoundedNumber(getInputValue(event), component.layout[field], bounds)
  const layout = clampLayout({ ...component.layout, [field]: value }, designer.schema.canvas)
  designer.updateComponent(component.id, { layout })
}

function updateVisible(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const checked = (event.target as HTMLInputElement).checked
  designer.updateComponent(component.id, { layout: { visible: checked } })
}

function updateLocked(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (designer.isSaving) return

  const checked = (event.target as HTMLInputElement).checked
  designer.updateComponent(component.id, { layout: { locked: checked } })
}

function updateDataBindingId(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const value = getInputValue(event)
  designer.patchSchema((draft) => {
    draft.components = draft.components.map((draftComponent) => {
      if (draftComponent.id !== component.id) return draftComponent
      if (value) return { ...draftComponent, dataBindingId: value }

      const { dataBindingId: _removed, ...rest } = draftComponent
      return rest
    })
  })
}

function styleValue(component: DashboardComponent, key: string): string {
  const value = component.style[key]

  return typeof value === 'string' ? value : ''
}

function updateStyleString(key: string, event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const value = getInputValue(event).trim()
  if (value) {
    designer.patchComponentStyle(component.id, { [key]: value })
    return
  }

  designer.unsetComponentStyle(component.id, key)
}

function updateFontSize(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const rawValue = getInputValue(event)
  if (!rawValue.trim()) {
    designer.unsetComponentStyle(component.id, 'fontSize')
    return
  }

  const fallback = typeof component.style.fontSize === 'number' ? component.style.fontSize : 24
  designer.patchComponentStyle(component.id, {
    fontSize: parseBoundedNumber(rawValue, fallback, { min: 8, max: 120 }),
  })
}
</script>

<template>
  <aside class="property-panel" aria-label="Properties">
    <header class="property-panel__header">
      <p class="property-panel__eyebrow">Properties</p>
      <h2 class="property-panel__title">
        {{ selectedComponent ? selectedComponent.name : 'Selection' }}
      </h2>
    </header>

    <div v-if="!selectedComponent" class="property-panel__empty" data-testid="property-empty">
      <strong>No component selected</strong>
      <span>The canvas stays editable from the palette and toolbar.</span>
    </div>

    <form v-else class="property-panel__form" :class="{ 'is-locked': isEditingLocked, 'is-saving': designer.isSaving }" @submit.prevent>
      <section class="property-panel__section">
        <h3>Basic</h3>
        <label class="property-panel__field">
          <span>Name</span>
          <input
            data-testid="component-name-input"
            type="text"
            :value="selectedComponent.name"
            :disabled="isEditingDisabled"
            maxlength="120"
            @change="updateComponentName"
          />
        </label>
        <label v-if="showTitleProp" class="property-panel__field">
          <span>Title</span>
          <input
            type="text"
            :value="propString(selectedComponent, 'title')"
            :disabled="isEditingDisabled"
            maxlength="160"
            @change="updateComponentProp('title', $event)"
          />
        </label>
        <label v-if="showTextProp" class="property-panel__field">
          <span>Text</span>
          <textarea
            rows="3"
            :value="propString(selectedComponent, 'text')"
            :disabled="isEditingDisabled"
            maxlength="500"
            @change="updateComponentProp('text', $event)"
          />
        </label>
        <label v-if="showImageSourceProp" class="property-panel__field">
          <span>Image URL</span>
          <input
            type="text"
            :value="propString(selectedComponent, 'src')"
            :disabled="isEditingDisabled"
            maxlength="1000"
            @change="updateComponentProp('src', $event)"
          />
        </label>
        <div class="property-panel__readonly-grid">
          <span>Type</span>
          <strong>{{ selectedDefinition?.title }}</strong>
          <span>ID</span>
          <strong>{{ selectedComponent.id }}</strong>
        </div>
        <label class="property-panel__check property-panel__check--standalone">
          <input
            data-testid="component-locked-input"
            type="checkbox"
            :checked="isEditingLocked"
            :disabled="designer.isSaving"
            @change="updateLocked"
          />
          <span>Locked</span>
        </label>
      </section>

      <section class="property-panel__section">
        <h3>Layout</h3>
        <div class="property-panel__grid">
          <label class="property-panel__field">
            <span>X</span>
            <input
              data-testid="layout-x-input"
              type="number"
              :value="selectedComponent.layout.x"
              :disabled="isEditingDisabled"
              min="0"
              @change="updateLayoutField('x', $event)"
            />
          </label>
          <label class="property-panel__field">
            <span>Y</span>
            <input type="number" :value="selectedComponent.layout.y" :disabled="isEditingDisabled" min="0" @change="updateLayoutField('y', $event)" />
          </label>
          <label class="property-panel__field">
            <span>W</span>
            <input type="number" :value="selectedComponent.layout.width" :disabled="isEditingDisabled" min="24" @change="updateLayoutField('width', $event)" />
          </label>
          <label class="property-panel__field">
            <span>H</span>
            <input type="number" :value="selectedComponent.layout.height" :disabled="isEditingDisabled" min="24" @change="updateLayoutField('height', $event)" />
          </label>
          <label class="property-panel__field">
            <span>Z</span>
            <input
              type="number"
              :value="selectedComponent.layout.zIndex"
              :disabled="isEditingDisabled"
              min="0"
              max="10000"
              @change="updateLayoutField('zIndex', $event)"
            />
          </label>
          <label class="property-panel__check">
            <input type="checkbox" :checked="selectedComponent.layout.visible !== false" :disabled="isEditingDisabled" @change="updateVisible" />
            <span>Visible</span>
          </label>
        </div>
      </section>

      <section class="property-panel__section">
        <h3>Data</h3>
        <label class="property-panel__field">
          <span>Binding</span>
          <select :value="selectedComponent.dataBindingId ?? ''" :disabled="isEditingDisabled" @change="updateDataBindingId">
            <option value="">No binding</option>
            <option
              v-if="selectedComponent.dataBindingId && hasMissingBinding"
              :value="selectedComponent.dataBindingId"
            >
              Missing: {{ selectedComponent.dataBindingId }}
            </option>
            <option v-for="bindingId in dataBindingIds" :key="bindingId" :value="bindingId">
              {{ bindingId }}
            </option>
          </select>
        </label>
        <p v-if="hasMissingBinding" class="property-panel__warning">Binding is not present in the schema.</p>
      </section>

      <section class="property-panel__section">
        <h3>Style</h3>
        <label class="property-panel__field property-panel__field--color">
          <span>Background</span>
          <i :style="{ background: styleValue(selectedComponent, 'backgroundColor') || 'transparent' }" aria-hidden="true" />
          <input
            type="text"
            :value="styleValue(selectedComponent, 'backgroundColor')"
            :disabled="isEditingDisabled"
            @change="updateStyleString('backgroundColor', $event)"
          />
        </label>
        <label class="property-panel__field property-panel__field--color">
          <span>Text Color</span>
          <i :style="{ background: styleValue(selectedComponent, 'fontColor') || 'transparent' }" aria-hidden="true" />
          <input type="text" :value="styleValue(selectedComponent, 'fontColor')" :disabled="isEditingDisabled" @change="updateStyleString('fontColor', $event)" />
        </label>
        <label class="property-panel__field property-panel__field--color">
          <span>Accent</span>
          <i :style="{ background: styleValue(selectedComponent, 'accentColor') || 'transparent' }" aria-hidden="true" />
          <input type="text" :value="styleValue(selectedComponent, 'accentColor')" :disabled="isEditingDisabled" @change="updateStyleString('accentColor', $event)" />
        </label>
        <label class="property-panel__field property-panel__field--color">
          <span>Border</span>
          <i :style="{ background: styleValue(selectedComponent, 'borderColor') || 'transparent' }" aria-hidden="true" />
          <input type="text" :value="styleValue(selectedComponent, 'borderColor')" :disabled="isEditingDisabled" @change="updateStyleString('borderColor', $event)" />
        </label>
        <label v-if="showFontSize" class="property-panel__field">
          <span>Font Size</span>
          <input
            type="number"
            :value="selectedComponent.style.fontSize ?? ''"
            :disabled="isEditingDisabled"
            min="8"
            max="120"
            @change="updateFontSize"
          />
        </label>
      </section>

      <button class="property-panel__danger" type="button" :disabled="isEditingDisabled" @click="designer.removeSelectedComponent">
        Remove component
      </button>
    </form>
  </aside>
</template>

<style scoped>
.property-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-panel);
}

.property-panel__header {
  min-width: 0;
  padding: 18px 16px 12px;
  border-bottom: 1px solid var(--color-border);
}

.property-panel__eyebrow,
.property-panel__title {
  margin: 0;
}

.property-panel__eyebrow {
  color: var(--color-accent);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.property-panel__title {
  min-width: 0;
  margin-top: 4px;
  overflow: hidden;
  font-size: 18px;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-panel__empty {
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-muted);
  text-align: center;
}

.property-panel__empty strong {
  color: var(--color-text);
  font-size: 16px;
}

.property-panel__empty span {
  max-width: 220px;
  font-size: 13px;
  line-height: 1.45;
}

.property-panel__form {
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}

.property-panel__section {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-panel-muted) 78%, white);
}

.property-panel__section h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.property-panel__field {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.property-panel__field span,
.property-panel__check span {
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.property-panel__field input,
.property-panel__field select,
.property-panel__field textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: white;
  color: var(--color-text);
}

.property-panel__field input:disabled,
.property-panel__field select:disabled,
.property-panel__field textarea:disabled,
.property-panel__check input:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.property-panel__field input,
.property-panel__field select {
  height: 34px;
  padding: 0 9px;
}

.property-panel__field textarea {
  min-height: 78px;
  padding: 8px 9px;
  resize: vertical;
}

.property-panel__field--color {
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: end;
}

.property-panel__field--color span {
  grid-column: 1 / -1;
}

.property-panel__field--color i {
  width: 18px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-image:
    linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
    linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
    linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
  background-position:
    0 0,
    0 6px,
    6px -6px,
    -6px 0;
  background-size: 12px 12px;
}

.property-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.property-panel__check {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding-top: 17px;
}

.property-panel__check input {
  width: 16px;
  height: 16px;
}

.property-panel__check--standalone {
  min-height: 28px;
  padding-top: 0;
}

.property-panel__readonly-grid {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 6px 10px;
  min-width: 0;
  padding: 8px;
  border-radius: 7px;
  background: white;
}

.property-panel__readonly-grid span {
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.property-panel__readonly-grid strong {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-panel__warning {
  margin: 0;
  color: #b45309;
  font-size: 12px;
  font-weight: 700;
}

.property-panel__danger {
  width: 100%;
  min-height: 36px;
  border: 1px solid color-mix(in srgb, var(--color-danger) 50%, var(--color-border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-danger) 8%, white);
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.property-panel__danger:hover {
  background: color-mix(in srgb, var(--color-danger) 14%, white);
}

.property-panel__danger:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
