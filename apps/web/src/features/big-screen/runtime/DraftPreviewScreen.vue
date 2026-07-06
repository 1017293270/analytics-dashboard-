<script setup lang="ts">
import type { DashboardSchema } from '@analytics/shared'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { bigScreenApi } from '../api/bigScreenApi'
import { getCanvasBackgroundStyle } from '../designer/designerLayout'
import { bigScreenText } from '../i18n/zh-CN'
import RuntimeComponent from './RuntimeComponent.vue'
import RuntimeScaler from './RuntimeScaler.vue'

type DraftPreviewLoadState =
  | { status: 'loading'; schema: null; error: null }
  | { status: 'success'; schema: DashboardSchema; error: null }
  | { status: 'error'; schema: null; error: string }

const route = useRoute()
const loadState = ref<DraftPreviewLoadState>({ status: 'loading', schema: null, error: null })
let requestSerial = 0

const dashboardId = computed(() => {
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

async function loadDraftPreview() {
  const serial = requestSerial + 1
  requestSerial = serial
  const id = dashboardId.value

  if (!id) {
    loadState.value = { status: 'error', schema: null, error: bigScreenText.runtime.missingDraftPreview }
    return
  }

  loadState.value = { status: 'loading', schema: null, error: null }

  try {
    const dashboard = await bigScreenApi.getDashboard(id)
    if (serial !== requestSerial || dashboardId.value !== id) return

    loadState.value = { status: 'success', schema: dashboard.draftSchema, error: null }
  } catch (errorValue) {
    if (serial !== requestSerial || dashboardId.value !== id) return

    const message = errorValue instanceof Error ? errorValue.message : bigScreenText.runtime.draftPreviewUnavailable
    loadState.value = { status: 'error', schema: null, error: message }
  }
}

async function enterFullscreen() {
  const element = document.documentElement
  if (!element.requestFullscreen) return

  try {
    await element.requestFullscreen()
  } catch {
    // Browser fullscreen can be denied outside a direct user gesture.
  }
}

watch(dashboardId, () => {
  void loadDraftPreview()
}, { immediate: true })
</script>

<template>
  <main class="draft-preview-screen" data-testid="draft-preview-screen">
    <button
      class="draft-preview-screen__fullscreen"
      type="button"
      data-testid="draft-preview-fullscreen-button"
      @click="enterFullscreen"
    >
      全屏
    </button>

    <div v-if="isLoading" class="draft-preview-screen__state" aria-busy="true">
      <div class="draft-preview-screen__skeleton draft-preview-screen__skeleton--wide" />
      <div class="draft-preview-screen__skeleton" />
      <div class="draft-preview-screen__skeleton draft-preview-screen__skeleton--short" />
    </div>

    <section v-else-if="error" class="draft-preview-screen__state draft-preview-screen__state--error">
      <h1>{{ bigScreenText.runtime.draftPreviewUnavailableTitle }}</h1>
      <p>{{ error }}</p>
      <button type="button" @click="loadDraftPreview">{{ bigScreenText.common.actions.retry }}</button>
    </section>

    <RuntimeScaler
      v-else-if="schema"
      :canvas-width="schema.canvas.width"
      :canvas-height="schema.canvas.height"
      :scale-mode="schema.canvas.scaleMode"
      :background="canvasBackground"
    >
      <div v-if="visibleComponents.length === 0" class="draft-preview-screen__empty">
        <strong>{{ bigScreenText.runtime.emptyTitle }}</strong>
        <span>{{ bigScreenText.runtime.emptyDescription }}</span>
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
.draft-preview-screen {
  width: 100vw;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #030712;
  color: #e5e7eb;
}

.draft-preview-screen__fullscreen {
  position: fixed;
  top: 24px;
  right: 28px;
  z-index: 50;
  min-width: 58px;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(167, 243, 208, 0.24);
  border-radius: 4px;
  background: rgba(3, 7, 18, 0.36);
  color: rgba(220, 252, 231, 0.9);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
}

.draft-preview-screen__fullscreen:hover {
  border-color: rgba(167, 243, 208, 0.42);
  background: rgba(6, 95, 70, 0.22);
  color: #f0fdf4;
}

.draft-preview-screen__fullscreen:focus-visible {
  outline: 3px solid rgba(125, 211, 252, 0.4);
  outline-offset: 2px;
}

.draft-preview-screen__state {
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

.draft-preview-screen__state h1,
.draft-preview-screen__state p {
  max-width: 520px;
  margin: 0;
  overflow-wrap: anywhere;
}

.draft-preview-screen__state h1 {
  color: #f8fafc;
  font-size: 24px;
  line-height: 1.15;
}

.draft-preview-screen__state p {
  color: rgba(219, 234, 254, 0.74);
  font-size: 14px;
}

.draft-preview-screen__state button {
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

.draft-preview-screen__state button:hover {
  background: rgba(14, 165, 233, 0.24);
}

.draft-preview-screen__state button:focus-visible {
  outline: 3px solid rgba(125, 211, 252, 0.42);
  outline-offset: 2px;
}

.draft-preview-screen__skeleton {
  width: 320px;
  max-width: calc(100vw - 48px);
  height: 16px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.22);
}

.draft-preview-screen__skeleton--wide {
  width: 460px;
}

.draft-preview-screen__skeleton--short {
  width: 220px;
}

.draft-preview-screen__empty {
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

.draft-preview-screen__empty strong {
  color: #f8fafc;
  font-size: 28px;
}

.draft-preview-screen__empty span {
  font-size: 15px;
  font-weight: 700;
}
</style>
