<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, type PropType } from 'vue'
import type { ComponentData, MetricData } from '../../data-adapters/dataAdapter.types'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
  data: { type: Object as PropType<ComponentData | null>, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

function styleString(key: string, fallback: string): string {
  const value = props.component.style[key]
  return typeof value === 'string' ? value : fallback
}

function propString(key: string, fallback: string): string {
  const value = props.component.props[key]
  return typeof value === 'string' ? value : fallback
}

function propNumber(key: string, fallback: number): number {
  const value = props.component.props[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const metric = computed<MetricData | null>(() => (props.data?.kind === 'metric' ? props.data : null))
const title = computed(() => propString('title', metric.value?.label ?? props.component.name))
const precision = computed(() => propNumber('precision', 0))
const valueText = computed(() => {
  if (!metric.value) return ''
  const prefix = propString('valuePrefix', '')
  const suffix = propString('valueSuffix', '')
  return `${prefix}${metric.value.value.toLocaleString(undefined, {
    maximumFractionDigits: precision.value,
    minimumFractionDigits: precision.value,
  })}${suffix}`
})
const trendText = computed(() => {
  if (!metric.value) return ''
  const trend = metric.value.trend
  const sign = trend > 0 ? '+' : ''
  return `${sign}${trend.toFixed(1)}%`
})
const cardStyle = computed(() => ({
  backgroundColor: styleString('backgroundColor', 'rgba(15, 23, 42, 0.86)'),
  color: styleString('fontColor', '#e5f0ff'),
  '--metric-accent': styleString('accentColor', '#38bdf8'),
}))
</script>

<template>
  <section class="metric-card-renderer" :style="cardStyle" :aria-busy="loading">
    <template v-if="loading">
      <div class="metric-card-renderer__skeleton metric-card-renderer__skeleton--title" />
      <div class="metric-card-renderer__skeleton metric-card-renderer__skeleton--value" />
      <div class="metric-card-renderer__skeleton metric-card-renderer__skeleton--trend" />
    </template>
    <template v-else-if="error">
      <p class="metric-card-renderer__label">Data unavailable</p>
      <p class="metric-card-renderer__state">{{ error }}</p>
    </template>
    <template v-else-if="metric">
      <p class="metric-card-renderer__label">{{ title }}</p>
      <p class="metric-card-renderer__value">{{ valueText }}</p>
      <p class="metric-card-renderer__trend" :class="{ 'is-negative': metric.trend < 0 }">{{ trendText }}</p>
    </template>
    <template v-else>
      <p class="metric-card-renderer__label">{{ title }}</p>
      <p class="metric-card-renderer__state">No metric data</p>
    </template>
  </section>
</template>

<style scoped>
.metric-card-renderer {
  box-sizing: border-box;
  display: grid;
  align-content: space-between;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--metric-accent) 34%, transparent);
  border-radius: 8px;
}

.metric-card-renderer__label,
.metric-card-renderer__value,
.metric-card-renderer__trend,
.metric-card-renderer__state {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.metric-card-renderer__label {
  color: color-mix(in srgb, currentColor 72%, transparent);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.metric-card-renderer__value {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.05;
}

.metric-card-renderer__trend {
  width: fit-content;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--metric-accent) 18%, transparent);
  color: var(--metric-accent);
  font-size: 13px;
  font-weight: 700;
}

.metric-card-renderer__trend.is-negative {
  color: #f87171;
}

.metric-card-renderer__state {
  color: color-mix(in srgb, currentColor 74%, transparent);
  font-size: 14px;
}

.metric-card-renderer__skeleton {
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.metric-card-renderer__skeleton--title {
  width: 48%;
  height: 14px;
}

.metric-card-renderer__skeleton--value {
  width: 72%;
  height: 38px;
}

.metric-card-renderer__skeleton--trend {
  width: 34%;
  height: 24px;
}
</style>
