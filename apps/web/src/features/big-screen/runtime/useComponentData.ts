import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { mockDataAdapter } from '../data-adapters/mockDataAdapter'
import type { ComponentData, DataLoadState } from '../data-adapters/dataAdapter.types'
import { bigScreenText } from '../i18n/zh-CN'

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

export function useComponentData(
  componentSource: MaybeRefOrGetter<DashboardComponent>,
  schemaSource: MaybeRefOrGetter<DashboardSchema>,
) {
  const loadState = ref<DataLoadState>({ status: 'idle', data: null, error: null })
  let requestSerial = 0
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const component = computed(() => toValue(componentSource))
  const schema = computed(() => toValue(schemaSource))
  const binding = computed(() =>
    component.value.dataBindingId ? schema.value.dataBindings[component.value.dataBindingId] : undefined,
  )
  const data = computed<ComponentData | null>(() => loadState.value.data)
  const loading = computed(() => loadState.value.status === 'loading')
  const error = computed(() => (loadState.value.status === 'error' ? loadState.value.error : ''))
  const bindingSignature = computed(() =>
    JSON.stringify({
      dataBindingId: component.value.dataBindingId ?? null,
      sourceType: binding.value?.sourceType ?? null,
      sourceId: binding.value?.sourceId ?? null,
      query: stableSerialize(binding.value?.query ?? null),
      refreshSeconds: binding.value?.refreshSeconds ?? null,
      schemaRefreshMode: schema.value.refresh.mode,
      schemaRefreshSeconds: schema.value.refresh.intervalSeconds ?? null,
    }),
  )

  function getRefreshSeconds(): number | null {
    if (binding.value?.refreshSeconds) {
      return binding.value.refreshSeconds
    }

    if (schema.value.refresh.mode === 'interval' && schema.value.refresh.intervalSeconds) {
      return schema.value.refresh.intervalSeconds
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
        error: bigScreenText.common.errors.unsupportedDataSource(currentBinding.sourceType),
      }
      return
    }

    loadState.value = { status: 'loading', data: previousData, error: null }

    try {
      const nextData = await mockDataAdapter.query(currentBinding)
      if (serial !== requestSerial) return

      loadState.value = nextData
        ? { status: 'success', data: nextData, error: null }
        : { status: 'empty', data: null, error: null }
    } catch (errorValue) {
      if (serial !== requestSerial) return

      const message = errorValue instanceof Error ? errorValue.message : bigScreenText.renderers.dataUnavailable
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

  return {
    data,
    loading,
    error,
    loadState,
    reload: loadData,
  }
}
