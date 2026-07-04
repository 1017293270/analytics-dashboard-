<script setup lang="ts">
import type { RoleCode } from '@analytics/shared'
import { Edit, Plus, Refresh, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  defaultWorkbenchMetadata,
  type WorkbenchMetadata,
} from '../big-screen/workbenches/workbenchMetadata'
import {
  buildAccountSummary,
  buildCreateAccountInput,
  buildRoleAccessNotes,
  buildRoleInsights,
  buildUpdateAccountInput,
  accountRowToDemoAccount,
  accountRowsToDemoAccounts,
  accountStatusToApi,
  createAccountDraft,
  defaultDemoPassword,
  getNextAccountStatus,
  getVisibleMenusForRole,
  getVisibleWorkbenchesForRole,
  roleNameByCode,
  roleRowsToDemoRoles,
  validateAccountDraft,
  type AccountDraft,
  type AccountStatus,
  type DemoAccount,
  type DemoRole,
} from './accountData'
import { accountApi } from './accountApi'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

type RoleDraft = {
  name: string
  description: string
  visibleWorkbenchIds: string[]
}

const accounts = ref<DemoAccount[]>([])
const roles = ref<DemoRole[]>([])
const workbenches = ref<WorkbenchMetadata[]>(cloneWorkbenches(defaultWorkbenchMetadata))
const isLoading = ref(false)
const pageError = ref('')
const activeTab = ref('accounts')
const selectedRoleCode = ref<RoleCode>('system-admin')
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const roleDrawerVisible = ref(false)
const editingRoleCode = ref<RoleCode | null>(null)
const draft = reactive<AccountDraft>(createAccountDraft())
const roleDraft = reactive<RoleDraft>({
  name: '',
  description: '',
  visibleWorkbenchIds: [],
})
const fieldErrors = reactive({
  username: '',
  displayName: '',
  roleCodes: '',
})
const roleFieldErrors = reactive({
  name: '',
  description: '',
})

const statusTagTypes: Record<AccountStatus, TagType> = {
  已启用: 'success',
  已停用: 'info',
}

const roleOptions = computed(() => roles.value.map((role) => ({ label: role.name, value: role.code })))
const summary = computed(() => buildAccountSummary(accounts.value, roles.value, workbenches.value))
const roleInsights = computed(() => buildRoleInsights(accounts.value, roles.value, undefined, workbenches.value))
const selectedRole = computed(() => roles.value.find((role) => role.code === selectedRoleCode.value))
const visibleMenus = computed(() => getVisibleMenusForRole(selectedRoleCode.value))
const visibleWorkbenches = computed(() => getVisibleWorkbenchesForRole(selectedRoleCode.value, workbenches.value))
const accessNotes = computed(() => buildRoleAccessNotes(selectedRoleCode.value))
const drawerTitle = computed(() => (editingId.value ? '编辑账号' : '新增账号'))
const roleDrawerTitle = computed(() => (selectedEditingRole.value ? `编辑角色：${selectedEditingRole.value.name}` : '编辑角色'))

const selectedEditingRole = computed(() =>
  editingRoleCode.value ? roles.value.find((role) => role.code === editingRoleCode.value) : null,
)

function cloneWorkbenches(items: WorkbenchMetadata[]): WorkbenchMetadata[] {
  return items.map((workbench) => ({
    ...workbench,
    visibleRoles: [...workbench.visibleRoles],
  }))
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function upsertAccount(account: DemoAccount) {
  const index = accounts.value.findIndex((item) => item.id === account.id)
  if (index === -1) {
    accounts.value = [...accounts.value, account]
    return
  }

  accounts.value[index] = account
}

async function loadAccountState(successMessage?: string) {
  isLoading.value = true
  pageError.value = ''

  try {
    const [accountRows, roleRows] = await Promise.all([accountApi.listAccounts(), accountApi.listRoles()])
    accounts.value = accountRowsToDemoAccounts(accountRows)
    roles.value = roleRowsToDemoRoles(roleRows)

    if (!roles.value.some((role) => role.code === selectedRoleCode.value)) {
      selectedRoleCode.value = roles.value[0]?.code ?? 'system-admin'
    }

    if (successMessage) ElMessage.success(successMessage)
  } catch (error) {
    const message = getErrorMessage(error, '账号数据加载失败')
    pageError.value = message
    ElMessage.error(message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadAccountState()
})

function getStatusTagType(status: AccountStatus): TagType {
  return statusTagTypes[status]
}

function getRoleNames(roleCodes: RoleCode[]): string[] {
  return roleCodes.map((roleCode) => roles.value.find((role) => role.code === roleCode)?.name ?? roleNameByCode[roleCode])
}

function getAccountWorkbenchNames(account: DemoAccount): string[] {
  const names = new Set<string>()

  for (const roleCode of account.roleCodes) {
    for (const workbench of getVisibleWorkbenchesForRole(roleCode, workbenches.value)) {
      names.add(workbench.name)
    }
  }

  return [...names]
}

function resetFieldErrors() {
  Object.assign(fieldErrors, {
    username: '',
    displayName: '',
    roleCodes: '',
  })
}

function resetRoleFieldErrors() {
  Object.assign(roleFieldErrors, {
    name: '',
    description: '',
  })
}

function setFieldErrors(errors: string[]) {
  resetFieldErrors()

  for (const error of errors) {
    if (error.includes('账号')) fieldErrors.username = error
    if (error.includes('姓名')) fieldErrors.displayName = error
    if (error.includes('角色')) fieldErrors.roleCodes = error
  }
}

function openAddDrawer() {
  Object.assign(draft, createAccountDraft())
  resetFieldErrors()
  editingId.value = null
  drawerVisible.value = true
}

function openEditDrawer(account: DemoAccount) {
  Object.assign(draft, {
    username: account.username,
    displayName: account.displayName,
    phone: account.phone,
    roleCodes: [...account.roleCodes],
    status: account.status,
  })
  resetFieldErrors()
  editingId.value = account.id
  drawerVisible.value = true
}

async function saveAccount() {
  const errors = validateAccountDraft(draft, accounts.value, editingId.value)

  if (errors.length > 0) {
    setFieldErrors(errors)
    ElMessage.error(errors[0])
    return
  }

  try {
    if (editingId.value) {
      const updated = await accountApi.updateAccount(editingId.value, buildUpdateAccountInput(draft))
      upsertAccount(accountRowToDemoAccount(updated))
      ElMessage.success('账号绑定已更新')
    } else {
      const created = await accountApi.createAccount(buildCreateAccountInput(draft))
      upsertAccount(accountRowToDemoAccount(created))
      ElMessage.success('账号已添加')
    }

    resetFieldErrors()
    drawerVisible.value = false
  } catch (error) {
    const message = getErrorMessage(error, editingId.value ? '账号更新失败' : '账号创建失败')
    pageError.value = message
    ElMessage.error(message)
  }
}

async function toggleStatus(account: DemoAccount) {
  const nextStatus = getNextAccountStatus(account.status)

  try {
    const updated = await accountApi.updateAccount(account.id, { status: accountStatusToApi(nextStatus) })
    const updatedAccount = accountRowToDemoAccount(updated)
    upsertAccount(updatedAccount)
    ElMessage.success(updatedAccount.status === '已启用' ? '账号已启用' : '账号已停用')
  } catch (error) {
    const message = getErrorMessage(error, '账号状态更新失败')
    pageError.value = message
    ElMessage.error(message)
  }
}

async function resetPassword(account: DemoAccount) {
  try {
    await ElMessageBox.confirm(`确认重置 ${account.displayName} 的演示密码？`, '重置密码', {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    const updated = await accountApi.resetPassword(account.id, { password: defaultDemoPassword })
    upsertAccount(accountRowToDemoAccount(updated))
    ElMessage.success(`密码已重置为 ${defaultDemoPassword}`)
  } catch (error) {
    const message = getErrorMessage(error, '密码重置失败')
    pageError.value = message
    ElMessage.error(message)
  }
}

async function resetDemoState() {
  selectedRoleCode.value = 'system-admin'
  drawerVisible.value = false
  roleDrawerVisible.value = false
  await loadAccountState('演示状态已刷新')
}

function openRoleDrawer(role: DemoRole) {
  const roleName = roleNameByCode[role.code]

  Object.assign(roleDraft, {
    name: role.name,
    description: role.description,
    visibleWorkbenchIds: workbenches.value
      .filter((workbench) => workbench.visibleRoles.includes(roleName))
      .map((workbench) => workbench.id),
  })
  resetRoleFieldErrors()
  editingRoleCode.value = role.code
  roleDrawerVisible.value = true
}

function saveRole() {
  const errors: string[] = []
  if (!roleDraft.name.trim()) errors.push('角色名称不能为空')
  if (!roleDraft.description.trim()) errors.push('角色说明不能为空')

  resetRoleFieldErrors()
  for (const error of errors) {
    if (error.includes('名称')) roleFieldErrors.name = error
    if (error.includes('说明')) roleFieldErrors.description = error
  }

  if (errors.length > 0) {
    ElMessage.error(errors[0])
    return
  }

  const roleCode = editingRoleCode.value
  if (!roleCode) return

  const target = roles.value.find((role) => role.code === roleCode)
  if (target) {
    Object.assign(target, {
      name: roleDraft.name.trim(),
      description: roleDraft.description.trim(),
    })
  }

  const canonicalRoleName = roleNameByCode[roleCode]
  workbenches.value = workbenches.value.map((workbench) => {
    const visibleRoles = workbench.visibleRoles.filter((roleName) => roleName !== canonicalRoleName)

    if (roleDraft.visibleWorkbenchIds.includes(workbench.id)) {
      visibleRoles.push(canonicalRoleName)
    }

    return {
      ...workbench,
      visibleRoles,
    }
  })

  roleDrawerVisible.value = false
  ElMessage.success('角色预览已更新')
}
</script>

<template>
  <main class="accounts-view">
    <header class="accounts-view__header">
      <div>
        <div class="accounts-view__eyebrow">
          <ElTag size="small" effect="plain">账号与角色</ElTag>
          <ElTag type="primary" size="small" effect="plain">角色可见范围</ElTag>
        </div>
        <h1>账号与角色</h1>
        <p>账号角色用于预览菜单与工作台可见范围，工作台发布策略在工作台配置页统一维护。</p>
      </div>
      <div class="accounts-view__actions">
        <ElButton data-testid="accounts-reset-button" :icon="Refresh" :loading="isLoading" @click="resetDemoState">
          刷新演示状态
        </ElButton>
        <ElButton data-testid="accounts-add-button" type="primary" :icon="Plus" @click="openAddDrawer">
          新增账号
        </ElButton>
      </div>
    </header>

    <ElAlert
      v-if="pageError"
      data-testid="accounts-error"
      :title="pageError"
      type="error"
      show-icon
      :closable="false"
    />

    <section class="accounts-view__summary" aria-label="账号统计">
      <ElCard shadow="never"><span>账号总数</span><strong>{{ summary.totalAccounts }}</strong></ElCard>
      <ElCard shadow="never"><span>启用账号</span><strong>{{ summary.enabledAccounts }}</strong></ElCard>
      <ElCard shadow="never"><span>角色数量</span><strong>{{ summary.roleCount }}</strong></ElCard>
      <ElCard shadow="never"><span>已绑定工作台</span><strong>{{ summary.boundWorkbenches }}</strong></ElCard>
    </section>

    <section class="accounts-view__grid">
      <ElCard shadow="never" class="accounts-view__panel">
        <ElTabs v-model="activeTab">
          <ElTabPane label="账号列表" name="accounts">
            <ElTable v-loading="isLoading" :data="accounts" class="accounts-view__table">
              <ElTableColumn label="账号" min-width="150">
                <template #default="{ row }">
                  <div class="accounts-view__account-cell">
                    <ElIcon><UserFilled /></ElIcon>
                    <div>
                      <strong>{{ row.username }}</strong>
                      <span>{{ row.id }}</span>
                    </div>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="displayName" label="姓名" width="116" />
              <ElTableColumn prop="phone" label="手机号" width="126" />
              <ElTableColumn label="角色" min-width="150">
                <template #default="{ row }">
                  <div class="accounts-view__tag-list">
                    <ElTag v-for="roleName in getRoleNames(row.roleCodes)" :key="roleName" size="small" effect="plain">
                      {{ roleName }}
                    </ElTag>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" width="94">
                <template #default="{ row }">
                  <ElTag
                    :data-testid="`account-status-${row.id}`"
                    :type="getStatusTagType(row.status)"
                    size="small"
                    effect="plain"
                  >
                    {{ row.status }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="lastLogin" label="最近登录" width="148" />
              <ElTableColumn label="可见工作台" min-width="170">
                <template #default="{ row }">
                  <div class="accounts-view__tag-list">
                    <ElTag
                      v-for="workbenchName in getAccountWorkbenchNames(row)"
                      :key="workbenchName"
                      size="small"
                      effect="plain"
                    >
                      {{ workbenchName }}
                    </ElTag>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="204" fixed="right">
                <template #default="{ row }">
                  <ElButton
                    link
                    type="primary"
                    :icon="Edit"
                    size="small"
                    :data-testid="`account-edit-${row.id}`"
                    @click="openEditDrawer(row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    link
                    type="primary"
                    size="small"
                    :data-testid="`account-toggle-${row.id}`"
                    @click="toggleStatus(row)"
                  >
                    {{ row.status === '已启用' ? '停用' : '启用' }}
                  </ElButton>
                  <ElButton
                    link
                    type="primary"
                    size="small"
                    :data-testid="`account-reset-password-${row.id}`"
                    @click="resetPassword(row)"
                  >
                    重置密码
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>

          <ElTabPane label="角色管理" name="roles">
            <ElTable v-loading="isLoading" :data="roleInsights" class="accounts-view__table">
              <ElTableColumn prop="name" label="角色名称" width="108" />
              <ElTableColumn prop="code" label="角色编码" min-width="190" />
              <ElTableColumn prop="description" label="说明" min-width="210" />
              <ElTableColumn prop="accountCount" label="绑定账号" width="92" />
              <ElTableColumn prop="visibleMenuCount" label="可见菜单" width="92" />
              <ElTableColumn prop="visibleWorkbenchCount" label="可见工作台" width="108" />
              <ElTableColumn label="状态" width="92">
                <template #default="{ row }">
                  <ElTag type="success" size="small" effect="plain">{{ row.status }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="96" fixed="right">
                <template #default="{ row }">
                  <ElButton
                    link
                    type="primary"
                    size="small"
                    :data-testid="`account-role-edit-${row.id}`"
                    @click="openRoleDrawer(row)"
                  >
                    编辑
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>
        </ElTabs>
      </ElCard>

      <ElCard shadow="never" class="accounts-view__preview">
        <template #header>
          <div class="accounts-view__preview-header">
            <strong>角色可见性预览</strong>
            <ElTag type="success" size="small" effect="plain">{{ selectedRole?.name }}</ElTag>
          </div>
        </template>
        <ElForm label-position="top">
          <ElFormItem label="选择角色">
            <ElSelect v-model="selectedRoleCode" data-testid="account-preview-role-select">
              <ElOption v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
            </ElSelect>
          </ElFormItem>
        </ElForm>

        <div class="accounts-view__preview-section">
          <h2>可见菜单</h2>
          <div data-testid="account-visible-menu-list" class="accounts-view__tag-list">
            <ElTag v-for="item in visibleMenus" :key="item.path" size="small" effect="plain">{{ item.label }}</ElTag>
          </div>
        </div>

        <div class="accounts-view__preview-section">
          <h2>可见工作台</h2>
          <div data-testid="account-visible-workbench-list" class="accounts-view__tag-list">
            <ElTag v-for="workbench in visibleWorkbenches" :key="workbench.id" size="small" effect="plain">
              {{ workbench.name }}
            </ElTag>
          </div>
        </div>

        <div class="accounts-view__preview-section">
          <h2>能力入口</h2>
          <div data-testid="account-access-chips" class="accounts-view__access-list">
            <ElTag
              v-for="note in accessNotes"
              :key="note.label"
              :type="note.enabled ? 'success' : 'info'"
              size="small"
              effect="plain"
            >
              {{ note.label }}：{{ note.enabled ? '可见' : '不可见' }}
            </ElTag>
          </div>
        </div>
      </ElCard>
    </section>

    <ElDrawer v-model="drawerVisible" :title="drawerTitle" size="520px">
      <ElForm class="accounts-view__drawer-form" label-position="top">
        <ElFormItem label="账号" required :error="fieldErrors.username">
          <ElInput v-model="draft.username" data-testid="account-username-input" placeholder="请输入账号" />
          <p v-if="fieldErrors.username" class="accounts-view__field-error" role="alert">{{ fieldErrors.username }}</p>
        </ElFormItem>
        <ElFormItem label="姓名" required :error="fieldErrors.displayName">
          <ElInput v-model="draft.displayName" data-testid="account-display-name-input" placeholder="请输入姓名" />
          <p v-if="fieldErrors.displayName" class="accounts-view__field-error" role="alert">
            {{ fieldErrors.displayName }}
          </p>
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="draft.phone" data-testid="account-phone-input" placeholder="13800000006" />
        </ElFormItem>
        <ElFormItem label="角色" required :error="fieldErrors.roleCodes">
          <ElCheckboxGroup v-model="draft.roleCodes">
            <ElCheckbox v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</ElCheckbox>
          </ElCheckboxGroup>
          <p v-if="fieldErrors.roleCodes" class="accounts-view__field-error" role="alert">
            {{ fieldErrors.roleCodes }}
          </p>
        </ElFormItem>
        <ElFormItem label="启用状态">
          <ElSwitch v-model="draft.status" active-value="已启用" inactive-value="已停用" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton data-testid="account-save-button" type="primary" @click="saveAccount">保存</ElButton>
      </template>
    </ElDrawer>

    <ElDrawer v-model="roleDrawerVisible" :title="roleDrawerTitle" size="520px">
      <ElForm class="accounts-view__drawer-form" label-position="top">
        <ElFormItem label="角色名称" required :error="roleFieldErrors.name">
          <ElInput v-model="roleDraft.name" data-testid="role-name-input" placeholder="请输入角色名称" />
          <p v-if="roleFieldErrors.name" class="accounts-view__field-error" role="alert">{{ roleFieldErrors.name }}</p>
        </ElFormItem>
        <ElFormItem label="角色说明" required :error="roleFieldErrors.description">
          <ElInput
            v-model="roleDraft.description"
            data-testid="role-description-input"
            type="textarea"
            placeholder="请输入角色说明"
          />
          <p v-if="roleFieldErrors.description" class="accounts-view__field-error" role="alert">
            {{ roleFieldErrors.description }}
          </p>
        </ElFormItem>
        <ElFormItem label="可见工作台">
          <ElCheckboxGroup v-model="roleDraft.visibleWorkbenchIds">
            <ElCheckbox v-for="workbench in workbenches" :key="workbench.id" :value="workbench.id">
              {{ workbench.name }}
            </ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
        <ElAlert title="角色说明和工作台绑定仅用于本页前端预览。" type="info" :closable="false" />
      </ElForm>
      <template #footer>
        <ElButton @click="roleDrawerVisible = false">取消</ElButton>
        <ElButton data-testid="role-save-button" type="primary" @click="saveRole">保存</ElButton>
      </template>
    </ElDrawer>
  </main>
</template>

<style scoped>
.accounts-view {
  display: grid;
  gap: 16px;
  color: var(--color-text);
}

.accounts-view__header,
.accounts-view__eyebrow,
.accounts-view__actions,
.accounts-view__account-cell,
.accounts-view__preview-header,
.accounts-view__tag-list,
.accounts-view__access-list {
  display: flex;
  align-items: center;
  gap: 10px;
}

.accounts-view__header {
  justify-content: space-between;
}

.accounts-view__header h1,
.accounts-view__header p {
  margin: 0;
}

.accounts-view__header h1 {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 900;
}

.accounts-view__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.accounts-view__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.accounts-view__summary :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
}

.accounts-view__summary span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.accounts-view__summary strong {
  font-size: 26px;
  font-weight: 900;
}

.accounts-view__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.36fr);
  gap: 16px;
  align-items: start;
}

.accounts-view__panel :deep(.el-card__body),
.accounts-view__preview :deep(.el-card__body) {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.accounts-view__table {
  --el-table-header-bg-color: var(--color-panel-muted);
  font-size: var(--fs-subtitle);
}

.accounts-view__account-cell {
  min-width: 0;
}

.accounts-view__account-cell > div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.accounts-view__account-cell strong,
.accounts-view__account-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.accounts-view__account-cell span,
.accounts-view__preview-section h2 {
  color: var(--color-text-muted);
  font-size: 12px;
}

.accounts-view__tag-list,
.accounts-view__access-list {
  flex-wrap: wrap;
  gap: 6px;
}

.accounts-view__preview-header {
  justify-content: space-between;
}

.accounts-view__preview-section {
  display: grid;
  gap: 8px;
}

.accounts-view__preview-section h2 {
  margin: 0;
  font-weight: 700;
}

.accounts-view__drawer-form {
  display: grid;
  gap: 4px;
}

.accounts-view__field-error {
  margin: 4px 0 0;
  color: var(--color-danger);
  font-size: 12px;
}

@media (max-width: 1180px) {
  .accounts-view__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .accounts-view__header,
  .accounts-view__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .accounts-view__summary {
    grid-template-columns: 1fr;
  }
}
</style>
