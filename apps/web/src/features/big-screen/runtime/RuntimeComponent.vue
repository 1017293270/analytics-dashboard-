<script setup lang="ts">
import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { computed, onBeforeUnmount, ref, watch, type PropType } from 'vue'
import { componentRegistry } from '../components/registry'
import { mockDataAdapter } from '../data-adapters/mockDataAdapter'
import type { ComponentData, DataLoadState } from '../data-adapters/dataAdapter.types'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
  schema: { type: Object as PropType<DashboardSchema>, required: true },
})

const loadState = ref<DataLoadState>({ status: 'idle', data: null, error: null })
let requestSerial = 0
let refreshTimer: ReturnType<typeof setInterval> | null = null

const binding = computed(() =>
  props.component.dataBindingId ? props.schema.dataBindings[props.component.dataBindingId] : undefined,
)
const renderer = computed(() => componentRegistry[props.component.type].renderer)
const componentStyle = computed(() => ({
  left: `${props.component.layout.x}px`,
  top: `${props.component.layout.y}px`,
  width: `${props.component.layout.width}px`,
  height: `${props.component.layout.height}px`,
  zIndex: props.component.layout.zIndex,
}))
const data = computed<ComponentData | null>(() => loadState.value.data)
const loading = computed(() => loadState.value.status === 'loading')
const error = computed(() => (loadState.value.status === 'error' ? loadState.value.error : ''))
const bindingSignature = computed(() =>
  JSON.stringify({
    dataBindingId: props.component.dataBindingId ?? null,
    sourceType: binding.value?.sourceType ?? null,
    sourceId: binding.value?.sourceId ?? null,
    query: stableSerialize(binding.value?.query ?? null),
    refreshSeconds: binding.value?.refreshSeconds ?? null,
    schemaRefreshMode: props.schema.refresh.mode,
    schemaRefreshSeconds: props.schema.refresh.intervalSeconds ?? null,
  }),
)

function stableSerialize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableSerialize)
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
        .map(([key, field]) => [key, stableSerialize(field)]),
    )
  }

  return value
}

function getRefreshSeconds(): number | null {
  if (binding.value?.refreshSeconds) {
    return binding.value.refreshSeconds
  }

  if (props.schema.refresh.mode === 'interval' && props.schema.refresh.intervalSeconds) {
    return props.schema.refresh.intervalSeconds
  }

  return null
}

function clearRefreshTimer() {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
  }
  refreshTimer = null
}

async function loadData() {
  const serial = requestSerial + 1
  requestSerial = serial
  const currentBinding = binding.value

  if (!currentBinding) {
    loadState.value = { status: 'idle', data: null, error: null }
    return
  }

  const previousData = loadState.value.data

  if (currentBinding.sourceType !== 'mock') {
    loadState.value = {
      status: 'error',
      data: previousData,
      error: `Unsupported data source: ${currentBinding.sourceType}`,
    }
    return
  }

  loadState.value = { status: 'loading', data: previousData, error: null }

  try {
    const nextData = await mockDataAdapter.query(currentBinding)
    if (serial !== requestSerial) return

    loadState.value = nextData ? { status: 'success', data: nextData, error: null } : { status: 'empty', data: null, error: null }
  } catch (errorValue) {
    if (serial !== requestSerial) return

    const message = errorValue instanceof Error ? errorValue.message : 'Data unavailable'
    loadState.value = { status: 'error', data: previousData, error: message }
  }
}

function startRefreshTimer() {
  clearRefreshTimer()

  const refreshSeconds = getRefreshSeconds()
  if (!refreshSeconds || typeof window === 'undefined' || binding.value?.sourceType !== 'mock') {
    return
  }

  refreshTimer = setInterval(() => {
    void loadData()
  }, refreshSeconds * 1000)
}

watch(
  bindingSignature,
  () => {
    clearRefreshTimer()
    void loadData()
    startRefreshTimer()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  requestSerial += 1
  clearRefreshTimer()
})
</script>

<template>
  <div class="runtime-component" :style="componentStyle">
    <component :is="renderer" :component="component" :data="data" :loading="loading" :error="error" />
  </div>
</template>

<style scoped>
.runtime-component {
  position: absolute;
  min-width: 24px;
  min-height: 24px;
  overflow: hidden;
}
</style>
