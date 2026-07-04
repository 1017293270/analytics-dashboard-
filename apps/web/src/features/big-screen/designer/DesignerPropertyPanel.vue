<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, ref, watch } from 'vue'
import {
  getAllChartPresets,
  getChartPresetGroups,
  isChartComponentType,
  type ChartPresetDefinition,
} from '../components/chartPresets'
import { getChartThemeById, getChartThemes, getMatchingChartThemeId } from '../components/chartThemes'
import { componentRegistry } from '../components/registry'
import { bigScreenText } from '../i18n/zh-CN'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import ChartThemePicker from './ChartThemePicker.vue'
import ChartTypePicker from './ChartTypePicker.vue'
import ColorField from './ColorField.vue'
import { clampLayout, parseBoundedNumber } from './designerLayout'

type NumericLayoutField = 'x' | 'y' | 'width' | 'height' | 'zIndex'

const BASE_COLOR_SWATCHES = [
  'transparent',
  '#0b1220',
  '#111827',
  '#ffffff',
  '#dbeafe',
  '#38bdf8',
  '#60a5fa',
  '#22c55e',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
  '#ef4444',
]
const DEFAULT_STYLE_VALUES: Record<string, string> = {
  backgroundColor: 'transparent',
  fontColor: '#f8fafc',
  accentColor: '#38bdf8',
  borderColor: 'transparent',
}
const ALLOWED_HTTP_WEB_EMBED_HOSTS = new Set(['127.0.0.1', 'localhost', 'demo.school.local'])
const WEB_EMBED_URL_HINT = '仅支持 https://，或 localhost / 127.0.0.1 / demo.school.local 的 http:// 链接'

const designer = useDashboardDesignerStore()
const rejectedWebEmbedUrl = ref('')

const selectedComponent = computed(() => designer.selectedComponent)
const selectedDefinition = computed(() =>
  selectedComponent.value ? componentRegistry[selectedComponent.value.type] : null,
)
const dataBindingIds = computed(() => Object.keys(designer.schema.dataBindings))
const chartPresetGroups = computed(() => getChartPresetGroups())
const allChartPresetOptions = computed(() => getAllChartPresets())
const chartThemes = computed(() => getChartThemes())
const selectedChartPresetId = computed(() => {
  const component = selectedComponent.value
  if (!component || !isChartComponentType(component.type)) return ''

  const variant = component?.props.variant
  const selectedPreset = allChartPresetOptions.value.find(
    (preset) => preset.componentType === component.type && preset.id === variant,
  )

  return selectedPreset?.id ?? allChartPresetOptions.value.find((preset) => preset.componentType === component.type)?.id ?? ''
})
const selectedChartThemeId = computed(() => {
  const component = selectedComponent.value
  if (!component || !isChartComponentType(component.type)) return ''

  return getMatchingChartThemeId(component.style)
})
const currentChartThemeColors = computed(() => {
  const component = selectedComponent.value
  if (!component || !isChartComponentType(component.type)) return []

  const colors = stringArrayValue(component.style, 'seriesColors')
  return colors.length > 0 ? colors : [styleValue(component, 'accentColor')].filter(Boolean)
})
const hasMissingBinding = computed(() => {
  const bindingId = selectedComponent.value?.dataBindingId

  return Boolean(bindingId && !dataBindingIds.value.includes(bindingId))
})
const showTitleProp = computed(() => selectedComponent.value && 'title' in selectedComponent.value.props)
const showTextProp = computed(() => selectedComponent.value && 'text' in selectedComponent.value.props)
const showImageSourceProp = computed(() => selectedComponent.value?.type === 'image')
const showWebEmbedUrlProp = computed(() => selectedComponent.value?.type === 'web-embed')
const webEmbedUrl = computed(() => (selectedComponent.value ? propString(selectedComponent.value, 'url') : ''))
const webEmbedUrlInputValue = computed(() => rejectedWebEmbedUrl.value || webEmbedUrl.value)
const hasUnsafeWebEmbedUrl = computed(() => {
  if (!showWebEmbedUrlProp.value) return false
  const url = webEmbedUrlInputValue.value.trim()
  return Boolean(url && !isAllowedWebEmbedUrl(url))
})
const showChartPicker = computed(() => {
  const component = selectedComponent.value

  return Boolean(component && isChartComponentType(component.type))
})
const showFontSize = computed(() => {
  const component = selectedComponent.value

  return Boolean(component && (component.type === 'text' || typeof component.style.fontSize === 'number'))
})
const isEditingLocked = computed(() => selectedComponent.value?.layout.locked === true)
const isEditingDisabled = computed(() => isEditingLocked.value || designer.isSaving)
const colorSwatches = computed(() => {
  const componentColors = selectedComponent.value
    ? ['backgroundColor', 'fontColor', 'accentColor', 'borderColor'].map((key) =>
        styleValue(selectedComponent.value as DashboardComponent, key),
      )
    : []
  const presetColors = allChartPresetOptions.value.map((preset) => recordString(preset.style, 'accentColor'))
  const chartThemeColors = chartThemes.value.flatMap((theme) => theme.seriesColors)
  const colors = [
    ...designer.schema.theme.colors,
    ...componentColors,
    ...presetColors,
    ...chartThemeColors,
    ...BASE_COLOR_SWATCHES,
  ]
  const seen = new Set<string>()

  return colors.filter((color) => {
    if (!color || seen.has(color)) return false
    seen.add(color)
    return true
  })
})

watch(
  () => selectedComponent.value?.id,
  () => {
    rejectedWebEmbedUrl.value = ''
  },
)

function getInputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value
}

function updateComponentName(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const fallback = selectedDefinition.value?.title ?? bigScreenText.components.names.text
  designer.updateComponent(component.id, { name: getInputValue(event).trim() || fallback })
}

function updateComponentProp(key: string, event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  designer.patchComponentProps(component.id, { [key]: getInputValue(event) })
}

function isAllowedWebEmbedUrl(value: string): boolean {
  const trimmedValue = value.trim()
  const hasHttpsScheme = /^https:\/\//i.test(trimmedValue)
  const hasHttpScheme = /^http:\/\//i.test(trimmedValue)
  if (!hasHttpsScheme && !hasHttpScheme) return false

  try {
    const parsedUrl = new URL(trimmedValue)
    if (parsedUrl.protocol === 'https:' && hasHttpsScheme) return true
    if (parsedUrl.protocol === 'http:' && hasHttpScheme) return ALLOWED_HTTP_WEB_EMBED_HOSTS.has(parsedUrl.hostname)
  } catch {
    return false
  }

  return false
}

function updateWebEmbedUrl(event: Event) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const value = getInputValue(event)
  const trimmedValue = value.trim()
  if (trimmedValue && !isAllowedWebEmbedUrl(trimmedValue)) {
    rejectedWebEmbedUrl.value = value
    return
  }

  rejectedWebEmbedUrl.value = ''
  designer.patchComponentProps(component.id, { url: trimmedValue })
}

function recordString(record: Record<string, unknown>, key: string): string {
  const value = record[key]

  return typeof value === 'string' ? value : ''
}

function stringArrayValue(record: Record<string, unknown>, key: string): string[] {
  const value = record[key]

  return Array.isArray(value) && value.every((item): item is string => typeof item === 'string') ? value : []
}

function convertChartComponent(component: DashboardComponent, preset: ChartPresetDefinition): DashboardComponent {
  const currentDefinition = componentRegistry[component.type]
  const targetDefinition = componentRegistry[preset.componentType]
  const currentDefaultTitle = recordString(currentDefinition.defaultProps, 'title')
  const targetDefaultTitle = recordString(targetDefinition.defaultProps, 'title')
  const currentTitle = propString(component, 'title')
  const shouldUseTargetTitle = !currentTitle || currentTitle === currentDefaultTitle
  const shouldUseTargetName = component.name === currentDefinition.title
  const nextProps = { ...targetDefinition.defaultProps, ...component.props, ...preset.props }

  if (shouldUseTargetTitle && targetDefaultTitle) {
    nextProps.title = targetDefaultTitle
  }

  return {
    ...component,
    type: preset.componentType,
    name: shouldUseTargetName ? targetDefinition.title : component.name,
    props: nextProps,
    style: { ...targetDefinition.defaultStyle, ...component.style, ...preset.style },
  }
}

function updateChartPreset(presetId: string) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return
  if (!isChartComponentType(component.type)) return

  const preset = allChartPresetOptions.value.find((candidate) => candidate.id === presetId)
  if (!preset) return

  designer.patchSchema((draft) => {
    draft.components = draft.components.map((draftComponent) =>
      draftComponent.id === component.id ? convertChartComponent(draftComponent, preset) : draftComponent,
    )
  })
}

function updateChartTheme(themeId: string) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return
  if (!isChartComponentType(component.type)) return

  const theme = getChartThemeById(themeId)
  if (!theme) return

  designer.patchComponentStyle(component.id, {
    backgroundColor: theme.style.backgroundColor,
    fontColor: theme.style.fontColor,
    accentColor: theme.style.accentColor,
    borderColor: theme.style.borderColor,
    seriesColors: [...theme.seriesColors],
  })
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

function defaultStyleValue(component: DashboardComponent, key: string): string {
  const value = componentRegistry[component.type].defaultStyle[key]

  return typeof value === 'string' ? value : (DEFAULT_STYLE_VALUES[key] ?? '#2563eb')
}

function styleNumber(component: DashboardComponent, key: string, fallback = 0): number {
  const value = component.style[key]

  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function updateStyleValue(key: string, value: string) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const trimmedValue = value.trim()
  if (trimmedValue) {
    designer.patchComponentStyle(component.id, { [key]: trimmedValue })
    return
  }

  designer.unsetComponentStyle(component.id, key)
}

function updateBackgroundBlur(value: number) {
  const component = selectedComponent.value
  if (!component) return
  if (isEditingDisabled.value) return

  const backgroundBlur = Math.round(Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 100))
  designer.patchComponentStyle(component.id, { backgroundBlur })
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
  <aside class="property-panel" :aria-label="bigScreenText.propertyPanel.panelEyebrow">
    <header class="property-panel__header">
      <p class="property-panel__eyebrow">{{ bigScreenText.propertyPanel.panelEyebrow }}</p>
      <h2 class="property-panel__title">
        {{ selectedComponent ? selectedComponent.name : bigScreenText.propertyPanel.emptyTitle }}
      </h2>
    </header>

    <div v-if="!selectedComponent" class="property-panel__empty" data-testid="property-empty">
      <strong>{{ bigScreenText.propertyPanel.emptyTitle }}</strong>
      <span>{{ bigScreenText.propertyPanel.emptyHint }}</span>
    </div>

    <form v-else class="property-panel__form" :class="{ 'is-locked': isEditingLocked, 'is-saving': designer.isSaving }" @submit.prevent>
      <section class="property-panel__section">
        <h3>{{ bigScreenText.propertyPanel.sections.basic }}</h3>
        <label class="property-panel__field">
          <span>{{ bigScreenText.propertyPanel.componentName }}</span>
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
          <span>{{ bigScreenText.propertyPanel.title }}</span>
          <input
            type="text"
            :value="propString(selectedComponent, 'title')"
            :disabled="isEditingDisabled"
            maxlength="160"
            @change="updateComponentProp('title', $event)"
          />
        </label>
        <div v-if="showChartPicker" class="property-panel__field">
          <span>{{ bigScreenText.chartPicker.typeLabel }}</span>
          <ChartTypePicker
            :groups="chartPresetGroups"
            :selected-preset-id="selectedChartPresetId"
            :disabled="isEditingDisabled"
            @select="updateChartPreset"
          />
        </div>
        <label v-if="showTextProp" class="property-panel__field">
          <span>{{ bigScreenText.components.names.text }}</span>
          <textarea
            rows="3"
            :value="propString(selectedComponent, 'text')"
            :disabled="isEditingDisabled"
            maxlength="500"
            @change="updateComponentProp('text', $event)"
          />
        </label>
        <label v-if="showImageSourceProp" class="property-panel__field">
          <span>{{ bigScreenText.propertyPanel.imageUrl }}</span>
          <input
            type="text"
            :value="propString(selectedComponent, 'src')"
            :disabled="isEditingDisabled"
            maxlength="1000"
            @change="updateComponentProp('src', $event)"
          />
        </label>
        <label v-if="showWebEmbedUrlProp" class="property-panel__field">
          <span>第三方链接</span>
          <input
            data-testid="web-embed-url-input"
            type="text"
            :value="webEmbedUrlInputValue"
            :disabled="isEditingDisabled"
            maxlength="1000"
            @change="updateWebEmbedUrl"
          />
        </label>
        <p v-if="hasUnsafeWebEmbedUrl" class="property-panel__warning">
          {{ WEB_EMBED_URL_HINT }}
        </p>
        <div class="property-panel__readonly-grid">
          <span>{{ bigScreenText.propertyPanel.componentType }}</span>
          <strong>{{ selectedDefinition?.title }}</strong>
          <span>{{ bigScreenText.propertyPanel.componentId }}</span>
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
          <span>{{ bigScreenText.propertyPanel.locked }}</span>
        </label>
      </section>

      <section class="property-panel__section">
        <h3>{{ bigScreenText.propertyPanel.sections.layout }}</h3>
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
            <span>{{ bigScreenText.propertyPanel.visible }}</span>
          </label>
        </div>
      </section>

      <section class="property-panel__section">
        <h3>{{ bigScreenText.propertyPanel.sections.data }}</h3>
        <label class="property-panel__field">
          <span>{{ bigScreenText.propertyPanel.binding }}</span>
          <select :value="selectedComponent.dataBindingId ?? ''" :disabled="isEditingDisabled" @change="updateDataBindingId">
            <option value="">{{ bigScreenText.propertyPanel.noBinding }}</option>
            <option
              v-if="selectedComponent.dataBindingId && hasMissingBinding"
              :value="selectedComponent.dataBindingId"
            >
              {{ bigScreenText.propertyPanel.missingBinding(selectedComponent.dataBindingId) }}
            </option>
            <option v-for="bindingId in dataBindingIds" :key="bindingId" :value="bindingId">
              {{ bindingId }}
            </option>
          </select>
        </label>
        <p v-if="hasMissingBinding" class="property-panel__warning">
          {{ bigScreenText.propertyPanel.missingBindingWarning }}
        </p>
      </section>

      <section class="property-panel__section">
        <h3>{{ bigScreenText.propertyPanel.sections.style }}</h3>
        <div v-if="showChartPicker" class="property-panel__field">
          <span>{{ bigScreenText.propertyPanel.style.theme }}</span>
          <ChartThemePicker
            :themes="chartThemes"
            :selected-theme-id="selectedChartThemeId"
            :current-colors="currentChartThemeColors"
            :disabled="isEditingDisabled"
            @select="updateChartTheme"
          />
        </div>
        <ColorField
          name="backgroundColor"
          :label="bigScreenText.propertyPanel.style.background"
          :value="styleValue(selectedComponent, 'backgroundColor')"
          :default-value="defaultStyleValue(selectedComponent, 'backgroundColor')"
          :swatches="colorSwatches"
          :disabled="isEditingDisabled"
          show-background-blur
          :background-blur="styleNumber(selectedComponent, 'backgroundBlur')"
          :default-blur="0"
          @change="updateStyleValue('backgroundColor', $event)"
          @blur-change="updateBackgroundBlur"
        />
        <ColorField
          name="fontColor"
          :label="bigScreenText.propertyPanel.style.textColor"
          :value="styleValue(selectedComponent, 'fontColor')"
          :default-value="defaultStyleValue(selectedComponent, 'fontColor')"
          :swatches="colorSwatches"
          :disabled="isEditingDisabled"
          @change="updateStyleValue('fontColor', $event)"
        />
        <ColorField
          name="accentColor"
          :label="bigScreenText.propertyPanel.style.accent"
          :value="styleValue(selectedComponent, 'accentColor')"
          :default-value="defaultStyleValue(selectedComponent, 'accentColor')"
          :swatches="colorSwatches"
          :disabled="isEditingDisabled"
          @change="updateStyleValue('accentColor', $event)"
        />
        <ColorField
          name="borderColor"
          :label="bigScreenText.propertyPanel.border"
          :value="styleValue(selectedComponent, 'borderColor')"
          :default-value="defaultStyleValue(selectedComponent, 'borderColor')"
          :swatches="colorSwatches"
          :disabled="isEditingDisabled"
          @change="updateStyleValue('borderColor', $event)"
        />
        <label v-if="showFontSize" class="property-panel__field">
          <span>{{ bigScreenText.propertyPanel.fontSize }}</span>
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
        {{ bigScreenText.propertyPanel.removeComponent }}
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
