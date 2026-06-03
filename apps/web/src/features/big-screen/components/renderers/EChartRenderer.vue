<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, type PropType } from 'vue'
import VChart from 'vue-echarts'
import type { ComponentData } from '../../data-adapters/dataAdapter.types'
import { buildChartOption, getChartDataIssue } from './chartRenderer.helpers'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

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

const title = computed(() => propString('title', props.component.name))
const accentColor = computed(() => styleString('accentColor', '#38bdf8'))
const fontColor = computed(() => styleString('fontColor', '#dbeafe'))
const panelStyle = computed(() => ({
  backgroundColor: styleString('backgroundColor', 'rgba(15, 23, 42, 0.82)'),
  color: fontColor.value,
  '--chart-accent': accentColor.value,
}))
const chartIssue = computed(() => getChartDataIssue(props.component, props.data))

const chartOption = computed(() =>
  props.data && !chartIssue.value
    ? buildChartOption(props.component, props.data, {
        title: title.value,
        fontColor: fontColor.value,
        accentColor: accentColor.value,
      })
    : {},
)
</script>

<template>
  <section class="echart-renderer" :style="panelStyle" :aria-busy="loading">
    <header class="echart-renderer__header">{{ title }}</header>
    <div class="echart-renderer__body">
      <div v-if="loading" class="echart-renderer__state">
        <span class="echart-renderer__skeleton" />
        <span class="echart-renderer__skeleton echart-renderer__skeleton--short" />
      </div>
      <p v-else-if="error" class="echart-renderer__state">Chart unavailable: {{ error }}</p>
      <p v-else-if="chartIssue" class="echart-renderer__state">{{ chartIssue }}</p>
      <VChart v-else class="echart-renderer__chart" :option="chartOption" autoresize />
    </div>
  </section>
</template>

<style scoped>
.echart-renderer {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--chart-accent) 26%, transparent);
  border-radius: 8px;
}

.echart-renderer__header {
  min-width: 0;
  overflow: hidden;
  color: currentColor;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.echart-renderer__body {
  min-width: 0;
  min-height: 0;
}

.echart-renderer__chart {
  width: 100%;
  height: 100%;
  min-height: 120px;
}

.echart-renderer__state {
  display: grid;
  place-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  margin: 0;
  color: color-mix(in srgb, currentColor 72%, transparent);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.echart-renderer__skeleton {
  display: block;
  width: 180px;
  max-width: 70%;
  height: 16px;
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.echart-renderer__skeleton--short {
  width: 120px;
}
</style>
