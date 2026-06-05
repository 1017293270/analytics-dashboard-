<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bigScreenApi, type DashboardListItem, type DashboardRecord, type DashboardVersion } from '../api/bigScreenApi'
import { bigScreenText } from '../i18n/zh-CN'

type ListState = 'loading' | 'success' | 'error'
type RowAction = 'copy' | 'archive' | 'share' | 'versions' | 'rollback'
type RowActionState = Partial<Record<RowAction, boolean>>
type VersionState =
  | { status: 'loading'; versions: []; error: '' }
  | { status: 'success'; versions: DashboardVersion[]; error: '' }
  | { status: 'error'; versions: []; error: string }

const router = useRouter()
const dashboards = ref<DashboardListItem[]>([])
const listState = ref<ListState>('loading')
const errorMessage = ref('')
const isCreating = ref(false)
const activeRowActions = ref<Record<string, RowActionState>>({})
const shareLinks = ref<Record<string, string>>({})
const versionStates = ref<Record<string, VersionState>>({})

const isLoading = computed(() => listState.value === 'loading')
const hasDashboards = computed(() => listState.value === 'success' && dashboards.value.length > 0)
const isEmpty = computed(() => listState.value === 'success' && dashboards.value.length === 0)

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : bigScreenText.dashboardList.unavailable
}

function formatDate(value?: string | null) {
  if (!value) return bigScreenText.dashboardList.notPublished

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getStatusLabel(status: DashboardListItem['status']) {
  return status === 'published' ? bigScreenText.common.status.published : bigScreenText.common.status.draft
}

function toListItem(record: DashboardRecord): DashboardListItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
  }
}

function isRowBusy(id: string, action?: RowAction) {
  const rowActions = activeRowActions.value[id]
  if (!rowActions) return false
  return action ? Boolean(rowActions[action]) : Object.values(rowActions).some(Boolean)
}

function setRowAction(id: string, action: RowAction, isActive: boolean) {
  const nextRowActions = { ...(activeRowActions.value[id] ?? {}) }
  if (isActive) {
    nextRowActions[action] = true
  } else {
    delete nextRowActions[action]
  }

  activeRowActions.value = {
    ...activeRowActions.value,
    [id]: nextRowActions,
  }

  if (Object.keys(nextRowActions).length === 0) {
    const remainingActions = { ...activeRowActions.value }
    delete remainingActions[id]
    activeRowActions.value = remainingActions
  }
}

async function loadDashboards() {
  listState.value = 'loading'
  errorMessage.value = ''

  try {
    dashboards.value = await bigScreenApi.listDashboards()
    listState.value = 'success'
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
    listState.value = 'error'
  }
}

async function createDashboard() {
  isCreating.value = true
  errorMessage.value = ''

  try {
    const dashboard = await bigScreenApi.createDashboard({ name: bigScreenText.dashboardList.untitled })
    await router.push(`/big-screens/${dashboard.id}`)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
    listState.value = dashboards.value.length > 0 ? 'success' : 'error'
  } finally {
    isCreating.value = false
  }
}

async function copyDashboard(dashboard: DashboardListItem) {
  setRowAction(dashboard.id, 'copy', true)
  errorMessage.value = ''

  try {
    const copied = await bigScreenApi.copyDashboard(dashboard.id)
    await router.push(`/big-screens/${copied.id}`)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    setRowAction(dashboard.id, 'copy', false)
  }
}

async function archiveDashboard(dashboard: DashboardListItem) {
  const confirmed = window.confirm(bigScreenText.dashboardList.archiveConfirm(dashboard.name))
  if (!confirmed) return

  setRowAction(dashboard.id, 'archive', true)
  errorMessage.value = ''

  try {
    await bigScreenApi.deleteDashboard(dashboard.id)
    dashboards.value = dashboards.value.filter((item) => item.id !== dashboard.id)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    setRowAction(dashboard.id, 'archive', false)
  }
}

async function createShareLink(dashboard: DashboardListItem) {
  if (dashboard.status !== 'published') return

  setRowAction(dashboard.id, 'share', true)
  errorMessage.value = ''

  try {
    const share = await bigScreenApi.createShareLink(dashboard.id)
    shareLinks.value = { ...shareLinks.value, [dashboard.id]: share.url }
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    setRowAction(dashboard.id, 'share', false)
  }
}

async function loadVersions(dashboard: DashboardListItem) {
  setRowAction(dashboard.id, 'versions', true)
  versionStates.value = {
    ...versionStates.value,
    [dashboard.id]: { status: 'loading', versions: [], error: '' },
  }

  try {
    const versions = await bigScreenApi.listVersions(dashboard.id)
    versionStates.value = {
      ...versionStates.value,
      [dashboard.id]: { status: 'success', versions, error: '' },
    }
  } catch (error) {
    versionStates.value = {
      ...versionStates.value,
      [dashboard.id]: { status: 'error', versions: [], error: getErrorMessage(error) },
    }
  } finally {
    setRowAction(dashboard.id, 'versions', false)
  }
}

async function rollbackVersion(dashboard: DashboardListItem, version: DashboardVersion) {
  const confirmed = window.confirm(bigScreenText.dashboardList.rollbackConfirm(dashboard.name, version.version))
  if (!confirmed) return

  setRowAction(dashboard.id, 'rollback', true)
  errorMessage.value = ''

  try {
    const rolledBack = await bigScreenApi.rollbackVersion(dashboard.id, version.version)
    dashboards.value = dashboards.value.map((item) =>
      item.id === dashboard.id ? { ...item, ...toListItem(rolledBack) } : item,
    )
    await loadVersions({ ...dashboard, ...toListItem(rolledBack) })
  } catch (error) {
    versionStates.value = {
      ...versionStates.value,
      [dashboard.id]: { status: 'error', versions: [], error: getErrorMessage(error) },
    }
  } finally {
    setRowAction(dashboard.id, 'rollback', false)
  }
}

onMounted(() => {
  void loadDashboards()
})
</script>

<template>
  <main class="dashboard-list">
    <header class="dashboard-list__header">
      <div class="dashboard-list__title-group">
        <h1>{{ bigScreenText.dashboardList.dashboardLibrary }}</h1>
      </div>
      <button
        class="dashboard-list__primary-action"
        type="button"
        :disabled="isCreating"
        data-testid="create-dashboard-button"
        @click="createDashboard"
      >
        {{ isCreating ? bigScreenText.common.actions.creating : bigScreenText.dashboardList.newBigScreen }}
      </button>
    </header>

    <section v-if="isLoading" class="dashboard-list__panel" aria-busy="true">
      <div v-for="item in 4" :key="item" class="dashboard-list__skeleton-row">
        <span class="dashboard-list__skeleton dashboard-list__skeleton--title" />
        <span class="dashboard-list__skeleton" />
        <span class="dashboard-list__skeleton dashboard-list__skeleton--short" />
      </div>
    </section>

    <section v-else-if="listState === 'error'" class="dashboard-list__state dashboard-list__state--error">
      <p class="dashboard-list__eyebrow">{{ bigScreenText.dashboardList.loadFailed }}</p>
      <h2>{{ bigScreenText.dashboardList.unavailable }}</h2>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadDashboards">{{ bigScreenText.common.actions.retry }}</button>
    </section>

    <section v-else-if="isEmpty" class="dashboard-list__state">
      <p class="dashboard-list__eyebrow">{{ bigScreenText.dashboardList.noDashboards }}</p>
      <h2>{{ bigScreenText.dashboardList.createFirst }}</h2>
      <p>{{ bigScreenText.dashboardList.emptyDescription }}</p>
      <button type="button" :disabled="isCreating" @click="createDashboard">
        {{ isCreating ? bigScreenText.common.actions.creating : bigScreenText.dashboardList.newBigScreen }}
      </button>
    </section>

    <section v-else-if="hasDashboards" class="dashboard-list__panel" :aria-label="bigScreenText.dashboardList.dashboardLibrary">
      <p v-if="errorMessage" class="dashboard-list__inline-error" role="status">{{ errorMessage }}</p>
      <table class="dashboard-list__table">
        <thead>
          <tr>
            <th scope="col">{{ bigScreenText.dashboardList.table.name }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.status }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.updated }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.published }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="dashboard in dashboards" :key="dashboard.id">
            <tr>
              <td class="dashboard-list__name-cell">
                <RouterLink class="dashboard-list__name-link" :to="`/big-screens/${dashboard.id}`">
                  {{ dashboard.name }}
                </RouterLink>
                <span v-if="dashboard.description" class="dashboard-list__description">
                  {{ dashboard.description }}
                </span>
                <a
                  v-if="shareLinks[dashboard.id]"
                  class="dashboard-list__share-link"
                  :href="shareLinks[dashboard.id]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {{ shareLinks[dashboard.id] }}
                </a>
              </td>
              <td>
                <span class="dashboard-list__status" :class="`is-${dashboard.status}`">
                  {{ getStatusLabel(dashboard.status) }}
                </span>
              </td>
              <td>{{ formatDate(dashboard.updatedAt) }}</td>
              <td>{{ formatDate(dashboard.publishedAt) }}</td>
              <td>
                <div class="dashboard-list__actions">
                  <RouterLink class="dashboard-list__action" :to="`/big-screens/${dashboard.id}`">
                    {{ bigScreenText.common.actions.edit }}
                  </RouterLink>
                  <a
                    class="dashboard-list__action"
                    :class="{ 'is-disabled': dashboard.status !== 'published' }"
                    :href="dashboard.status === 'published' ? `/runtime/${dashboard.id}` : undefined"
                    target="_blank"
                    rel="noreferrer"
                    :aria-disabled="dashboard.status !== 'published'"
                    :tabindex="dashboard.status === 'published' ? 0 : -1"
                    @click="dashboard.status !== 'published' && $event.preventDefault()"
                  >
                    {{ bigScreenText.common.actions.runtime }}
                  </a>
                  <button
                    type="button"
                    :disabled="isRowBusy(dashboard.id)"
                    @click="copyDashboard(dashboard)"
                  >
                    {{ isRowBusy(dashboard.id, 'copy') ? bigScreenText.common.actions.copying : bigScreenText.common.actions.copy }}
                  </button>
                  <button
                    type="button"
                    :disabled="isRowBusy(dashboard.id)"
                    @click="loadVersions(dashboard)"
                  >
                    {{ isRowBusy(dashboard.id, 'versions') ? bigScreenText.common.actions.loading : bigScreenText.common.actions.versions }}
                  </button>
                  <button
                    type="button"
                    :disabled="dashboard.status !== 'published' || isRowBusy(dashboard.id)"
                    @click="createShareLink(dashboard)"
                  >
                    {{ isRowBusy(dashboard.id, 'share') ? bigScreenText.common.actions.sharing : bigScreenText.common.actions.share }}
                  </button>
                  <button
                    class="dashboard-list__danger"
                    type="button"
                    :disabled="isRowBusy(dashboard.id)"
                    @click="archiveDashboard(dashboard)"
                  >
                    {{ isRowBusy(dashboard.id, 'archive') ? bigScreenText.common.actions.archiving : bigScreenText.common.actions.archive }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="versionStates[dashboard.id]" class="dashboard-list__version-row">
              <td colspan="5">
                <div class="dashboard-list__versions" :aria-busy="versionStates[dashboard.id].status === 'loading'">
                  <p class="dashboard-list__versions-title">{{ bigScreenText.common.actions.versions }}</p>
                  <p v-if="versionStates[dashboard.id].status === 'loading'" class="dashboard-list__versions-state">
                    {{ bigScreenText.dashboardList.versionLoading }}
                  </p>
                  <p v-else-if="versionStates[dashboard.id].status === 'error'" class="dashboard-list__versions-state is-error">
                    {{ versionStates[dashboard.id].error }}
                  </p>
                  <p
                    v-else-if="versionStates[dashboard.id].versions.length === 0"
                    class="dashboard-list__versions-state"
                  >
                    {{ bigScreenText.dashboardList.noPublishedVersions }}
                  </p>
                  <ul v-else class="dashboard-list__version-list">
                    <li v-for="version in versionStates[dashboard.id].versions" :key="version.id">
                      <span>
                        v{{ version.version }}
                        <small>{{ version.publishNote || bigScreenText.dashboardList.noPublishNote }} - {{ formatDate(version.createdAt) }}</small>
                      </span>
                      <button
                        type="button"
                        :disabled="isRowBusy(dashboard.id)"
                        @click="rollbackVersion(dashboard, version)"
                      >
                        {{ isRowBusy(dashboard.id, 'rollback') ? bigScreenText.common.actions.rollingBack : bigScreenText.common.actions.rollback }}
                      </button>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>
  </main>
</template>

<style scoped>
.dashboard-list {
  display: grid;
  align-content: start;
  gap: 18px;
  min-height: 100vh;
  padding: 28px;
  background:
    linear-gradient(180deg, rgba(219, 234, 254, 0.72), rgba(248, 250, 252, 0) 280px),
    var(--color-page);
  color: var(--color-text);
}

.dashboard-list__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  width: min(1180px, 100%);
  margin: 0 auto;
}

.dashboard-list__title-group,
.dashboard-list__state,
.dashboard-list__name-cell {
  min-width: 0;
}

.dashboard-list__eyebrow,
.dashboard-list__title-group h1,
.dashboard-list__state h2,
.dashboard-list__state p {
  margin: 0;
}

.dashboard-list__eyebrow {
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.dashboard-list__title-group h1 {
  font-family: "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif;
  font-size: 30px;
  font-weight: 760;
  letter-spacing: 0;
  line-height: 1.18;
}

.dashboard-list__primary-action,
.dashboard-list__state button,
.dashboard-list__actions button,
.dashboard-list__action {
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-panel);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 850;
  text-decoration: none;
  transition:
    background var(--motion-fast) var(--ease-enter),
    border-color var(--motion-fast) var(--ease-enter),
    color var(--motion-fast) var(--ease-enter),
    box-shadow var(--motion-fast) var(--ease-enter);
}

.dashboard-list__primary-action {
  flex: 0 0 auto;
  padding: 0 16px;
  border-color: color-mix(in srgb, var(--color-accent) 70%, #0f172a);
  background: var(--color-accent);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}

.dashboard-list__primary-action:hover:not(:disabled),
.dashboard-list__state button:hover:not(:disabled),
.dashboard-list__actions button:hover:not(:disabled),
.dashboard-list__action:hover:not(.is-disabled) {
  border-color: color-mix(in srgb, var(--color-accent) 42%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 9%, var(--color-panel));
}

.dashboard-list__primary-action:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 88%, #0f172a);
}

.dashboard-list__primary-action:disabled,
.dashboard-list__state button:disabled,
.dashboard-list__actions button:disabled,
.dashboard-list__action.is-disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.dashboard-list__panel,
.dashboard-list__state {
  width: min(1180px, 100%);
  margin: 0 auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: color-mix(in srgb, var(--color-panel) 96%, #eff6ff);
  box-shadow: var(--shadow-panel);
}

.dashboard-list__panel {
  overflow: hidden;
}

.dashboard-list__state {
  display: grid;
  justify-items: start;
  gap: 12px;
  padding: 30px;
}

.dashboard-list__state h2 {
  font-size: 26px;
  line-height: 1.1;
}

.dashboard-list__state p {
  max-width: 560px;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.dashboard-list__state button {
  padding: 0 14px;
}

.dashboard-list__state--error {
  border-color: color-mix(in srgb, var(--color-danger) 30%, var(--color-border));
}

.dashboard-list__state--error .dashboard-list__eyebrow,
.dashboard-list__inline-error,
.dashboard-list__danger {
  color: var(--color-danger);
}

.dashboard-list__inline-error {
  margin: 0;
  padding: 12px 16px 0;
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.dashboard-list__skeleton-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(90px, 0.4fr) minmax(120px, 0.5fr);
  gap: 16px;
  padding: 18px;
  border-bottom: 1px solid var(--color-border);
}

.dashboard-list__skeleton-row:last-child {
  border-bottom: 0;
}

.dashboard-list__skeleton {
  display: block;
  height: 16px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 220% 100%;
  animation: dashboard-list-shimmer 1.2s var(--ease-enter) infinite;
}

.dashboard-list__skeleton--title {
  height: 22px;
}

.dashboard-list__skeleton--short {
  width: 70%;
}

.dashboard-list__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.dashboard-list__table th,
.dashboard-list__table td {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: left;
  vertical-align: top;
}

.dashboard-list__table th {
  background: color-mix(in srgb, var(--color-panel-muted) 84%, #dbeafe);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.dashboard-list__table tr:last-child td {
  border-bottom: 0;
}

.dashboard-list__name-link {
  display: block;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-decoration: none;
}

.dashboard-list__name-link:hover {
  color: var(--color-accent);
}

.dashboard-list__description,
.dashboard-list__share-link {
  display: block;
  margin-top: 6px;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.dashboard-list__share-link {
  color: var(--color-accent);
  font-weight: 800;
}

.dashboard-list__status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  max-width: 100%;
  padding: 0 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text-muted) 12%, white);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 900;
}

.dashboard-list__status.is-published {
  background: color-mix(in srgb, var(--color-success) 14%, white);
  color: var(--color-success);
}

.dashboard-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.dashboard-list__actions button,
.dashboard-list__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 0 10px;
  font-size: 12px;
  line-height: 1;
}

.dashboard-list__danger {
  border-color: color-mix(in srgb, var(--color-danger) 28%, var(--color-border));
  background: color-mix(in srgb, var(--color-danger) 6%, var(--color-panel));
}

.dashboard-list__version-row td {
  padding: 0;
  background: color-mix(in srgb, var(--color-panel-muted) 72%, #eff6ff);
}

.dashboard-list__versions {
  display: grid;
  gap: 10px;
  padding: 14px 16px 16px;
  min-width: 0;
}

.dashboard-list__versions-title,
.dashboard-list__versions-state {
  margin: 0;
}

.dashboard-list__versions-title {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.dashboard-list__versions-state {
  color: var(--color-text-muted);
  font-weight: 800;
  overflow-wrap: anywhere;
}

.dashboard-list__versions-state.is-error {
  color: var(--color-danger);
}

.dashboard-list__version-list {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.dashboard-list__version-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-panel);
}

.dashboard-list__version-list span,
.dashboard-list__version-list small {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.dashboard-list__version-list span {
  color: var(--color-text);
  font-weight: 900;
}

.dashboard-list__version-list small {
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 760px) {
  .dashboard-list {
    padding: 18px;
  }

  .dashboard-list__header {
    align-items: stretch;
    flex-direction: column;
  }

  .dashboard-list__primary-action {
    width: 100%;
  }

  .dashboard-list__title-group h1 {
    font-size: 26px;
  }

  .dashboard-list__table,
  .dashboard-list__table thead,
  .dashboard-list__table tbody,
  .dashboard-list__table tr,
  .dashboard-list__table th,
  .dashboard-list__table td {
    display: block;
  }

  .dashboard-list__table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .dashboard-list__table tr {
    padding: 14px;
    border-bottom: 1px solid var(--color-border);
  }

  .dashboard-list__table tr:last-child {
    border-bottom: 0;
  }

  .dashboard-list__table td {
    padding: 7px 0;
    border-bottom: 0;
  }

  .dashboard-list__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-list__version-row {
    padding: 0;
  }

  .dashboard-list__version-row td {
    padding: 0;
  }

  .dashboard-list__version-list li {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-list__skeleton {
    animation: none;
  }
}

@keyframes dashboard-list-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: -100% 0;
  }
}
</style>
