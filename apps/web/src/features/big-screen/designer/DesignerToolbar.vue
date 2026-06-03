<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardHistoryStore } from '../stores/useDashboardHistoryStore'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import { clampZoom, formatZoomPercent, MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './designerLayout'

const designer = useDashboardDesignerStore()
const history = useDashboardHistoryStore()

const zoomOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

const canUndo = computed(() => history.past.length > 0 && !designer.isLoading)
const canRedo = computed(() => history.future.length > 0 && !designer.isLoading)
const canSave = computed(() => Boolean(designer.dashboardId) && !designer.isLoading && !designer.isSaving)
const saveState = computed(() => {
  if (designer.isSaving) return 'Saving draft'
  if (!designer.dashboardId) return 'Local draft'
  if (history.past.length > 0) return 'Unsaved changes'

  return 'Draft ready'
})

function updateName(event: Event) {
  const input = event.target as HTMLInputElement
  designer.dashboardName = input.value.trim() || 'Untitled Dashboard'
}

function updateZoom(value: number) {
  designer.zoom = clampZoom(value)
}

function updateZoomFromSelect(event: Event) {
  const input = event.target as HTMLSelectElement
  updateZoom(Number(input.value))
}
</script>

<template>
  <header class="designer-toolbar">
    <div class="designer-toolbar__identity">
      <label class="designer-toolbar__name-field">
        <span class="designer-toolbar__sr-only">Dashboard name</span>
        <input
          class="designer-toolbar__name-input"
          type="text"
          :value="designer.dashboardName"
          :disabled="designer.isLoading"
          maxlength="120"
          @change="updateName"
        />
      </label>
      <span class="designer-toolbar__status" :class="{ 'is-saving': designer.isSaving }">{{ saveState }}</span>
    </div>

    <div class="designer-toolbar__cluster" aria-label="History controls">
      <button class="designer-toolbar__button" type="button" :disabled="!canUndo" @click="designer.undo">Undo</button>
      <button class="designer-toolbar__button" type="button" :disabled="!canRedo" @click="designer.redo">Redo</button>
    </div>

    <div class="designer-toolbar__cluster designer-toolbar__cluster--zoom" aria-label="Zoom controls">
      <button
        class="designer-toolbar__icon-button"
        type="button"
        aria-label="Zoom out"
        :disabled="designer.zoom <= MIN_ZOOM"
        @click="updateZoom(designer.zoom - ZOOM_STEP)"
      >
        -
      </button>
      <select
        class="designer-toolbar__zoom-select"
        aria-label="Zoom"
        :value="designer.zoom"
        :disabled="designer.isLoading"
        @change="updateZoomFromSelect"
      >
        <option v-for="option in zoomOptions" :key="option" :value="option">
          {{ formatZoomPercent(option) }}
        </option>
      </select>
      <button
        class="designer-toolbar__icon-button"
        type="button"
        aria-label="Zoom in"
        :disabled="designer.zoom >= MAX_ZOOM"
        @click="updateZoom(designer.zoom + ZOOM_STEP)"
      >
        +
      </button>
    </div>

    <div class="designer-toolbar__cluster designer-toolbar__cluster--primary" aria-label="Dashboard actions">
      <button class="designer-toolbar__button" type="button" disabled title="Preview is not wired yet">Preview</button>
      <button
        class="designer-toolbar__button designer-toolbar__button--primary"
        type="button"
        :disabled="!canSave"
        :title="designer.dashboardId ? 'Save draft' : 'Save requires a backend dashboard id'"
        @click="designer.saveDraft"
      >
        {{ designer.isSaving ? 'Saving' : 'Save' }}
      </button>
      <button class="designer-toolbar__button" type="button" disabled title="Publish is not wired yet">Publish</button>
    </div>
  </header>
</template>

<style scoped>
.designer-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto auto auto;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-panel) 94%, #e0f2fe);
}

.designer-toolbar__identity {
  display: grid;
  grid-template-columns: minmax(160px, 360px) auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.designer-toolbar__name-field,
.designer-toolbar__cluster {
  min-width: 0;
}

.designer-toolbar__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.designer-toolbar__name-input,
.designer-toolbar__zoom-select,
.designer-toolbar__button,
.designer-toolbar__icon-button {
  border: 1px solid var(--color-border);
  background: var(--color-panel);
  color: var(--color-text);
  transition:
    border-color var(--motion-fast) var(--ease-enter),
    background var(--motion-fast) var(--ease-enter),
    color var(--motion-fast) var(--ease-enter),
    box-shadow var(--motion-fast) var(--ease-enter);
}

.designer-toolbar__name-input {
  width: 100%;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 15px;
  font-weight: 800;
}

.designer-toolbar__status {
  width: max-content;
  max-width: 160px;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.designer-toolbar__status.is-saving {
  color: var(--color-accent);
}

.designer-toolbar__cluster {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.designer-toolbar__button,
.designer-toolbar__icon-button,
.designer-toolbar__zoom-select {
  height: 34px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 800;
}

.designer-toolbar__button {
  padding: 0 12px;
}

.designer-toolbar__icon-button {
  width: 34px;
  padding: 0;
}

.designer-toolbar__zoom-select {
  width: 82px;
  padding: 0 8px;
}

.designer-toolbar__button:hover:not(:disabled),
.designer-toolbar__icon-button:hover:not(:disabled),
.designer-toolbar__zoom-select:hover:not(:disabled),
.designer-toolbar__name-input:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-accent) 48%, var(--color-border));
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.12);
}

.designer-toolbar__button--primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
}

.designer-toolbar__button:disabled,
.designer-toolbar__icon-button:disabled,
.designer-toolbar__zoom-select:disabled,
.designer-toolbar__name-input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.designer-toolbar__button--primary:disabled {
  border-color: var(--color-border);
  background: #e2e8f0;
  color: var(--color-text-muted);
  opacity: 1;
}

@media (max-width: 1100px) {
  .designer-toolbar {
    grid-template-columns: 1fr auto;
    align-items: start;
  }

  .designer-toolbar__identity {
    grid-column: 1 / -1;
  }
}
</style>
