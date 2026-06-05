<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, type PropType } from 'vue'
import type { ComponentData, TableData } from '../../data-adapters/dataAdapter.types'
import { bigScreenText } from '../../i18n/zh-CN'
import { buildBackdropBlurStyle } from './rendererStyle.helpers'

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

const table = computed<TableData | null>(() => (props.data?.kind === 'table' ? props.data : null))
const title = computed(() => propString('title', props.component.name))
const hasRows = computed(() => Boolean(table.value?.rows.length))
const panelStyle = computed(() => ({
  backgroundColor: styleString('backgroundColor', 'rgba(15, 23, 42, 0.86)'),
  color: styleString('fontColor', '#e2e8f0'),
  '--table-accent': styleString('accentColor', '#38bdf8'),
  ...buildBackdropBlurStyle(props.component.style),
}))
</script>

<template>
  <section class="table-renderer" :style="panelStyle" :aria-busy="loading">
    <header class="table-renderer__header">{{ title }}</header>
    <div v-if="loading" class="table-renderer__state">
      <span class="table-renderer__skeleton" />
      <span class="table-renderer__skeleton" />
      <span class="table-renderer__skeleton table-renderer__skeleton--short" />
    </div>
    <p v-else-if="error" class="table-renderer__state">{{ bigScreenText.renderers.tableUnavailable(error) }}</p>
    <p v-else-if="!table || !hasRows" class="table-renderer__state">{{ bigScreenText.renderers.tableEmpty }}</p>
    <div v-else class="table-renderer__scroll">
      <table>
        <thead>
          <tr>
            <th v-for="column in table.columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in table.rows" :key="rowIndex">
            <td v-for="column in table.columns" :key="column">{{ row[column] ?? '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.table-renderer {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--table-accent) 24%, transparent);
  border-radius: 8px;
}

.table-renderer__header {
  min-width: 0;
  overflow: hidden;
  padding-bottom: 10px;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-renderer__scroll {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  max-width: 180px;
  padding: 9px 10px;
  overflow: hidden;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

th {
  color: color-mix(in srgb, currentColor 70%, transparent);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.table-renderer__state {
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

.table-renderer__skeleton {
  display: block;
  width: 220px;
  max-width: 74%;
  height: 14px;
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.table-renderer__skeleton--short {
  width: 150px;
}
</style>
