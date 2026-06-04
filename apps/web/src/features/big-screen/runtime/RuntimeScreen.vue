<script setup lang="ts">
import type { DashboardSchema } from '@analytics/shared'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { bigScreenApi } from '../api/bigScreenApi'
import { getCanvasBackgroundStyle } from '../designer/designerLayout'
import RuntimeComponent from './RuntimeComponent.vue'
import RuntimeScaler from './RuntimeScaler.vue'

type RuntimeLoadState =
  | { status: 'loading'; schema: null; error: null }
  | { status: 'success'; schema: DashboardSchema; error: null }
  | { status: 'error'; schema: null; error: string }

const route = useRoute()
const loadState = ref<RuntimeLoadState>({ status: 'loading', schema: null, error: null })
let requestSerial = 0

const runtimeId = computed(() => {
  const value = route.params.id
  return Array.isArray(value) ? value[0] : value
})
const schema = computed(() => (loadState.value.status === 'success' ? loadState.value.schema : null))
const visibleComponents = computed(() =>
  schema.value
    ? schema.value.components
        .filter((component) => component.layout.visible !== false)
        .sort((first, second) => first.layout.zIndex - second.layout.zIndex)
    : [],
)
const canvasBackground = computed(() => (schema.value ? getCanvasBackgroundStyle(schema.value.canvas) : {}))
const isLoading = computed(() => loadState.value.status === 'loading')
const error = computed(() => (loadState.value.status === 'error' ? loadState.value.error : ''))

async function loadRuntime() {
  const serial = requestSerial + 1
  requestSerial = serial
  const id = runtimeId.value
  if (!id) {
    loadState.value = { status: 'error', schema: null, error: 'Runtime screen not found' }
    return
  }

  loadState.value = { status: 'loading', schema: null, error: null }

  try {
    const runtime = await bigScreenApi.getRuntime(id)
    if (serial !== requestSerial || runtimeId.value !== id) return

    loadState.value = { status: 'success', schema: runtime.schema, error: null }
  } catch (errorValue) {
    if (serial !== requestSerial || runtimeId.value !== id) return

    const message = errorValue instanceof Error ? errorValue.message : 'Runtime screen unavailable'
    loadState.value = { status: 'error', schema: null, error: message }
  }
}

watch(runtimeId, () => {
  void loadRuntime()
})

onMounted(() => {
  void loadRuntime()
})
</script>

<template>
  <main class="runtime-screen">
    <div v-if="isLoading" class="runtime-screen__state" aria-busy="true">
      <div class="runtime-screen__skeleton runtime-screen__skeleton--wide" />
      <div class="runtime-screen__skeleton" />
      <div class="runtime-screen__skeleton runtime-screen__skeleton--short" />
    </div>

    <section v-else-if="error" class="runtime-screen__state runtime-screen__state--error">
      <h1>Runtime unavailable</h1>
      <p>{{ error }}</p>
      <button type="button" @click="loadRuntime">Retry</button>
    </section>

    <RuntimeScaler
      v-else-if="schema"
      :canvas-width="schema.canvas.width"
      :canvas-height="schema.canvas.height"
      :scale-mode="schema.canvas.scaleMode"
      :background="canvasBackground"
    >
      <div v-if="visibleComponents.length === 0" class="runtime-screen__empty">
        <strong>No visible components</strong>
        <span>This runtime screen has no visible dashboard blocks.</span>
      </div>

      <RuntimeComponent
        v-for="component in visibleComponents"
        :key="component.id"
        :component="component"
        :schema="schema"
      />
    </RuntimeScaler>
  </main>
</template>

<style scoped>
.runtime-screen {
  width: 100vw;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #030712;
  color: #e5e7eb;
}

.runtime-screen__state {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  place-content: center;
  gap: 14px;
  padding: 24px;
  background: #07111f;
  color: #dbeafe;
  text-align: center;
}

.runtime-screen__state h1,
.runtime-screen__state p {
  max-width: 520px;
  margin: 0;
  overflow-wrap: anywhere;
}

.runtime-screen__state h1 {
  color: #f8fafc;
  font-size: 24px;
  line-height: 1.15;
}

.runtime-screen__state p {
  color: rgba(219, 234, 254, 0.74);
  font-size: 14px;
}

.runtime-screen__state button {
  justify-self: center;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(56, 189, 248, 0.48);
  border-radius: 6px;
  background: rgba(14, 165, 233, 0.16);
  color: #e0f2fe;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.runtime-screen__state button:hover {
  background: rgba(14, 165, 233, 0.24);
}

.runtime-screen__state button:focus-visible {
  outline: 3px solid rgba(125, 211, 252, 0.42);
  outline-offset: 2px;
}

.runtime-screen__skeleton {
  width: 320px;
  max-width: calc(100vw - 48px);
  height: 16px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.22);
}

.runtime-screen__skeleton--wide {
  width: 460px;
}

.runtime-screen__skeleton--short {
  width: 220px;
}

.runtime-screen__empty {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  gap: 8px;
  color: rgba(226, 232, 240, 0.72);
  pointer-events: none;
  text-align: center;
}

.runtime-screen__empty strong {
  color: #f8fafc;
  font-size: 28px;
}

.runtime-screen__empty span {
  font-size: 15px;
  font-weight: 700;
}
</style>
