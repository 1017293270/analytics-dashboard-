<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { bigScreenApi } from '../api/bigScreenApi'
import { bigScreenText } from '../i18n/zh-CN'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import { useDashboardHistoryStore } from '../stores/useDashboardHistoryStore'
import ComponentPalette from './ComponentPalette.vue'
import DesignerCanvas from './DesignerCanvas.vue'
import DesignerPropertyPanel from './DesignerPropertyPanel.vue'
import DesignerToolbar from './DesignerToolbar.vue'
import { clampZoom } from './designerLayout'

const LOCAL_DRAFT_NAME = bigScreenText.dashboardList.untitled

const route = useRoute()
const designer = useDashboardDesignerStore()
const history = useDashboardHistoryStore()
const loadError = ref<string | null>(null)
let loadSequence = 0
let loadController: AbortController | null = null

const routeDashboardId = computed(() => normalizeRouteParam(route.params.id))
const showInlineError = computed(() => Boolean(designer.error && !loadError.value && !designer.isLoading))

function normalizeRouteParam(value: unknown): string {
  if (Array.isArray(value)) return value[0] ?? 'new'

  return typeof value === 'string' && value ? value : 'new'
}

function resetHistory() {
  history.past = []
  history.future = []
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : bigScreenText.designer.shell.somethingWrong
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function createLocalDraft() {
  loadController?.abort()
  loadError.value = null
  designer.replaceLocalDraft(createDefaultDashboardSchema(), LOCAL_DRAFT_NAME)
  designer.zoom = clampZoom(0.5)
  designer.isLoading = false
  designer.isSaving = false
  resetHistory()
}

async function loadDashboardForRoute(id: string) {
  const sequence = ++loadSequence
  loadController?.abort()
  loadError.value = null

  if (id === 'new') {
    createLocalDraft()
    return
  }

  designer.invalidateInFlightSave()
  const controller = new AbortController()
  loadController = controller
  designer.isLoading = true
  designer.error = null

  try {
    const record = await bigScreenApi.getDashboard(id, { signal: controller.signal })
    if (sequence !== loadSequence || controller.signal.aborted) return

    designer.replaceDashboardForLoad(record)
  } catch (error) {
    if (sequence !== loadSequence || isAbortError(error)) return

    const message = getErrorMessage(error)
    designer.error = message
    loadError.value = message
  } finally {
    if (sequence === loadSequence) {
      designer.isLoading = false
      if (loadController === controller) {
        loadController = null
      }
    }
  }
}

function retryLoad() {
  void loadDashboardForRoute(routeDashboardId.value)
}

watch(routeDashboardId, (id) => void loadDashboardForRoute(id), { immediate: true })

onBeforeUnmount(() => {
  loadSequence += 1
  loadController?.abort()
})
</script>

<template>
  <main class="designer-shell">
    <DesignerToolbar />

    <section v-if="designer.isLoading" class="designer-shell__state" aria-busy="true">
      <div class="designer-shell__loader">
        <span class="designer-shell__skeleton designer-shell__skeleton--wide" />
        <span class="designer-shell__skeleton" />
        <span class="designer-shell__skeleton designer-shell__skeleton--short" />
      </div>
    </section>

    <section v-else-if="loadError" class="designer-shell__state designer-shell__state--error">
      <div class="designer-shell__error-card">
        <p class="designer-shell__eyebrow">{{ bigScreenText.designer.shell.loadFailed }}</p>
        <h1>{{ bigScreenText.designer.shell.loadUnavailable }}</h1>
        <p>{{ loadError }}</p>
        <div class="designer-shell__error-actions">
          <button type="button" @click="retryLoad">{{ bigScreenText.common.actions.retry }}</button>
          <button type="button" @click="createLocalDraft">{{ bigScreenText.common.actions.createLocalDraft }}</button>
        </div>
      </div>
    </section>

    <div v-else class="designer-shell__workspace">
      <ComponentPalette />
      <DesignerCanvas />
      <DesignerPropertyPanel />
    </div>

    <p v-if="showInlineError" class="designer-shell__toast" role="status">{{ designer.error }}</p>
  </main>
</template>

<style scoped>
.designer-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  color: var(--color-text);
}

.designer-shell__workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 320px;
  min-width: 0;
  min-height: 0;
}

.designer-shell__state {
  display: grid;
  place-items: center;
  min-height: 0;
  padding: 32px;
  background: #e7edf6;
}

.designer-shell__loader {
  display: grid;
  gap: 14px;
  width: min(520px, 80vw);
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.designer-shell__skeleton {
  display: block;
  width: 70%;
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 220% 100%;
  animation: designer-shell-shimmer 1.2s var(--ease-enter) infinite;
}

.designer-shell__skeleton--wide {
  width: 100%;
  height: 28px;
}

.designer-shell__skeleton--short {
  width: 42%;
}

.designer-shell__error-card {
  display: grid;
  gap: 12px;
  width: min(520px, 90vw);
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--color-danger) 32%, var(--color-border));
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.designer-shell__eyebrow,
.designer-shell__error-card h1,
.designer-shell__error-card p {
  margin: 0;
}

.designer-shell__eyebrow {
  color: var(--color-danger);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.designer-shell__error-card h1 {
  font-size: 26px;
  line-height: 1.1;
}

.designer-shell__error-card p:not(.designer-shell__eyebrow) {
  color: var(--color-text-muted);
  line-height: 1.5;
}

.designer-shell__error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.designer-shell__error-actions button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: white;
  color: var(--color-text);
  font-weight: 900;
  cursor: pointer;
}

.designer-shell__error-actions button:first-child {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
}

.designer-shell__toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 20;
  max-width: min(420px, calc(100vw - 36px));
  margin: 0;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--color-danger) 42%, var(--color-border));
  border-radius: 8px;
  background: white;
  color: var(--color-danger);
  box-shadow: var(--shadow-panel);
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

@keyframes designer-shell-shimmer {
  from {
    background-position: 120% 0;
  }

  to {
    background-position: -120% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .designer-shell__skeleton {
    animation: none;
  }
}

@media (max-width: 1100px) {
  .designer-shell {
    min-height: 760px;
  }

  .designer-shell__workspace {
    grid-template-columns: 220px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) 320px;
  }

  .designer-shell__workspace :deep(.property-panel) {
    grid-column: 1 / -1;
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
}

@media (max-width: 760px) {
  .designer-shell {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  .designer-shell__workspace {
    grid-template-columns: 1fr;
    grid-template-rows: 244px 420px 420px;
    min-height: 1084px;
  }

  .designer-shell__workspace :deep(.component-palette) {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .designer-shell__workspace :deep(.component-palette__list) {
    grid-auto-flow: column;
    grid-auto-columns: minmax(178px, 1fr);
    overflow-x: auto;
  }

  .designer-shell__workspace :deep(.designer-canvas__viewport) {
    padding: 16px;
  }

  .designer-shell__workspace :deep(.property-panel) {
    grid-column: auto;
  }
}
</style>
