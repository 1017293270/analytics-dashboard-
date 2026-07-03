<script setup lang="ts">
import { Collection, Edit, Link, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {
  applicationCategories,
  applicationPlatforms,
  applicationStatuses,
  applicationSummary,
  applyApplicationFilters,
  createApplicationDraft,
  defaultApplicationFilters,
  seedApplications,
  validateApplicationDraft,
  visibleRoleFilters,
  visibleRoles,
  type ApplicationDraft,
  type ApplicationIcon,
  type ApplicationStatus,
  type ManagedApplication,
} from './applicationData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const applications = ref<ManagedApplication[]>(
  seedApplications.map((app) => ({
    ...app,
    visibleRoles: [...app.visibleRoles],
  })),
)
const filters = reactive({ ...defaultApplicationFilters })
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive<ApplicationDraft>(createApplicationDraft())
const fieldErrors = reactive({
  name: '',
  url: '',
  packageId: '',
  visibleRoles: '',
})

const applicationIconOptions: Array<{ label: string; value: ApplicationIcon }> = [
  { label: '通知', value: 'notice' },
  { label: '巡检', value: 'shield' },
  { label: '审批', value: 'approval' },
  { label: '能耗', value: 'energy' },
  { label: '沟通', value: 'message' },
  { label: '资源', value: 'resource' },
  { label: '看板', value: 'dashboard' },
  { label: '黑板', value: 'blackboard' },
]

const statusTagTypes: Record<ApplicationStatus, TagType> = {
  已启用: 'success',
  已停用: 'info',
  已卸载: 'warning',
}

const filteredApplications = computed(() => applyApplicationFilters(applications.value, filters))
const summary = computed(() => applicationSummary(applications.value))
const drawerTitle = computed(() => (editingId.value ? '编辑应用' : '添加应用'))

function getStatusTagType(status: ApplicationStatus): TagType {
  return statusTagTypes[status]
}

function resetFilters() {
  Object.assign(filters, { ...defaultApplicationFilters })
}

function resetFieldErrors() {
  Object.assign(fieldErrors, {
    name: '',
    url: '',
    packageId: '',
    visibleRoles: '',
  })
}

function setFieldErrors(errors: string[]) {
  resetFieldErrors()

  for (const error of errors) {
    if (error.includes('应用名称')) fieldErrors.name = error
    if (error.includes('访问地址')) fieldErrors.url = error
    if (error.includes('包标识')) fieldErrors.packageId = error
    if (error.includes('可见角色')) fieldErrors.visibleRoles = error
  }
}

function openAddDrawer() {
  Object.assign(draft, createApplicationDraft())
  resetFieldErrors()
  editingId.value = null
  drawerVisible.value = true
}

function openEditDrawer(app: ManagedApplication) {
  Object.assign(draft, {
    name: app.name,
    category: app.category,
    platform: app.platform,
    url: app.url,
    packageId: app.packageId,
    icon: app.icon,
    visibleRoles: [...app.visibleRoles],
    status: app.status === '已卸载' ? '已停用' : app.status,
  })
  resetFieldErrors()
  editingId.value = app.id
  drawerVisible.value = true
}

function saveApplication() {
  const errors = validateApplicationDraft(draft)

  if (errors.length > 0) {
    setFieldErrors(errors)
    ElMessage.error(errors[0])
    return
  }

  if (editingId.value) {
    const target = applications.value.find((app) => app.id === editingId.value)
    if (target) {
      Object.assign(target, {
        ...draft,
        visibleRoles: [...draft.visibleRoles],
      })
    }
  } else {
    applications.value.push({
      id: `app-${Date.now()}`,
      ...draft,
      visibleRoles: [...draft.visibleRoles],
      sortOrder: applications.value.length + 1,
    })
  }

  resetFieldErrors()
  drawerVisible.value = false
}

function toggleStatus(app: ManagedApplication) {
  if (app.status === '已卸载') return

  app.status = app.status === '已启用' ? '已停用' : '已启用'
}

async function uninstallApplication(app: ManagedApplication) {
  if (app.status === '已卸载') return

  await ElMessageBox.confirm(`确认卸载 ${app.name}？`, '卸载应用', {
    confirmButtonText: '卸载',
    cancelButtonText: '取消',
    type: 'warning',
  })
  app.status = '已卸载'
}

function launchApplication(app: ManagedApplication) {
  if (app.platform === '网页端' && app.url) {
    window.open(app.url, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <main class="application-center">
    <header class="application-center__header">
      <div>
        <div class="application-center__eyebrow">
          <ElTag size="small" effect="plain">应用中心</ElTag>
          <ElTag type="success" size="small" effect="plain">网页端 / 移动端</ElTag>
        </div>
        <h1>应用中心</h1>
        <p>统一管理网页端与移动端应用，配置分类、可见范围与启停状态。</p>
      </div>
      <ElButton data-testid="application-add-button" type="primary" :icon="Plus" @click="openAddDrawer">
        添加应用
      </ElButton>
    </header>

    <section class="application-center__summary" aria-label="应用统计">
      <ElCard shadow="never"><span>应用总数</span><strong>{{ summary.total }}</strong></ElCard>
      <ElCard shadow="never"><span>网页端</span><strong>{{ summary.web }}</strong></ElCard>
      <ElCard shadow="never"><span>移动端</span><strong>{{ summary.mobile }}</strong></ElCard>
      <ElCard shadow="never"><span>已启用</span><strong>{{ summary.enabled }}</strong></ElCard>
    </section>

    <ElCard shadow="never" class="application-center__panel">
      <ElForm class="application-center__filters" label-position="top">
        <ElFormItem label="应用名称">
          <ElInput
            v-model="filters.keyword"
            data-testid="application-keyword-input"
            placeholder="请输入应用名称"
            clearable
            :prefix-icon="Search"
          />
        </ElFormItem>
        <ElFormItem label="应用分类">
          <ElSelect v-model="filters.category">
            <ElOption v-for="category in applicationCategories" :key="category" :label="category" :value="category" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="端类型">
          <ElSelect v-model="filters.platform">
            <ElOption v-for="platform in applicationPlatforms" :key="platform" :label="platform" :value="platform" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filters.status">
            <ElOption v-for="status in applicationStatuses" :key="status" :label="status" :value="status" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="可见范围">
          <ElSelect v-model="filters.visibleRole">
            <ElOption v-for="role in visibleRoleFilters" :key="role" :label="role" :value="role" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作">
          <ElButtonGroup>
            <ElButton data-testid="application-reset-button" :icon="Refresh" @click="resetFilters">重置</ElButton>
            <ElButton data-testid="application-search-button" type="primary" :icon="Search">查询</ElButton>
          </ElButtonGroup>
        </ElFormItem>
      </ElForm>

      <ElTable
        v-if="filteredApplications.length > 0"
        :data="filteredApplications"
        size="small"
        class="application-center__table"
      >
        <ElTableColumn label="应用名称" min-width="170">
          <template #default="{ row }">
            <div class="application-center__app-cell">
              <ElIcon><Collection /></ElIcon>
              <strong>{{ row.name }}</strong>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="category" label="应用分类" width="104" />
        <ElTableColumn prop="platform" label="端类型" width="92" />
        <ElTableColumn label="访问地址 / 包标识" min-width="210">
          <template #default="{ row }">
            <span class="application-center__single-line" :title="row.platform === '网页端' ? row.url : row.packageId">
              {{ row.platform === '网页端' ? row.url : row.packageId }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="可见范围" min-width="170">
          <template #default="{ row }">
            <div class="application-center__role-tags">
              <ElTag v-for="role in row.visibleRoles" :key="role" size="small" effect="plain">{{ role }}</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="92">
          <template #default="{ row }">
            <ElTag :type="getStatusTagType(row.status)" size="small" effect="plain">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              :icon="Edit"
              size="small"
              :data-testid="`application-edit-${row.id}`"
              @click="openEditDrawer(row)"
            >
              编辑
            </ElButton>
            <ElButton
              link
              type="primary"
              size="small"
              :disabled="row.status === '已卸载'"
              :data-testid="`application-toggle-${row.id}`"
              @click="toggleStatus(row)"
            >
              {{ row.status === '已启用' ? '停用' : '启用' }}
            </ElButton>
            <ElButton
              link
              type="danger"
              size="small"
              :disabled="row.status === '已卸载'"
              :data-testid="`application-uninstall-${row.id}`"
              @click="uninstallApplication(row)"
            >
              卸载
            </ElButton>
            <ElButton
              link
              type="primary"
              :icon="Link"
              size="small"
              :disabled="row.platform !== '网页端' || row.status === '已卸载'"
              @click="launchApplication(row)"
            >
              打开
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前筛选条件下暂无应用">
        <ElButton @click="resetFilters">重置筛选</ElButton>
      </ElEmpty>
    </ElCard>

    <ElDrawer v-model="drawerVisible" :title="drawerTitle" size="520px">
      <ElForm class="application-center__drawer-form" label-position="top">
        <ElFormItem label="应用名称" required :error="fieldErrors.name">
          <ElInput v-model="draft.name" data-testid="application-name-input" placeholder="请输入应用名称" />
          <p v-if="fieldErrors.name" class="application-center__field-error" role="alert">{{ fieldErrors.name }}</p>
        </ElFormItem>
        <ElFormItem label="应用分类" required>
          <ElSelect v-model="draft.category">
            <ElOption
              v-for="category in applicationCategories.filter((item) => item !== '全部')"
              :key="category"
              :label="category"
              :value="category"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="端类型" required>
          <ElRadioGroup v-model="draft.platform">
            <ElRadioButton value="网页端">网页端</ElRadioButton>
            <ElRadioButton value="移动端">移动端</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="draft.platform === '网页端'" label="访问地址" required :error="fieldErrors.url">
          <ElInput v-model="draft.url" data-testid="application-url-input" placeholder="https://demo.school.local/app" />
          <p v-if="fieldErrors.url" class="application-center__field-error" role="alert">{{ fieldErrors.url }}</p>
        </ElFormItem>
        <ElFormItem v-else label="包标识" required :error="fieldErrors.packageId">
          <ElInput v-model="draft.packageId" data-testid="application-package-input" placeholder="com.school.app" />
          <p v-if="fieldErrors.packageId" class="application-center__field-error" role="alert">
            {{ fieldErrors.packageId }}
          </p>
        </ElFormItem>
        <ElFormItem label="图标类型">
          <ElSelect v-model="draft.icon">
            <ElOption
              v-for="option in applicationIconOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="可见范围" required :error="fieldErrors.visibleRoles">
          <ElCheckboxGroup v-model="draft.visibleRoles">
            <ElCheckbox v-for="role in visibleRoles" :key="role" :value="role">{{ role }}</ElCheckbox>
          </ElCheckboxGroup>
          <p v-if="fieldErrors.visibleRoles" class="application-center__field-error" role="alert">
            {{ fieldErrors.visibleRoles }}
          </p>
        </ElFormItem>
        <ElFormItem label="启用状态">
          <ElSwitch v-model="draft.status" active-value="已启用" inactive-value="已停用" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton data-testid="application-save-button" type="primary" @click="saveApplication">保存</ElButton>
      </template>
    </ElDrawer>
  </main>
</template>

<style scoped>
.application-center {
  display: grid;
  gap: 16px;
  color: var(--color-text);
}

.application-center__header,
.application-center__eyebrow,
.application-center__app-cell,
.application-center__role-tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.application-center__header {
  justify-content: space-between;
}

.application-center__header h1,
.application-center__header p {
  margin: 0;
}

.application-center__header h1 {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 900;
}

.application-center__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.application-center__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.application-center__summary :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
}

.application-center__summary span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.application-center__summary strong {
  font-size: 26px;
  font-weight: 900;
}

.application-center__panel :deep(.el-card__body) {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.application-center__filters {
  display: grid;
  grid-template-columns:
    minmax(190px, 1fr) minmax(130px, 0.7fr) minmax(120px, 0.6fr) minmax(120px, 0.6fr)
    minmax(140px, 0.7fr) auto;
  gap: 12px;
  align-items: end;
}

.application-center__filters :deep(.el-form-item) {
  margin-bottom: 0;
}

.application-center__table {
  --el-table-header-bg-color: #f8fafc;
  font-size: 12px;
}

.application-center__app-cell {
  min-width: 0;
}

.application-center__app-cell strong,
.application-center__single-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-center__single-line {
  display: block;
}

.application-center__role-tags {
  flex-wrap: wrap;
  gap: 4px;
}

.application-center__drawer-form {
  display: grid;
  gap: 4px;
}

.application-center__field-error {
  margin: 4px 0 0;
  color: var(--color-danger);
  font-size: 12px;
}

@media (max-width: 1180px) {
  .application-center__filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .application-center__header {
    align-items: stretch;
    flex-direction: column;
  }

  .application-center__summary,
  .application-center__filters {
    grid-template-columns: 1fr;
  }
}
</style>
