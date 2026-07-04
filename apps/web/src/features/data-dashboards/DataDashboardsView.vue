<script setup lang="ts">
import { DataAnalysis, Edit, Link, Plus, Refresh, Search, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'
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
  isValidDashboardEmbedUrl,
  seedDashboards,
  validateDashboardDraft,
  type DashboardDraft,
  type DashboardSource,
  type DashboardStatus,
  type ManagedDashboard,
} from './dashboardData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const dashboards = ref<ManagedDashboard[]>(
  seedDashboards.map((dashboard) => ({
    ...dashboard,
    visibleRoles: [...dashboard.visibleRoles],
    metrics: dashboard.metrics.map((metric) => ({ ...metric })),
  })),
)
const filters = reactive({ ...defaultDashboardFilters })
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive<DashboardDraft>(createDashboardDraft())
const previewMetrics = ref<ManagedDashboard['metrics']>([])
const fieldErrors = reactive({
  name: '',
  url: '',
  visibleRoles: '',
})

const filteredDashboards = computed(() => applyDashboardFilters(dashboards.value, filters))
const summary = computed(() => dashboardSummary(dashboards.value))
const drawerTitle = computed(() => (editingId.value ? '配置数据看板' : '配置第三方看板'))

function getStatusTagType(status: DashboardStatus): TagType {
  return status === '已启用' ? 'success' : 'info'
}

function getSourceTagType(source: DashboardSource): TagType {
  return source === '第三方嵌入' ? 'primary' : 'info'
}

function resetFilters() {
  Object.assign(filters, { ...defaultDashboardFilters })
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
  previewMetrics.value = [
    { label: '外部指标', value: '--', trend: '等待链接' },
    { label: '刷新方式', value: '手动', trend: '演示模式' },
    { label: '融合状态', value: '待配置', trend: '未嵌入' },
  ]
  resetFieldErrors()
  editingId.value = null
  drawerVisible.value = true
}

function saveDashboard() {
  const errors = validateDashboardDraft(draft)

  if (errors.length > 0) {
    setFieldErrors(errors)
    ElMessage.error(errors[0])
    return
  }

  if (editingId.value) {
    const target = dashboards.value.find((dashboard) => dashboard.id === editingId.value)
    if (target) {
      Object.assign(target, {
        ...draft,
        visibleRoles: [...draft.visibleRoles],
      })
    }
  } else {
    dashboards.value.push({
      id: `dashboard-${Date.now()}`,
      ...draft,
      visibleRoles: [...draft.visibleRoles],
      updatedAt: '2026-07-09 10:36',
      metrics: [
        { label: '外部指标', value: '已接入', trend: '第三方链接' },
        { label: '刷新方式', value: '手动', trend: '演示模式' },
        { label: '融合状态', value: '正常', trend: '数据中心' },
      ],
    })
  }

  resetFieldErrors()
  drawerVisible.value = false
}

function toggleDashboardStatus(dashboard: ManagedDashboard) {
  dashboard.status = dashboard.status === '已启用' ? '已停用' : '已启用'
}
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
      <ElButton data-testid="dashboard-add-embed-button" type="primary" :icon="Plus" @click="openEmbedDrawer">
        配置第三方看板
      </ElButton>
    </header>

    <section class="data-dashboards__summary" aria-label="数据看板统计">
      <ElCard shadow="never"><span>看板总数</span><strong>{{ summary.total }}</strong></ElCard>
      <ElCard shadow="never"><span>已启用</span><strong>{{ summary.enabled }}</strong></ElCard>
      <ElCard shadow="never"><span>默认看板</span><strong>{{ summary.defaults }}</strong></ElCard>
      <ElCard shadow="never"><span>第三方嵌入</span><strong>{{ summary.embedded }}</strong></ElCard>
    </section>

    <ElCard shadow="never" class="data-dashboards__panel">
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
            <ElButton data-testid="dashboard-search-button" type="primary" :icon="Search">查询</ElButton>
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
        <ElButton data-testid="dashboard-save-button" type="primary" @click="saveDashboard">保存</ElButton>
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
.data-dashboards__eyebrow,
.data-dashboards__name-cell,
.data-dashboards__role-tags,
.data-dashboards__source-cell,
.data-dashboards__preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-dashboards__header {
  justify-content: space-between;
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
  .data-dashboards__filters,
  .data-dashboards__built-in-preview,
  .data-dashboards__embed-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
