<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { bigScreenText } from '../i18n/zh-CN'
import { bigScreenPresets } from '../presets/presets'
import { useDashboardHistoryStore } from '../stores/useDashboardHistoryStore'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import { clampZoom, formatZoomPercent, MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './designerLayout'

const designer = useDashboardDesignerStore()
const history = useDashboardHistoryStore()
const scaleCanvasComponents = ref(true)
const selectedCanvasResolution = ref('')
const customCanvasWidth = ref(designer.schema.canvas.width)
const customCanvasHeight = ref(designer.schema.canvas.height)

const zoomOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
const CUSTOM_RESOLUTION_VALUE = 'custom'
const canvasResolutionPresets = [
  { label: '1080P', value: '1920x1080', width: 1920, height: 1080 },
  { label: '2K', value: '2560x1440', width: 2560, height: 1440 },
  { label: '4K', value: '3840x2160', width: 3840, height: 2160 },
]

const canUndo = computed(() => history.past.length > 0 && !designer.isLoading && !designer.isSaving)
const canRedo = computed(() => history.future.length > 0 && !designer.isLoading && !designer.isSaving)
const hasValidName = computed(() => designer.dashboardName.trim().length > 0)
const canSave = computed(() => hasValidName.value && !designer.isLoading && !designer.isSaving)
const canApplyPreset = computed(() => !designer.isLoading && !designer.isSaving)
const canEditCanvasResolution = computed(() => !designer.isLoading && !designer.isSaving)
const isCustomCanvasResolution = computed(() => selectedCanvasResolution.value === CUSTOM_RESOLUTION_VALUE)
const canPreview = computed(
  () =>
    Boolean(designer.dashboardId) &&
    designer.dashboardStatus === 'published' &&
    !designer.hasUnsavedChanges &&
    !designer.isLoading,
)
const canPublish = computed(() => hasValidName.value && !designer.isLoading && !designer.isSaving)
const runtimePreviewHref = computed(() =>
  canPreview.value && designer.dashboardId ? `/runtime/${designer.dashboardId}` : undefined,
)
const previewTitle = computed(() =>
  canPreview.value ? bigScreenText.designer.toolbar.openPublishedPreview : bigScreenText.designer.toolbar.publishSavedFirst,
)
const publishTitle = computed(() => {
  if (!designer.dashboardId) return bigScreenText.designer.toolbar.createAndPublish
  if (designer.hasUnsavedChanges) return bigScreenText.designer.toolbar.saveDraftAndPublish

  return bigScreenText.designer.toolbar.publishDashboard
})
const recordStatus = computed(() => {
  const status = designer.dashboardStatus ?? 'local'
  const labels = bigScreenText.common.status

  return status === 'published' ? labels.published : status === 'draft' ? labels.draft : labels.local
})
watch(
  () => [designer.schema.canvas.width, designer.schema.canvas.height] as const,
  ([width, height]) => {
    const matchingPreset = canvasResolutionPresets.find((preset) => preset.width === width && preset.height === height)
    selectedCanvasResolution.value = matchingPreset?.value ?? CUSTOM_RESOLUTION_VALUE
    customCanvasWidth.value = width
    customCanvasHeight.value = height
  },
  { immediate: true },
)

const saveState = computed(() => {
  if (designer.isSaving && designer.activeSaveIntent === 'publish') return bigScreenText.common.actions.publishing
  if (designer.isSaving) return bigScreenText.designer.toolbar.savingDraft
  if (designer.hasUnsavedChanges) return bigScreenText.designer.toolbar.unsavedChanges
  if (!designer.dashboardId) return bigScreenText.designer.toolbar.readyToCreate

  return bigScreenText.designer.toolbar.draftReady
})

function updateName(event: Event) {
  const input = event.target as HTMLInputElement
  designer.setDashboardName(input.value)
}

function applyCanvasResolution(width: number, height: number) {
  designer.resizeCanvas({ width, height, scaleComponents: scaleCanvasComponents.value })
}

function updateCanvasResolutionFromSelect(event: Event) {
  const input = event.target as HTMLSelectElement
  selectedCanvasResolution.value = input.value

  if (input.value === CUSTOM_RESOLUTION_VALUE) {
    customCanvasWidth.value = designer.schema.canvas.width
    customCanvasHeight.value = designer.schema.canvas.height
    return
  }

  const preset = canvasResolutionPresets.find((candidate) => candidate.value === input.value)
  if (preset) {
    applyCanvasResolution(preset.width, preset.height)
  }
}

function updateCanvasScaleToggle(event: Event) {
  scaleCanvasComponents.value = (event.target as HTMLInputElement).checked
}

function updateCustomCanvasWidth(event: Event) {
  customCanvasWidth.value = Number((event.target as HTMLInputElement).value)
}

function updateCustomCanvasHeight(event: Event) {
  customCanvasHeight.value = Number((event.target as HTMLInputElement).value)
}

function applyCustomCanvasResolution() {
  applyCanvasResolution(customCanvasWidth.value, customCanvasHeight.value)
}

function updateZoom(value: number) {
  designer.zoom = clampZoom(value)
}

function updateZoomFromSelect(event: Event) {
  const input = event.target as HTMLSelectElement
  updateZoom(Number(input.value))
}

function applyPresetFromSelect(event: Event) {
  const input = event.target as HTMLSelectElement
  const preset = bigScreenPresets.find((candidate) => candidate.id === input.value)

  if (preset) {
    designer.applyPreset(preset.schema)
  }

  input.value = ''
}
</script>

<template>
  <header class="designer-toolbar">
    <RouterLink
      class="designer-toolbar__icon-button designer-toolbar__back-link"
      data-testid="dashboard-library-link"
      to="/workbenches"
      :aria-label="bigScreenText.common.actions.backToLibrary"
      :title="bigScreenText.common.actions.backToLibrary"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M10.5 6 4.5 12l6 6" />
        <path d="M5.5 12h14" />
      </svg>
    </RouterLink>

    <div class="designer-toolbar__identity">
      <label class="designer-toolbar__name-field">
        <span class="designer-toolbar__sr-only">{{ bigScreenText.designer.toolbar.dashboardName }}</span>
        <input
          class="designer-toolbar__name-input"
          data-testid="dashboard-name-input"
          type="text"
          :value="designer.dashboardName"
          :disabled="designer.isLoading || designer.isSaving"
          maxlength="120"
          @input="updateName"
        />
      </label>
      <span class="designer-toolbar__status-group">
        <span class="designer-toolbar__record-status">{{ recordStatus }}</span>
        <span class="designer-toolbar__status" :class="{ 'is-saving': designer.isSaving }">{{ saveState }}</span>
      </span>
    </div>

    <div class="designer-toolbar__cluster designer-toolbar__cluster--history" :aria-label="bigScreenText.designer.toolbar.historyControls">
      <button class="designer-toolbar__button" type="button" :disabled="!canUndo" @click="designer.undo">
        {{ bigScreenText.designer.toolbar.undo }}
      </button>
      <button class="designer-toolbar__button" type="button" :disabled="!canRedo" @click="designer.redo">
        {{ bigScreenText.designer.toolbar.redo }}
      </button>
      <select
        class="designer-toolbar__preset-select"
        data-testid="preset-select"
        :aria-label="bigScreenText.designer.toolbar.applyPreset"
        value=""
        :disabled="!canApplyPreset"
        @change="applyPresetFromSelect"
      >
        <option value="">{{ bigScreenText.designer.toolbar.presetPlaceholder }}</option>
        <option v-for="preset in bigScreenPresets" :key="preset.id" :value="preset.id">
          {{ preset.title }}
        </option>
      </select>
    </div>

    <div class="designer-toolbar__cluster designer-toolbar__cluster--canvas" :aria-label="bigScreenText.designer.toolbar.canvasResolution">
      <select
        class="designer-toolbar__canvas-select"
        data-testid="canvas-resolution-select"
        :aria-label="bigScreenText.designer.toolbar.canvasResolution"
        :value="selectedCanvasResolution"
        :disabled="!canEditCanvasResolution"
        @change="updateCanvasResolutionFromSelect"
      >
        <option v-for="preset in canvasResolutionPresets" :key="preset.value" :value="preset.value">
          {{ preset.label }} · {{ preset.width }}×{{ preset.height }}
        </option>
        <option :value="CUSTOM_RESOLUTION_VALUE">{{ bigScreenText.designer.toolbar.customResolution }}</option>
      </select>
      <label class="designer-toolbar__scale-toggle" :title="bigScreenText.designer.toolbar.scaleCanvasComponents">
        <input
          data-testid="canvas-scale-toggle"
          type="checkbox"
          :checked="scaleCanvasComponents"
          :disabled="!canEditCanvasResolution"
          @change="updateCanvasScaleToggle"
        />
        <span>{{ bigScreenText.designer.toolbar.scaleCanvasComponents }}</span>
      </label>
      <template v-if="isCustomCanvasResolution">
        <input
          class="designer-toolbar__canvas-input"
          data-testid="custom-canvas-width-input"
          type="number"
          min="320"
          max="7680"
          :value="customCanvasWidth"
          :disabled="!canEditCanvasResolution"
          @input="updateCustomCanvasWidth"
        />
        <span class="designer-toolbar__canvas-multiply">×</span>
        <input
          class="designer-toolbar__canvas-input"
          data-testid="custom-canvas-height-input"
          type="number"
          min="240"
          max="4320"
          :value="customCanvasHeight"
          :disabled="!canEditCanvasResolution"
          @input="updateCustomCanvasHeight"
        />
        <button
          class="designer-toolbar__button designer-toolbar__button--compact"
          data-testid="apply-custom-resolution-button"
          type="button"
          :disabled="!canEditCanvasResolution"
          @click="applyCustomCanvasResolution"
        >
          {{ bigScreenText.designer.toolbar.applyResolution }}
        </button>
      </template>
    </div>

    <div class="designer-toolbar__cluster designer-toolbar__cluster--zoom" :aria-label="bigScreenText.designer.toolbar.zoomControls">
      <button
        class="designer-toolbar__icon-button"
        type="button"
        :aria-label="bigScreenText.designer.toolbar.zoomOut"
        :disabled="designer.zoom <= MIN_ZOOM"
        @click="updateZoom(designer.zoom - ZOOM_STEP)"
      >
        -
      </button>
      <select
        class="designer-toolbar__zoom-select"
        :aria-label="bigScreenText.designer.toolbar.zoom"
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
        :aria-label="bigScreenText.designer.toolbar.zoomIn"
        :disabled="designer.zoom >= MAX_ZOOM"
        @click="updateZoom(designer.zoom + ZOOM_STEP)"
      >
        +
      </button>
    </div>

    <div class="designer-toolbar__cluster designer-toolbar__cluster--primary" :aria-label="bigScreenText.designer.toolbar.dashboardActions">
      <a
        class="designer-toolbar__button designer-toolbar__link-button"
        data-testid="preview-runtime-link"
        :class="{ 'is-disabled': !canPreview }"
        :href="runtimePreviewHref"
        target="_blank"
        rel="noreferrer"
        :aria-disabled="!canPreview"
        :tabindex="canPreview ? 0 : -1"
        :title="previewTitle"
        @click="!canPreview && $event.preventDefault()"
      >
        {{ bigScreenText.common.actions.preview }}
      </a>
      <button
        class="designer-toolbar__button designer-toolbar__button--primary"
        data-testid="save-dashboard-button"
        type="button"
        :disabled="!canSave"
        :title="designer.dashboardId ? bigScreenText.designer.toolbar.saveDraft : bigScreenText.designer.toolbar.createAndSave"
        @click="designer.saveDraft"
      >
        {{ designer.isSaving && designer.activeSaveIntent === 'draft' ? bigScreenText.common.actions.saving : bigScreenText.common.actions.save }}
      </button>
      <button
        class="designer-toolbar__button"
        data-testid="publish-dashboard-button"
        type="button"
        :disabled="!canPublish"
        :title="publishTitle"
        @click="designer.publish"
      >
        {{ designer.isSaving && designer.activeSaveIntent === 'publish' ? bigScreenText.common.actions.publishing : bigScreenText.common.actions.publish }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.designer-toolbar {
  position: relative;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  grid-template-areas:
    "identity zoom primary"
    "history canvas primary";
  align-items: center;
  gap: 8px 14px;
  min-height: 96px;
  padding: 10px 18px 10px 72px;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-panel) 94%, #e0f2fe);
}

.designer-toolbar__identity {
  grid-area: identity;
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
.designer-toolbar__preset-select,
.designer-toolbar__canvas-select,
.designer-toolbar__canvas-input,
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

.designer-toolbar__status-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: max-content;
  max-width: 250px;
  min-width: 0;
}

.designer-toolbar__record-status,
.designer-toolbar__status {
  overflow: hidden;
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.designer-toolbar__record-status {
  flex: 0 0 auto;
  padding: 3px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent) 12%, white);
  color: var(--color-accent);
}

.designer-toolbar__status {
  min-width: 0;
  color: var(--color-text-muted);
}

.designer-toolbar__status.is-saving {
  color: var(--color-accent);
}

.designer-toolbar__cluster {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.designer-toolbar__cluster--history {
  grid-area: history;
}

.designer-toolbar__cluster--canvas {
  grid-area: canvas;
}

.designer-toolbar__cluster--zoom {
  grid-area: zoom;
}

.designer-toolbar__cluster--primary {
  grid-area: primary;
}
.designer-toolbar__button,
.designer-toolbar__preset-select,
.designer-toolbar__canvas-select,
.designer-toolbar__canvas-input,
.designer-toolbar__icon-button,
.designer-toolbar__zoom-select {
  height: 34px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 800;
}

.designer-toolbar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 152px;
  padding: 0 12px;
  overflow: hidden;
  text-align: center;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.designer-toolbar__back-link {
  position: absolute;
  top: 50%;
  left: 20px;
  z-index: 1;
  flex: 0 0 auto;
  transform: translateY(-50%);
  text-decoration: none;
}

.designer-toolbar__back-link svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.designer-toolbar__icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  padding: 0;
}

.designer-toolbar__zoom-select {
  width: 82px;
  padding: 0 8px;
}

.designer-toolbar__preset-select {
  width: 150px;
  padding: 0 8px;
}

.designer-toolbar__cluster--canvas {
  gap: 8px;
}

.designer-toolbar__canvas-select {
  width: 164px;
  padding: 0 8px;
}

.designer-toolbar__canvas-input {
  width: 74px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 700;
}

.designer-toolbar__canvas-multiply {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.designer-toolbar__scale-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 48px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.designer-toolbar__scale-toggle input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--color-primary);
}

.designer-toolbar__button--compact {
  min-width: 44px;
  padding: 0 10px;
}

.designer-toolbar__button:hover:not(:disabled),
.designer-toolbar__link-button:hover:not(.is-disabled),
.designer-toolbar__preset-select:hover:not(:disabled),
.designer-toolbar__canvas-select:hover:not(:disabled),
.designer-toolbar__canvas-input:hover:not(:disabled),
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
.designer-toolbar__link-button.is-disabled,
.designer-toolbar__preset-select:disabled,
.designer-toolbar__canvas-select:disabled,
.designer-toolbar__canvas-input:disabled,
.designer-toolbar__icon-button:disabled,
.designer-toolbar__zoom-select:disabled,
.designer-toolbar__name-input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  pointer-events: none;
}

.designer-toolbar__button--primary:disabled {
  border-color: var(--color-border);
  background: #e2e8f0;
  color: var(--color-text-muted);
  opacity: 1;
}

.designer-toolbar__name-input:focus-visible,
.designer-toolbar__preset-select:focus-visible,
.designer-toolbar__canvas-select:focus-visible,
.designer-toolbar__canvas-input:focus-visible,
.designer-toolbar__zoom-select:focus-visible,
.designer-toolbar__button:focus-visible,
.designer-toolbar__icon-button:focus-visible,
.designer-toolbar__link-button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-accent) 36%, transparent);
  outline-offset: 2px;
}

@media (max-width: 1100px) {
  .designer-toolbar {
    grid-template-columns: 1fr;
    grid-template-areas:
      "identity"
      "history"
      "canvas"
      "zoom"
      "primary";
    align-items: start;
  }

  .designer-toolbar__cluster {
    flex-wrap: wrap;
  }
}
</style>
