<script setup lang="ts">
import { DataAnalysis, Edit, Link, Plus, Refresh, Search, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { bigScreenApi, type DashboardListItem } from '../big-screen/api/bigScreenApi'
import { dashboardApi, type DataDashboardListPayload } from './dashboardApi'
import {
  applyDashboardFilters,
  createDashboardDraft,
  dashboardRoleFilters,
  dashboardRoles,
  dashboardSources,
  dashboardStatuses,
  dashboardSummary,
  dashboardTypes,
  defaultDashboardFilters,
  embeddedDashboardDraftPreviewMetrics,
  isValidDashboardEmbedUrl,
  mapDashboardDraftToCreateInput,
  mapDashboardDraftToUpdateInput,
  mapDashboardFiltersToQuery,
  mapDataDashboardRow,
  mapDataDashboardSummary,
  validateDashboardDraft,
  type DashboardDraft,
  type DashboardSource,
  type DashboardStatus,
  type ManagedDashboard,
} from './dashboardData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const dashboards = ref<ManagedDashboard[]>([])
const summary = ref(dashboardSummary([]))
const filters = reactive({ ...defaultDashboardFilters })
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive<DashboardDraft>(createDashboardDraft())
const previewMetrics = ref<ManagedDashboard['metrics']>([])
const roleWorkbenches = ref<DashboardListItem[]>([])
const workbenchLoadWarning = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const fieldErrors = reactive({
  name: '',
  url: '',
  visibleRoles: '',
})

const filteredDashboards = computed(() => applyDashboardFilters(dashboards.value, filters))
const drawerTitle = computed(() => (editingId.value ? '配置数据看板' : '配置第三方看板'))

const roleWorkbenchFallbacks = [
  {
    id: 'dashboard-all',
    name: '未来实验学校数据总览',
    role: '全员',
    description: '校级治理、设备运维、教师发展和学生成长统一浏览',
  },
  {
    id: 'dashboard-electro',
    name: '电教主任设备运维工作台',
    role: '电教主任',
    description: '设备在线、告警闭环、应用使用和一体机巡检态势',
  },
  {
    id: 'dashboard-moral',
    name: '德育主任学生成长工作台',
    role: '德育主任',
    description: '学生成长档案、德育活动、预警跟进和班级表现',
  },
  {
    id: 'dashboard-research',
    name: '教研主任教师发展工作台',
    role: '教研主任',
    description: '教研活动、教师培训、资源共建和课堂质量指标',
  },
] as const

const roleWorkbenchCards = computed(() => {
  const workbenchesById = new Map(roleWorkbenches.value.map((workbench) => [workbench.id, workbench]))

  return roleWorkbenchFallbacks.map((fallback) => {
    const workbench = workbenchesById.get(fallback.id)
    const isAccessible = Boolean(workbench) && workbench?.availability !== 'disabled'
    const status = workbench?.availability === 'disabled'
      ? '已停用'
      : isAccessible
        ? '可浏览'
        : '当前角色不可浏览'

    return {
      ...fallback,
      isAccessible,
      status,
      path: `/workbenches/${fallback.id}/preview`,
    }
  })
})

const defaultDashboardCards = computed(() => dashboards.value.filter((dashboard) => dashboard.isDefault))
const embeddedDashboardCards = computed(() =>
  dashboards.value.filter((dashboard) => dashboard.source === '第三方嵌入'),
)
const overviewStats = computed(() => [
  { label: '角色工作台', value: roleWorkbenchCards.value.length, detail: '按角色浏览' },
  { label: '校级看板', value: summary.value.total, detail: '不少于 6 个' },
  { label: '第三方融合', value: summary.value.embedded, detail: '外部链接接入' },
  { label: '已启用', value: summary.value.enabled, detail: '现场可演示' },
])

function getStatusTagType(status: DashboardStatus): TagType {
  return status === '已启用' ? 'success' : 'info'
}

function getSourceTagType(source: DashboardSource): TagType {
  return source === '第三方嵌入' ? 'primary' : 'info'
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function applyDashboardPayload(payload: DataDashboardListPayload) {
  dashboards.value = payload.items.map(mapDataDashboardRow)
  summary.value = mapDataDashboardSummary(payload.summary, dashboards.value)
}

function updateSummaryFromDashboards() {
  summary.value = dashboardSummary(dashboards.value)
}

function replaceDashboard(row: Parameters<typeof mapDataDashboardRow>[0]) {
  const dashboard = mapDataDashboardRow(row)
  const existingIndex = dashboards.value.findIndex((item) => item.id === dashboard.id)

  if (existingIndex >= 0) {
    dashboards.value.splice(existingIndex, 1, dashboard)
  } else {
    dashboards.value.push(dashboard)
  }

  updateSummaryFromDashboards()
}

async function loadDashboards() {
  isLoading.value = true

  try {
    applyDashboardPayload(await dashboardApi.listDashboards())
  } catch (error) {
    ElMessage.error(errorMessage(error, '数据看板加载失败'))
  } finally {
    isLoading.value = false
  }
}

async function loadWorkbenches() {
  workbenchLoadWarning.value = ''

  try {
    roleWorkbenches.value = await bigScreenApi.listDashboards({ credentials: 'include' })
  } catch {
    roleWorkbenches.value = []
    workbenchLoadWarning.value = '角色工作台暂用演示兜底数据'
  }
}

async function loadDataCenter() {
  await Promise.all([loadDashboards(), loadWorkbenches()])
}

async function resetDemoDashboards() {
  isLoading.value = true
  drawerVisible.value = false
  editingId.value = null
  Object.assign(draft, createDashboardDraft())
  previewMetrics.value = []
  resetFieldErrors()

  try {
    applyDashboardPayload(await dashboardApi.resetDemoDashboards())
    ElMessage.success('已恢复默认数据看板')
  } catch (error) {
    ElMessage.error(errorMessage(error, '恢复默认数据看板失败'))
  } finally {
    isLoading.value = false
  }
}

async function searchDashboards() {
  isLoading.value = true

  try {
    applyDashboardPayload(await dashboardApi.listDashboards(mapDashboardFiltersToQuery(filters)))
  } catch (error) {
    ElMessage.error(errorMessage(error, '数据看板查询失败'))
  } finally {
    isLoading.value = false
  }
}

async function resetFilters() {
  Object.assign(filters, { ...defaultDashboardFilters })
  await loadDashboards()
}

function resetFieldErrors() {
  Object.assign(fieldErrors, {
    name: '',
    url: '',
    visibleRoles: '',
  })
}

function setFieldErrors(errors: string[]) {
  resetFieldErrors()

  for (const error of errors) {
    if (error.includes('看板名称')) fieldErrors.name = error
    if (error.includes('链接')) fieldErrors.url = error
    if (error.includes('可见角色')) fieldErrors.visibleRoles = error
  }
}

function openPreview(dashboard: ManagedDashboard) {
  Object.assign(draft, {
    name: dashboard.name,
    type: dashboard.type,
    source: dashboard.source,
    url: dashboard.url,
    isDefault: dashboard.isDefault,
    visibleRoles: [...dashboard.visibleRoles],
    status: dashboard.status,
  })
  previewMetrics.value = dashboard.metrics.map((metric) => ({ ...metric }))
  resetFieldErrors()
  editingId.value = dashboard.id
  drawerVisible.value = true
}

function openEmbedDrawer() {
  Object.assign(draft, createDashboardDraft('第三方嵌入'))
  previewMetrics.value = embeddedDashboardDraftPreviewMetrics.map((metric) => ({ ...metric }))
  resetFieldErrors()
  editingId.value = null
  drawerVisible.value = true
}

async function saveDashboard() {
  const errors = validateDashboardDraft(draft)

  if (errors.length > 0) {
    setFieldErrors(errors)
    ElMessage.error(errors[0])
    return
  }

  isSaving.value = true

  try {
    if (editingId.value) {
      replaceDashboard(await dashboardApi.updateDashboard(editingId.value, mapDashboardDraftToUpdateInput(draft)))
    } else {
      replaceDashboard(await dashboardApi.createDashboard(mapDashboardDraftToCreateInput(draft)))
    }

    resetFieldErrors()
    drawerVisible.value = false
  } catch (error) {
    ElMessage.error(errorMessage(error, '数据看板保存失败'))
  } finally {
    isSaving.value = false
  }
}

async function toggleDashboardStatus(dashboard: ManagedDashboard) {
  try {
    replaceDashboard(
      await dashboardApi.updateDashboard(dashboard.id, {
        status: dashboard.status === '已启用' ? 'disabled' : 'enabled',
      }),
    )
  } catch (error) {
    ElMessage.error(errorMessage(error, '数据看板状态更新失败'))
  }
}

onMounted(() => {
  void loadDataCenter()
})
</script>

<template>
  <main class="data-dashboards">
    <header class="data-dashboards__header">
      <div>
        <div class="data-dashboards__eyebrow">
          <ElTag size="small" effect="plain">集控控制管理系统</ElTag>
          <ElTag type="primary" size="small" effect="plain">数据中心</ElTag>
        </div>
        <h1>数据看板</h1>
        <p>统一管理校级数据看板、角色可见范围和第三方看板嵌入。</p>
      </div>
      <div class="data-dashboards__actions">
        <ElButton data-testid="dashboard-refresh-button" :icon="Refresh" @click="loadDataCenter">刷新</ElButton>
        <ElButton data-testid="dashboard-demo-reset-button" :icon="Refresh" @click="resetDemoDashboards">
          恢复演示数据
        </ElButton>
        <ElButton data-testid="dashboard-add-embed-button" type="primary" :icon="Plus" @click="openEmbedDrawer">
          配置第三方看板
        </ElButton>
      </div>
    </header>

    <section class="data-dashboards__overview" aria-label="数据中心总览">
      <div class="data-dashboards__section-head">
        <div>
          <h2>数据中心总览</h2>
          <p>从这里直接浏览角色工作台、默认数据看板和第三方融合看板。</p>
        </div>
        <ElTag type="success" effect="plain">可演示</ElTag>
      </div>

      <p v-if="workbenchLoadWarning" class="data-dashboards__warning" role="status">
        {{ workbenchLoadWarning }}
      </p>

      <div class="data-dashboards__overview-stats" aria-label="数据中心概况">
        <div v-for="stat in overviewStats" :key="stat.label" class="data-dashboards__overview-stat">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
          <small>{{ stat.detail }}</small>
        </div>
      </div>

      <div class="data-dashboards__overview-groups">
        <section class="data-dashboards__overview-group" aria-label="角色工作台">
          <div class="data-dashboards__group-head">
            <h3>角色工作台</h3>
            <ElTag effect="plain">{{ roleWorkbenchCards.length }} 个</ElTag>
          </div>
          <div class="data-dashboards__card-grid">
            <article v-for="workbench in roleWorkbenchCards" :key="workbench.id" class="data-dashboards__browse-card">
              <div class="data-dashboards__card-topline">
                <ElTag type="success" size="small" effect="plain">{{ workbench.role }}</ElTag>
                <span>{{ workbench.status }}</span>
              </div>
              <h4>{{ workbench.name }}</h4>
              <p>{{ workbench.description }}</p>
              <RouterLink
                v-if="workbench.isAccessible"
                class="data-dashboards__card-action"
                :to="workbench.path"
                :data-testid="`data-center-workbench-${workbench.id}`"
              >
                浏览大屏
              </RouterLink>
              <span
                v-else
                class="data-dashboards__card-action is-disabled"
                aria-disabled="true"
                :data-testid="`data-center-workbench-unavailable-${workbench.id}`"
              >
                {{ workbench.status }}
              </span>
            </article>
          </div>
        </section>

        <section class="data-dashboards__overview-group" aria-label="默认数据看板">
          <div class="data-dashboards__group-head">
            <h3>默认数据看板</h3>
            <ElTag type="primary" effect="plain">{{ defaultDashboardCards.length }} 个</ElTag>
          </div>
          <div class="data-dashboards__card-grid">
            <article v-for="dashboard in defaultDashboardCards" :key="dashboard.id" class="data-dashboards__browse-card">
              <div class="data-dashboards__card-topline">
                <ElTag :type="getSourceTagType(dashboard.source)" size="small" effect="plain">
                  {{ dashboard.source }}
                </ElTag>
                <span>{{ dashboard.status }}</span>
              </div>
              <h4>{{ dashboard.name }}</h4>
              <div class="data-dashboards__mini-metrics">
                <span v-for="metric in dashboard.metrics.slice(0, 2)" :key="metric.label">
                  {{ metric.label }} <strong>{{ metric.value }}</strong>
                </span>
              </div>
              <ElButton
                type="primary"
                size="small"
                :icon="View"
                :data-testid="`data-center-dashboard-${dashboard.id}`"
                @click="openPreview(dashboard)"
              >
                预览看板
              </ElButton>
            </article>
          </div>
        </section>

        <section class="data-dashboards__overview-group" aria-label="第三方融合看板">
          <div class="data-dashboards__group-head">
            <h3>第三方融合看板</h3>
            <ElTag type="warning" effect="plain">{{ embeddedDashboardCards.length }} 个</ElTag>
          </div>
          <div class="data-dashboards__card-grid">
            <article v-for="dashboard in embeddedDashboardCards" :key="dashboard.id" class="data-dashboards__browse-card">
              <div class="data-dashboards__card-topline">
                <ElTag :type="getSourceTagType(dashboard.source)" size="small" effect="plain">
                  {{ dashboard.source }}
                </ElTag>
                <span>{{ dashboard.status }}</span>
              </div>
              <h4>{{ dashboard.name }}</h4>
              <span class="data-dashboards__single-line" :title="dashboard.url">{{ dashboard.url }}</span>
              <ElButton
                type="primary"
                size="small"
                :icon="View"
                :data-testid="`data-center-dashboard-${dashboard.id}`"
                @click="openPreview(dashboard)"
              >
                预览看板
              </ElButton>
            </article>
          </div>
        </section>
      </div>
    </section>

    <section class="data-dashboards__summary" aria-label="数据看板统计">
      <ElCard shadow="never"><span>看板总数</span><strong data-testid="dashboard-summary-total">{{ summary.total }}</strong></ElCard>
      <ElCard shadow="never"><span>已启用</span><strong>{{ summary.enabled }}</strong></ElCard>
      <ElCard shadow="never"><span>默认看板</span><strong data-testid="dashboard-summary-defaults">{{ summary.defaults }}</strong></ElCard>
      <ElCard shadow="never"><span>第三方嵌入</span><strong data-testid="dashboard-summary-embedded">{{ summary.embedded }}</strong></ElCard>
    </section>

    <ElCard v-loading="isLoading" shadow="never" class="data-dashboards__panel">
      <ElForm class="data-dashboards__filters" label-position="top">
        <ElFormItem label="看板名称">
          <ElInput
            v-model="filters.keyword"
            data-testid="dashboard-keyword-input"
            placeholder="请输入看板名称"
            clearable
            :prefix-icon="Search"
          />
        </ElFormItem>
        <ElFormItem label="看板类型">
          <ElSelect v-model="filters.type">
            <ElOption v-for="type in dashboardTypes" :key="type" :label="type" :value="type" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="使用角色">
          <ElSelect v-model="filters.visibleRole">
            <ElOption v-for="role in dashboardRoleFilters" :key="role" :label="role" :value="role" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filters.status">
            <ElOption v-for="status in dashboardStatuses" :key="status" :label="status" :value="status" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="来源类型">
          <ElSelect v-model="filters.source">
            <ElOption v-for="source in dashboardSources" :key="source" :label="source" :value="source" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作">
          <ElButtonGroup>
            <ElButton data-testid="dashboard-reset-button" :icon="Refresh" @click="resetFilters">重置</ElButton>
            <ElButton data-testid="dashboard-search-button" type="primary" :icon="Search" @click="searchDashboards">
              查询
            </ElButton>
          </ElButtonGroup>
        </ElFormItem>
      </ElForm>

      <ElTable v-if="filteredDashboards.length > 0" :data="filteredDashboards" class="data-dashboards__table">
        <ElTableColumn label="看板名称" min-width="160">
          <template #default="{ row }">
            <div class="data-dashboards__name-cell">
              <ElIcon><DataAnalysis /></ElIcon>
              <strong>{{ row.name }}</strong>
              <ElTag v-if="row.isDefault" size="small" effect="plain">默认</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="type" label="看板类型" width="104" />
        <ElTableColumn label="使用角色" min-width="170">
          <template #default="{ row }">
            <div class="data-dashboards__role-tags">
              <ElTag v-for="role in row.visibleRoles" :key="role" size="small" effect="plain">{{ role }}</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="来源" min-width="170">
          <template #default="{ row }">
            <div class="data-dashboards__source-cell">
              <ElTag :type="getSourceTagType(row.source)" size="small" effect="plain">{{ row.source }}</ElTag>
              <span v-if="row.url" class="data-dashboards__single-line" :title="row.url">{{ row.url }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="92">
          <template #default="{ row }">
            <ElTag :type="getStatusTagType(row.status)" size="small" effect="plain">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="updatedAt" label="更新时间" min-width="130" />
        <ElTableColumn label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              :icon="View"
              size="small"
              :data-testid="`dashboard-preview-${row.id}`"
              @click="openPreview(row)"
            >
              预览
            </ElButton>
            <ElButton link type="primary" :icon="Edit" size="small" @click="openPreview(row)">配置</ElButton>
            <ElButton
              link
              type="primary"
              size="small"
              :data-testid="`dashboard-toggle-${row.id}`"
              @click="toggleDashboardStatus(row)"
            >
              {{ row.status === '已启用' ? '停用' : '启用' }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前筛选条件下暂无数据看板">
        <ElButton @click="resetFilters">重置筛选</ElButton>
      </ElEmpty>
    </ElCard>

    <ElDrawer v-model="drawerVisible" :title="drawerTitle" size="560px">
      <div class="data-dashboards__drawer">
        <ElForm class="data-dashboards__drawer-form" label-position="top">
          <ElFormItem label="看板名称" required :error="fieldErrors.name">
            <ElInput v-model="draft.name" data-testid="dashboard-name-input" placeholder="请输入看板名称" />
            <p v-if="fieldErrors.name" class="data-dashboards__field-error" role="alert">{{ fieldErrors.name }}</p>
          </ElFormItem>
          <ElFormItem label="看板类型">
            <ElSelect v-model="draft.type">
              <ElOption
                v-for="type in dashboardTypes.filter((item) => item !== '全部')"
                :key="type"
                :label="type"
                :value="type"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="来源类型">
            <ElRadioGroup v-model="draft.source" :disabled="Boolean(editingId)">
              <ElRadioButton value="内置看板">内置看板</ElRadioButton>
              <ElRadioButton value="第三方嵌入">第三方嵌入</ElRadioButton>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem v-if="draft.source === '第三方嵌入'" label="第三方链接" required :error="fieldErrors.url">
            <ElInput
              v-model="draft.url"
              data-testid="dashboard-url-input"
              placeholder="https://demo.school.local/dashboard"
            />
            <p v-if="fieldErrors.url" class="data-dashboards__field-error" role="alert">{{ fieldErrors.url }}</p>
          </ElFormItem>
          <ElFormItem label="可见范围" required :error="fieldErrors.visibleRoles">
            <ElCheckboxGroup v-model="draft.visibleRoles">
              <ElCheckbox v-for="role in dashboardRoles" :key="role" :value="role">{{ role }}</ElCheckbox>
            </ElCheckboxGroup>
            <p v-if="fieldErrors.visibleRoles" class="data-dashboards__field-error" role="alert">
              {{ fieldErrors.visibleRoles }}
            </p>
          </ElFormItem>
          <ElFormItem label="启用状态">
            <div class="data-dashboards__status-control" data-testid="dashboard-status-control">
              <ElSwitch v-model="draft.status" active-value="已启用" inactive-value="已停用" />
              <ElTag :type="getStatusTagType(draft.status)" size="small" effect="plain">{{ draft.status }}</ElTag>
            </div>
          </ElFormItem>
        </ElForm>

        <section class="data-dashboards__preview" aria-label="看板预览">
          <div class="data-dashboards__preview-head">
            <strong>{{ draft.source === '第三方嵌入' ? '第三方嵌入预览' : '内置看板预览' }}</strong>
            <ElTag :type="getSourceTagType(draft.source)" size="small" effect="plain">{{ draft.source }}</ElTag>
          </div>

          <div v-if="draft.source === '第三方嵌入'" class="data-dashboards__embed-frame" title="第三方看板预览">
            <template v-if="isValidDashboardEmbedUrl(draft.url)">
              <div class="data-dashboards__embed-title">
                <ElIcon><Link /></ElIcon>
                <strong>{{ draft.name || '第三方看板' }}</strong>
              </div>
              <span class="data-dashboards__single-line" :title="draft.url">{{ draft.url }}</span>
              <div class="data-dashboards__embed-metrics" data-testid="dashboard-embed-metrics">
                <div v-for="metric in previewMetrics" :key="metric.label" class="data-dashboards__metric">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
                  <small>{{ metric.trend }}</small>
                </div>
              </div>
              <ElButton :icon="Link" size="small" disabled>打开新页</ElButton>
              <small>演示环境使用稳定预览框展示融合效果，不依赖远程页面加载。</small>
            </template>
            <ElEmpty v-else description="请填写第三方看板链接后预览" :image-size="64" />
          </div>

          <div v-else class="data-dashboards__built-in-preview">
            <div v-for="metric in previewMetrics" :key="metric.label" class="data-dashboards__metric">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.trend }}</small>
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton data-testid="dashboard-save-button" type="primary" :loading="isSaving" @click="saveDashboard">
          保存
        </ElButton>
      </template>
    </ElDrawer>
  </main>
</template>

<style scoped>
.data-dashboards {
  display: grid;
  gap: 16px;
  color: var(--color-text);
}

.data-dashboards__header,
.data-dashboards__actions,
.data-dashboards__eyebrow,
.data-dashboards__name-cell,
.data-dashboards__role-tags,
.data-dashboards__source-cell,
.data-dashboards__section-head,
.data-dashboards__group-head,
.data-dashboards__card-topline,
.data-dashboards__preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-dashboards__header {
  justify-content: space-between;
}

.data-dashboards__actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.data-dashboards__header h1,
.data-dashboards__header p {
  margin: 0;
}

.data-dashboards__header h1 {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 900;
}

.data-dashboards__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.data-dashboards__overview {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(236, 253, 245, 0.74), rgba(255, 255, 255, 0.88)),
    var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.data-dashboards__section-head,
.data-dashboards__group-head,
.data-dashboards__card-topline {
  justify-content: space-between;
  min-width: 0;
}

.data-dashboards__section-head h2,
.data-dashboards__section-head p,
.data-dashboards__group-head h3,
.data-dashboards__browse-card h4,
.data-dashboards__browse-card p,
.data-dashboards__warning {
  margin: 0;
}

.data-dashboards__section-head h2 {
  font-size: 20px;
  font-weight: var(--fw-black);
}

.data-dashboards__section-head p,
.data-dashboards__browse-card p,
.data-dashboards__warning {
  color: var(--color-text-muted);
  font-size: var(--fs-subtitle);
  line-height: 1.55;
}

.data-dashboards__warning {
  padding: 8px 10px;
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-sm);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-weight: var(--fw-bold);
}

.data-dashboards__overview-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.data-dashboards__overview-stat,
.data-dashboards__browse-card {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel);
}

.data-dashboards__overview-stat {
  display: grid;
  gap: 4px;
  padding: 12px;
}

.data-dashboards__overview-stat span,
.data-dashboards__overview-stat small,
.data-dashboards__card-topline span,
.data-dashboards__mini-metrics span {
  color: var(--color-text-muted);
  font-size: var(--fs-label);
}

.data-dashboards__overview-stat strong {
  color: var(--color-accent-700);
  font-size: 24px;
  font-weight: var(--fw-black);
  font-feature-settings: var(--num-feature);
}

.data-dashboards__overview-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.data-dashboards__overview-group {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.data-dashboards__group-head h3 {
  font-size: 15px;
  font-weight: var(--fw-black);
}

.data-dashboards__card-grid {
  display: grid;
  gap: 10px;
}

.data-dashboards__browse-card {
  display: grid;
  gap: 10px;
  padding: 12px;
}

.data-dashboards__browse-card h4 {
  color: var(--color-text);
  font-size: 15px;
  font-weight: var(--fw-black);
  line-height: 1.35;
}

.data-dashboards__mini-metrics {
  display: grid;
  gap: 6px;
}

.data-dashboards__mini-metrics span {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.data-dashboards__mini-metrics strong {
  color: var(--color-accent-700);
  font-weight: var(--fw-black);
}

.data-dashboards__card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-md);
  background: var(--color-accent-600);
  color: #fff;
  font-size: var(--fs-label);
  font-weight: var(--fw-black);
  text-decoration: none;
}

.data-dashboards__card-action:hover:not(.is-disabled) {
  background: var(--color-accent-700);
}

.data-dashboards__card-action.is-disabled {
  cursor: not-allowed;
  border-color: var(--color-border);
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
}

.data-dashboards__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.data-dashboards__summary :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
}

.data-dashboards__summary span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.data-dashboards__summary strong {
  font-size: 26px;
  font-weight: 900;
}

.data-dashboards__panel :deep(.el-card__body) {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.data-dashboards__filters {
  display: grid;
  grid-template-columns:
    minmax(180px, 1fr) minmax(130px, 0.7fr) minmax(140px, 0.7fr) minmax(120px, 0.6fr)
    minmax(140px, 0.7fr) auto;
  gap: 12px;
  align-items: end;
}

.data-dashboards__filters :deep(.el-form-item) {
  margin-bottom: 0;
}

.data-dashboards__table {
  --el-table-header-bg-color: var(--color-panel-muted);
  font-size: var(--fs-subtitle);
}

.data-dashboards__name-cell,
.data-dashboards__source-cell {
  min-width: 0;
}

.data-dashboards__name-cell strong,
.data-dashboards__single-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-dashboards__single-line {
  display: block;
}

.data-dashboards__role-tags {
  flex-wrap: wrap;
  gap: 4px;
}

.data-dashboards__drawer,
.data-dashboards__drawer-form,
.data-dashboards__preview {
  display: grid;
  gap: 12px;
}

.data-dashboards__status-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-dashboards__field-error {
  margin: 4px 0 0;
  color: var(--color-danger);
  font-size: 12px;
}

.data-dashboards__preview {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
}

.data-dashboards__preview-head {
  justify-content: space-between;
}

.data-dashboards__preview-head strong {
  font-size: 14px;
  font-weight: 900;
}

.data-dashboards__built-in-preview,
.data-dashboards__embed-frame {
  display: grid;
  gap: 10px;
  min-height: 160px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-sidebar);
  color: var(--color-text-on-dark);
}

.data-dashboards__built-in-preview {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.data-dashboards__metric {
  display: grid;
  align-content: center;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-sidebar-border);
  border-radius: var(--radius-md);
  background: var(--color-sidebar-soft);
}

.data-dashboards__metric span,
.data-dashboards__metric small,
.data-dashboards__embed-frame small {
  color: var(--color-sidebar-text);
  font-size: var(--fs-label);
}

.data-dashboards__metric strong {
  font-size: 24px;
  font-weight: var(--fw-black);
  color: var(--color-accent-300);
  font-feature-settings: var(--num-feature);
}

.data-dashboards__embed-frame {
  align-content: center;
}

.data-dashboards__embed-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-dashboards__embed-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.data-dashboards__embed-frame > span {
  color: var(--color-accent-200);
}

@media (max-width: 1180px) {
  .data-dashboards__overview-groups {
    grid-template-columns: 1fr;
  }

  .data-dashboards__filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .data-dashboards__header {
    align-items: stretch;
    flex-direction: column;
  }

  .data-dashboards__summary,
  .data-dashboards__overview-stats,
  .data-dashboards__filters,
  .data-dashboards__built-in-preview,
  .data-dashboards__embed-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
