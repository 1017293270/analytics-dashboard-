<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bigScreenApi, type DashboardListItem } from '../api/bigScreenApi'

type ListState = 'loading' | 'success' | 'error'
type RowAction = 'copy' | 'archive' | 'share'

const router = useRouter()
const dashboards = ref<DashboardListItem[]>([])
const listState = ref<ListState>('loading')
const errorMessage = ref('')
const isCreating = ref(false)
const activeRowAction = ref<{ id: string; action: RowAction } | null>(null)
const shareLinks = ref<Record<string, string>>({})

const isLoading = computed(() => listState.value === 'loading')
const hasDashboards = computed(() => listState.value === 'success' && dashboards.value.length > 0)
const isEmpty = computed(() => listState.value === 'success' && dashboards.value.length === 0)

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Dashboard library unavailable'
}

function formatDate(value?: string | null) {
  if (!value) return 'Not published'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getStatusLabel(status: DashboardListItem['status']) {
  return status === 'published' ? 'Published' : 'Draft'
}

function isRowBusy(id: string, action?: RowAction) {
  if (!activeRowAction.value || activeRowAction.value.id !== id) return false
  return action ? activeRowAction.value.action === action : true
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
    const dashboard = await bigScreenApi.createDashboard({ name: 'Untitled Dashboard' })
    await router.push(`/big-screens/${dashboard.id}`)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
    listState.value = dashboards.value.length > 0 ? 'success' : 'error'
  } finally {
    isCreating.value = false
  }
}

async function copyDashboard(dashboard: DashboardListItem) {
  activeRowAction.value = { id: dashboard.id, action: 'copy' }
  errorMessage.value = ''

  try {
    const copied = await bigScreenApi.copyDashboard(dashboard.id)
    await router.push(`/big-screens/${copied.id}`)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    activeRowAction.value = null
  }
}

async function archiveDashboard(dashboard: DashboardListItem) {
  const confirmed = window.confirm(`Archive "${dashboard.name}"? It will be removed from the library.`)
  if (!confirmed) return

  activeRowAction.value = { id: dashboard.id, action: 'archive' }
  errorMessage.value = ''

  try {
    await bigScreenApi.deleteDashboard(dashboard.id)
    dashboards.value = dashboards.value.filter((item) => item.id !== dashboard.id)
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    activeRowAction.value = null
  }
}

async function createShareLink(dashboard: DashboardListItem) {
  if (dashboard.status !== 'published') return

  activeRowAction.value = { id: dashboard.id, action: 'share' }
  errorMessage.value = ''

  try {
    const share = await bigScreenApi.createShareLink(dashboard.id)
    shareLinks.value = { ...shareLinks.value, [dashboard.id]: share.url }
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    activeRowAction.value = null
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
        <p class="dashboard-list__eyebrow">Big screens</p>
        <h1>Dashboard library</h1>
      </div>
      <button
        class="dashboard-list__primary-action"
        type="button"
        :disabled="isCreating"
        data-testid="create-dashboard-button"
        @click="createDashboard"
      >
        {{ isCreating ? 'Creating' : 'New Big Screen' }}
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
      <p class="dashboard-list__eyebrow">Load failed</p>
      <h2>Dashboard library unavailable</h2>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadDashboards">Retry</button>
    </section>

    <section v-else-if="isEmpty" class="dashboard-list__state">
      <p class="dashboard-list__eyebrow">No dashboards</p>
      <h2>Create the first big screen</h2>
      <p>Your published command center screens and drafts will appear here.</p>
      <button type="button" :disabled="isCreating" @click="createDashboard">
        {{ isCreating ? 'Creating' : 'New Big Screen' }}
      </button>
    </section>

    <section v-else-if="hasDashboards" class="dashboard-list__panel" aria-label="Dashboard library">
      <p v-if="errorMessage" class="dashboard-list__inline-error" role="status">{{ errorMessage }}</p>
      <table class="dashboard-list__table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
            <th scope="col">Updated</th>
            <th scope="col">Published</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dashboard in dashboards" :key="dashboard.id">
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
                <RouterLink class="dashboard-list__action" :to="`/big-screens/${dashboard.id}`">Edit</RouterLink>
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
                  Runtime
                </a>
                <button
                  type="button"
                  :disabled="isRowBusy(dashboard.id)"
                  @click="copyDashboard(dashboard)"
                >
                  {{ isRowBusy(dashboard.id, 'copy') ? 'Copying' : 'Copy' }}
                </button>
                <button
                  type="button"
                  :disabled="dashboard.status !== 'published' || isRowBusy(dashboard.id)"
                  @click="createShareLink(dashboard)"
                >
                  {{ isRowBusy(dashboard.id, 'share') ? 'Sharing' : 'Share' }}
                </button>
                <button
                  class="dashboard-list__danger"
                  type="button"
                  :disabled="isRowBusy(dashboard.id)"
                  @click="archiveDashboard(dashboard)"
                >
                  {{ isRowBusy(dashboard.id, 'archive') ? 'Archiving' : 'Archive' }}
                </button>
              </div>
            </td>
          </tr>
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
  margin-top: 4px;
  font-size: 34px;
  line-height: 1.05;
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
    font-size: 28px;
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
