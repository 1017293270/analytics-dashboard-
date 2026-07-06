<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bigScreenApi, type DashboardListItem, type DashboardRecord, type DashboardVersion } from '../api/bigScreenApi'
import { bigScreenText } from '../i18n/zh-CN'
import {
  createWorkbenchMetadata,
  toggleWorkbenchAvailability,
  type WorkbenchMetadata,
} from '../workbenches/workbenchMetadata'

type ListState = 'loading' | 'success' | 'error'
type RowAction = 'copy' | 'archive' | 'share' | 'versions' | 'rollback' | 'settings'
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
const visibleDashboards = computed(() => dashboards.value)
const hasDashboards = computed(() => listState.value === 'success' && visibleDashboards.value.length > 0)
const isEmpty = computed(() => listState.value === 'success' && visibleDashboards.value.length === 0)

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

function cloneWorkbenchMetadata(workbench: WorkbenchMetadata): WorkbenchMetadata {
  return {
    ...workbench,
    visibleRoles: [...workbench.visibleRoles],
    visibleRoleCodes: [...workbench.visibleRoleCodes],
  }
}

function createDashboardWorkbenchMetadata(dashboard: DashboardListItem) {
  return createWorkbenchMetadata({
    id: dashboard.id,
    name: dashboard.name,
    visibleRoles: dashboard.visibleRoles,
    availability: dashboard.availability,
  })
}

function getWorkbenchMetadata(dashboard: DashboardListItem) {
  return cloneWorkbenchMetadata(createDashboardWorkbenchMetadata(dashboard))
}

async function toggleDashboardWorkbenchAvailability(dashboard: DashboardListItem) {
  const current = getWorkbenchMetadata(dashboard)
  const next = toggleWorkbenchAvailability(current)
  setRowAction(dashboard.id, 'settings', true)
  errorMessage.value = ''

  try {
    const updated = await bigScreenApi.updateWorkbenchSettings(dashboard.id, {
      visibleRoles: current.visibleRoleCodes,
      availability: next.availabilityCode,
    })
    dashboards.value = dashboards.value.map((item) =>
      item.id === dashboard.id
        ? { ...item, visibleRoles: updated.visibleRoles, availability: updated.availability, mappedDashboardId: updated.mappedDashboardId }
        : item,
    )
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    setRowAction(dashboard.id, 'settings', false)
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
    const loadedDashboards = await bigScreenApi.listDashboards()
    dashboards.value = loadedDashboards
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
    await router.push(`/workbenches/${dashboard.id}`)
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
    await router.push(`/workbenches/${copied.id}`)
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
      <p class="dashboard-list__notice" role="note">启停状态由后台保存，角色可见性用于现场演示。</p>
      <table class="dashboard-list__table">
        <thead>
          <tr>
            <th scope="col">{{ bigScreenText.dashboardList.table.name }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.status }}</th>
            <th scope="col">使用角色</th>
            <th scope="col">启用状态</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.updated }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.published }}</th>
            <th scope="col">{{ bigScreenText.dashboardList.table.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="dashboard in visibleDashboards" :key="dashboard.id">
            <tr>
              <td class="dashboard-list__name-cell">
                <RouterLink class="dashboard-list__name-link" :to="`/workbenches/${dashboard.id}`">
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
              <td>
                <div class="dashboard-list__roles" aria-label="使用角色">
                  <span
                    v-for="role in getWorkbenchMetadata(dashboard).visibleRoles"
                    :key="role"
                    class="dashboard-list__role-chip"
                    data-testid="workbench-role-chip"
                  >
                    {{ role }}
                  </span>
                </div>
              </td>
              <td>
                <span
                  class="dashboard-list__availability"
                  :class="{ 'is-disabled': getWorkbenchMetadata(dashboard).availability === '已停用' }"
                >
                  {{ getWorkbenchMetadata(dashboard).availability }}
                </span>
              </td>
              <td>{{ formatDate(dashboard.updatedAt) }}</td>
              <td>{{ formatDate(dashboard.publishedAt) }}</td>
              <td>
                <div class="dashboard-list__actions">
                  <RouterLink class="dashboard-list__action" :to="`/workbenches/${dashboard.id}`">
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
                    type="button"
                    :disabled="isRowBusy(dashboard.id)"
                    :data-testid="`toggle-workbench-availability-${dashboard.id}`"
                    @click="toggleDashboardWorkbenchAvailability(dashboard)"
                  >
                    {{ isRowBusy(dashboard.id, 'settings') ? bigScreenText.common.actions.saving : getWorkbenchMetadata(dashboard).availability === '已启用' ? '停用' : '启用' }}
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
              <td colspan="7">
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
  gap: var(--space-5);
  padding: var(--space-page-y) var(--space-page);
  color: var(--color-text);
  animation: dashboard-list-enter 0.4s var(--ease-enter);
}

@keyframes dashboard-list-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-list__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
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
  color: var(--color-accent-700);
  font-size: var(--fs-label);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
}

.dashboard-list__title-group h1 {
  margin-top: var(--space-1);
  font-size: var(--fs-display);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  line-height: var(--lh-tight);
}

/* ── Buttons (shared) ── */
.dashboard-list__primary-action,
.dashboard-list__state button,
.dashboard-list__actions button,
.dashboard-list__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  text-decoration: none;
  white-space: nowrap;
  transition:
    background var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.dashboard-list__primary-action {
  flex: 0 0 auto;
  gap: 6px;
  padding: 0 var(--space-4);
  min-height: 38px;
  border-color: transparent;
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
  color: #fff;
  font-size: var(--fs-body);
  font-weight: var(--fw-black);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.28);
}

.dashboard-list__state button:hover:not(:disabled),
.dashboard-list__actions button:hover:not(:disabled),
.dashboard-list__action:hover:not(.is-disabled) {
  border-color: var(--color-border-accent);
  background: var(--color-accent-50);
  color: var(--color-accent-700);
}

.dashboard-list__primary-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(5, 150, 105, 0.36);
}

.dashboard-list__primary-action:disabled,
.dashboard-list__state button:disabled,
.dashboard-list__actions button:disabled,
.dashboard-list__action.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* ── Panel & state surfaces ── */
.dashboard-list__panel,
.dashboard-list__state {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.dashboard-list__panel {
  overflow: hidden;
}

.dashboard-list__state {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
  padding: var(--space-8);
}

.dashboard-list__state h2 {
  font-size: 24px;
  font-weight: var(--fw-black);
  line-height: var(--lh-tight);
}

.dashboard-list__state p {
  max-width: 560px;
  color: var(--color-text-muted);
  font-size: var(--fs-subtitle);
  overflow-wrap: anywhere;
}

.dashboard-list__state button {
  padding: 0 var(--space-4);
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
  padding: var(--space-3) var(--space-4) 0;
  font-size: var(--fs-subtitle);
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

.dashboard-list__notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-3) var(--space-4) 0;
  padding: var(--space-2) var(--space-3);
  border-left: 3px solid var(--color-accent-300);
  border-radius: var(--radius-sm);
  background: var(--color-accent-50);
  color: var(--color-accent-800);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

/* ── Skeleton ── */
.dashboard-list__skeleton-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(90px, 0.4fr) minmax(120px, 0.5fr);
  gap: var(--space-4);
  padding: 18px var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.dashboard-list__skeleton-row:last-child {
  border-bottom: 0;
}

.dashboard-list__skeleton {
  display: block;
  height: 16px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--color-border), var(--color-panel-muted), var(--color-border));
  background-size: 220% 100%;
  animation: dashboard-list-shimmer 1.2s var(--ease-enter) infinite;
}

.dashboard-list__skeleton--title {
  height: 22px;
}

.dashboard-list__skeleton--short {
  width: 70%;
}

/* ── Table ── */
.dashboard-list__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.dashboard-list__table th,
.dashboard-list__table td {
  padding: 14px var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--fs-subtitle);
  text-align: left;
  vertical-align: top;
}

.dashboard-list__table th {
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
  font-size: var(--fs-label);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-label);
  text-transform: none;
}

.dashboard-list__table tbody tr {
  transition: background var(--motion-fast) var(--ease-out);
}

.dashboard-list__table tbody tr:hover {
  background: var(--color-panel-sunken);
}

.dashboard-list__table tr:last-child td {
  border-bottom: 0;
}

.dashboard-list__name-link {
  display: block;
  color: var(--color-text);
  font-size: 15px;
  font-weight: var(--fw-black);
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
  font-size: var(--fs-label);
  overflow-wrap: anywhere;
}

.dashboard-list__share-link {
  color: var(--color-accent-700);
  font-weight: var(--fw-bold);
}

.dashboard-list__status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  max-width: 100%;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
}

.dashboard-list__status.is-published {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.dashboard-list__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.dashboard-list__role-chip,
.dashboard-list__availability {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  max-width: 100%;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
}

.dashboard-list__role-chip {
  background: var(--color-accent-50);
  color: var(--color-accent-700);
}

.dashboard-list__availability {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.dashboard-list__availability.is-disabled {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

/* ── Actions: horizontal flow, wraps gracefully ── */
.dashboard-list__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dashboard-list__actions button,
.dashboard-list__action {
  padding: 0 11px;
  font-size: var(--fs-label);
  line-height: 1;
}

.dashboard-list__danger {
  border-color: color-mix(in srgb, var(--color-danger) 24%, var(--color-border));
  background: var(--color-panel);
  color: var(--color-danger);
}

.dashboard-list__danger:hover:not(:disabled) {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

/* ── Version expansion ── */
.dashboard-list__version-row td {
  padding: 0;
  background: var(--color-panel-muted);
}

.dashboard-list__versions {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  min-width: 0;
}

.dashboard-list__versions-title,
.dashboard-list__versions-state {
  margin: 0;
}

.dashboard-list__versions-title {
  color: var(--color-text);
  font-size: var(--fs-label);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
}

.dashboard-list__versions-state {
  color: var(--color-text-muted);
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

.dashboard-list__versions-state.is-error {
  color: var(--color-danger);
}

.dashboard-list__version-list {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.dashboard-list__version-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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
  font-weight: var(--fw-black);
}

.dashboard-list__version-list small {
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
}

@media (max-width: 760px) {
  .dashboard-list {
    padding: var(--space-4);
  }

  .dashboard-list__header {
    align-items: stretch;
    flex-direction: column;
  }

  .dashboard-list__primary-action {
    width: 100%;
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
    padding: var(--space-4);
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
  .dashboard-list {
    animation: none;
  }

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
