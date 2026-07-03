# Account And Role Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a demo-grade `账号与角色` management page that makes seeded accounts, seeded roles, and role-based menu/workbench visibility demonstrable for the July 9 tender demo.

**Architecture:** Keep this slice frontend-first and deterministic. Add a focused `features/accounts` module with pure data helpers, a Vue/Element Plus management page, one protected router entry, one admin-only sidebar item, and Playwright rehearsal coverage; do not add backend user mutation endpoints or a production RBAC matrix.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Pinia auth guard, Vue Router, Vitest, Vue Test Utils, Playwright.

---

## Scope Check

The approved spec covers one bounded subsystem: the demo account-and-role management page. It depends on existing auth, navigation, and workbench metadata, but it does not require changes to database schema, API user management, organization hierarchy, or production authorization rules.

## File Structure

Create:

- `apps/web/src/features/accounts/accountData.ts`  
  Pure demo data and helper functions. No Vue state. Reuses `RoleCode`, shell navigation rules, and workbench metadata helpers.
- `apps/web/src/features/accounts/accountData.test.ts`  
  Unit tests for seeded rows, derived summary, role menu preview, workbench preview, validation, toggle, and reset helpers.
- `apps/web/src/features/accounts/AccountsView.vue`  
  Element Plus management page with KPI cards, account table, role table, role visibility preview, and account drawer.
- `apps/web/src/features/accounts/AccountsView.test.ts`  
  Component tests for rendering, validation, add/edit/toggle/reset-password behavior, and role preview updates.

Modify:

- `apps/web/src/features/shell/navigation.ts`  
  Add admin-only `账号与角色` sidebar item using `UserFilled`.
- `apps/web/src/features/shell/navigation.test.ts`  
  Assert admin sees `/accounts`; non-admin users do not.
- `apps/web/src/router.ts`  
  Add `/accounts` protected shell child route.
- `apps/web/src/router.test.ts`  
  Assert `/accounts` routes to `AccountsView`.
- `apps/web/src/smoke.test.ts`  
  Include `/accounts` in registered routes.
- `apps/web/e2e/demo-rehearsal.spec.ts`  
  Add the page to the July 9 demo gate and update the previous negative navigation assertion.
- `docs/superpowers/pm/demo-script.md`  
  Add a short account-role checkpoint to the manual demo path.
- `docs/superpowers/pm/final-rehearsal-checklist.md`  
  Add account-role page checks.

## Task 1: Account Demo Data Helpers

**Files:**

- Create: `apps/web/src/features/accounts/accountData.test.ts`
- Create: `apps/web/src/features/accounts/accountData.ts`

- [ ] **Step 1: Write the failing data tests**

Create `apps/web/src/features/accounts/accountData.test.ts` with this content:

```ts
import { describe, expect, test } from 'vitest'
import { shellNavItems } from '../shell/navigation'
import { defaultWorkbenchMetadata } from '../big-screen/workbenches/workbenchMetadata'
import {
  buildAccountSummary,
  buildRoleInsights,
  createAccountDraft,
  createAccountFromDraft,
  createDemoAccountState,
  demoAccountRows,
  demoRoleRows,
  getAccountsByRole,
  getVisibleMenusForRole,
  getVisibleWorkbenchesForRole,
  roleNameByCode,
  toggleAccountStatus,
  validateAccountDraft,
} from './accountData'

describe('account demo data', () => {
  test('defines the five seeded tender-demo accounts and roles', () => {
    expect(demoAccountRows.map((account) => account.username)).toEqual([
      'admin',
      'all_staff',
      'electro_director',
      'moral_director',
      'research_director',
    ])
    expect(demoRoleRows.map((role) => role.name)).toEqual([
      '系统管理员',
      '全员',
      '电教主任',
      '德育主任',
      '教研主任',
    ])
  })

  test('derives account summary from current demo state', () => {
    const summary = buildAccountSummary(demoAccountRows, demoRoleRows, defaultWorkbenchMetadata)

    expect(summary).toEqual({
      totalAccounts: 5,
      enabledAccounts: 5,
      roleCount: 5,
      boundWorkbenches: 4,
    })
  })

  test('filters accounts and role insights by role code', () => {
    expect(getAccountsByRole(demoAccountRows, 'electro-education-director').map((account) => account.username)).toEqual([
      'electro_director',
    ])

    const insights = buildRoleInsights(demoAccountRows, demoRoleRows, shellNavItems, defaultWorkbenchMetadata)
    const electro = insights.find((role) => role.code === 'electro-education-director')

    expect(electro).toMatchObject({
      name: '电教主任',
      accountCount: 1,
      visibleWorkbenchCount: 1,
      status: '已启用',
    })
  })

  test('previews shell menus with the same role rules as navigation', () => {
    const electroMenus = getVisibleMenusForRole('electro-education-director', shellNavItems).map((item) => item.path)
    const allStaffMenus = getVisibleMenusForRole('all-staff', shellNavItems).map((item) => item.path)

    expect(electroMenus).toEqual(['/overview', '/workbenches', '/data-dashboards', '/applications', '/alarms'])
    expect(allStaffMenus).toEqual(['/overview', '/workbenches', '/data-dashboards', '/blackboard', '/teaching'])
  })

  test('previews visible workbenches through workbench metadata helpers', () => {
    expect(getVisibleWorkbenchesForRole('electro-education-director').map((workbench) => workbench.name)).toEqual([
      '电教主任工作台',
    ])
    expect(getVisibleWorkbenchesForRole('system-admin').map((workbench) => workbench.name)).toEqual([
      '全员工作台',
      '电教主任工作台',
      '德育主任工作台',
      '教研主任工作台',
    ])
  })

  test('validates account drafts deterministically', () => {
    const emptyDraft = createAccountDraft()

    expect(validateAccountDraft(emptyDraft, demoAccountRows)).toEqual([
      '账号不能为空',
      '姓名不能为空',
      '至少选择一个角色',
    ])

    const duplicateDraft = {
      ...emptyDraft,
      username: 'admin',
      displayName: '重复管理员',
      roleCodes: ['system-admin' as const],
    }

    expect(validateAccountDraft(duplicateDraft, demoAccountRows)).toEqual(['账号已存在'])
  })

  test('creates, toggles, and resets local demo account state', () => {
    const draft = {
      username: 'demo_teacher',
      displayName: '演示教师',
      phone: '13800000006',
      roleCodes: ['all-staff' as const],
      status: '已启用' as const,
    }
    const created = createAccountFromDraft(draft, 6)
    const disabled = toggleAccountStatus(created)
    const reset = createDemoAccountState()

    expect(created).toMatchObject({
      id: 'user-demo-6',
      username: 'demo_teacher',
      displayName: '演示教师',
      roleCodes: ['all-staff'],
      lastLogin: '尚未登录',
    })
    expect(disabled.status).toBe('已停用')
    expect(reset.accounts).not.toBe(demoAccountRows)
    expect(reset.roles).not.toBe(demoRoleRows)
    expect(roleNameByCode['teaching-research-director']).toBe('教研主任')
  })
})
```

- [ ] **Step 2: Run the focused data test and confirm it fails**

Run:

```powershell
npm --workspace apps/web run test -- accountData.test.ts
```

Expected: FAIL because `apps/web/src/features/accounts/accountData.ts` does not exist.

- [ ] **Step 3: Add the account data implementation**

Create `apps/web/src/features/accounts/accountData.ts` with this content:

```ts
import type { CurrentUser, RoleCode } from '@analytics/shared'
import {
  defaultWorkbenchMetadata,
  getVisibleWorkbenches,
  type WorkbenchMetadata,
} from '../big-screen/workbenches/workbenchMetadata'
import { getVisibleShellNavItems, shellNavItems, type ShellNavItem } from '../shell/navigation'

export type AccountStatus = '已启用' | '已停用'
export type RoleName = '系统管理员' | '全员' | '电教主任' | '德育主任' | '教研主任'
export type DemoRoleStatus = '已启用'

export type DemoRole = {
  id: string
  code: RoleCode
  name: RoleName
  description: string
  status: DemoRoleStatus
}

export type DemoAccount = {
  id: string
  username: string
  displayName: string
  phone: string
  roleCodes: RoleCode[]
  status: AccountStatus
  lastLogin: string
}

export type AccountDraft = {
  username: string
  displayName: string
  phone: string
  roleCodes: RoleCode[]
  status: AccountStatus
}

export type AccountSummary = {
  totalAccounts: number
  enabledAccounts: number
  roleCount: number
  boundWorkbenches: number
}

export type RoleInsight = DemoRole & {
  accountCount: number
  visibleMenuCount: number
  visibleWorkbenchCount: number
}

export type RoleAccessNote = {
  label: string
  enabled: boolean
}

export const roleNameByCode: Record<RoleCode, RoleName> = {
  'system-admin': '系统管理员',
  'all-staff': '全员',
  'electro-education-director': '电教主任',
  'moral-education-director': '德育主任',
  'teaching-research-director': '教研主任',
}

export const roleCodeByName = Object.fromEntries(
  Object.entries(roleNameByCode).map(([code, name]) => [name, code]),
) as Record<RoleName, RoleCode>

export const demoRoleRows: DemoRole[] = [
  {
    id: 'role-system-admin',
    code: 'system-admin',
    name: '系统管理员',
    description: '平台配置与演示管理账号',
    status: '已启用',
  },
  {
    id: 'role-all-staff',
    code: 'all-staff',
    name: '全员',
    description: '全校教职工默认角色',
    status: '已启用',
  },
  {
    id: 'role-electro-education-director',
    code: 'electro-education-director',
    name: '电教主任',
    description: '负责电教设备、应用与运维告警',
    status: '已启用',
  },
  {
    id: 'role-moral-education-director',
    code: 'moral-education-director',
    name: '德育主任',
    description: '负责德育与学生成长相关看板',
    status: '已启用',
  },
  {
    id: 'role-teaching-research-director',
    code: 'teaching-research-director',
    name: '教研主任',
    description: '负责教研与教师发展相关看板',
    status: '已启用',
  },
]

export const demoAccountRows: DemoAccount[] = [
  {
    id: 'user-system-admin',
    username: 'admin',
    displayName: '系统管理员',
    phone: '13800000001',
    roleCodes: ['system-admin'],
    status: '已启用',
    lastLogin: '2026-07-03 09:18',
  },
  {
    id: 'user-all-staff',
    username: 'all_staff',
    displayName: '全员演示账号',
    phone: '13800000002',
    roleCodes: ['all-staff'],
    status: '已启用',
    lastLogin: '2026-07-03 08:56',
  },
  {
    id: 'user-electro-director',
    username: 'electro_director',
    displayName: '电教主任',
    phone: '13800000003',
    roleCodes: ['electro-education-director'],
    status: '已启用',
    lastLogin: '2026-07-03 08:42',
  },
  {
    id: 'user-moral-director',
    username: 'moral_director',
    displayName: '德育主任',
    phone: '13800000004',
    roleCodes: ['moral-education-director'],
    status: '已启用',
    lastLogin: '2026-07-03 08:30',
  },
  {
    id: 'user-research-director',
    username: 'research_director',
    displayName: '教研主任',
    phone: '13800000005',
    roleCodes: ['teaching-research-director'],
    status: '已启用',
    lastLogin: '2026-07-03 08:20',
  },
]

function cloneAccount(account: DemoAccount): DemoAccount {
  return { ...account, roleCodes: [...account.roleCodes] }
}

function cloneRole(role: DemoRole): DemoRole {
  return { ...role }
}

export function createDemoAccountState() {
  return {
    accounts: demoAccountRows.map(cloneAccount),
    roles: demoRoleRows.map(cloneRole),
  }
}

export function createAccountDraft(): AccountDraft {
  return {
    username: '',
    displayName: '',
    phone: '',
    roleCodes: [],
    status: '已启用',
  }
}

export function createAccountFromDraft(draft: AccountDraft, nextIndex: number): DemoAccount {
  return {
    id: `user-demo-${nextIndex}`,
    username: draft.username.trim(),
    displayName: draft.displayName.trim(),
    phone: draft.phone.trim(),
    roleCodes: [...draft.roleCodes],
    status: draft.status,
    lastLogin: '尚未登录',
  }
}

export function validateAccountDraft(
  draft: AccountDraft,
  existingAccounts: DemoAccount[],
  editingId: string | null = null,
): string[] {
  const errors: string[] = []
  const username = draft.username.trim()

  if (!username) errors.push('账号不能为空')
  if (!draft.displayName.trim()) errors.push('姓名不能为空')
  if (draft.roleCodes.length === 0) errors.push('至少选择一个角色')

  const duplicate = existingAccounts.some(
    (account) => account.id !== editingId && account.username.toLowerCase() === username.toLowerCase(),
  )
  if (username && duplicate) errors.push('账号已存在')

  return errors
}

export function buildAccountSummary(
  accounts: DemoAccount[],
  roles: DemoRole[],
  workbenches: WorkbenchMetadata[] = defaultWorkbenchMetadata,
): AccountSummary {
  return {
    totalAccounts: accounts.length,
    enabledAccounts: accounts.filter((account) => account.status === '已启用').length,
    roleCount: roles.length,
    boundWorkbenches: workbenches.filter((workbench) => workbench.visibleRoles.length > 0).length,
  }
}

export function getAccountsByRole(accounts: DemoAccount[], roleCode: RoleCode): DemoAccount[] {
  return accounts.filter((account) => account.roleCodes.includes(roleCode))
}

export function createPreviewUser(roleCode: RoleCode): CurrentUser {
  const role = demoRoleRows.find((item) => item.code === roleCode) ?? demoRoleRows[0]!

  return {
    id: `preview-${role.code}`,
    username: `preview_${role.code}`,
    displayName: role.name,
    status: 'active',
    roles: [{ id: role.id, code: role.code, name: role.name }],
  }
}

export function getVisibleMenusForRole(
  roleCode: RoleCode,
  navItems: ShellNavItem[] = shellNavItems,
): ShellNavItem[] {
  const visiblePaths = new Set(getVisibleShellNavItems(createPreviewUser(roleCode)).map((item) => item.path))
  return navItems.filter((item) => visiblePaths.has(item.path))
}

export function getVisibleWorkbenchesForRole(
  roleCode: RoleCode,
  workbenches: WorkbenchMetadata[] = defaultWorkbenchMetadata,
): WorkbenchMetadata[] {
  return getVisibleWorkbenches(workbenches, [roleNameByCode[roleCode]])
}

export function buildRoleInsights(
  accounts: DemoAccount[],
  roles: DemoRole[],
  navItems: ShellNavItem[] = shellNavItems,
  workbenches: WorkbenchMetadata[] = defaultWorkbenchMetadata,
): RoleInsight[] {
  return roles.map((role) => ({
    ...role,
    accountCount: getAccountsByRole(accounts, role.code).length,
    visibleMenuCount: getVisibleMenusForRole(role.code, navItems).length,
    visibleWorkbenchCount: getVisibleWorkbenchesForRole(role.code, workbenches).length,
  }))
}

export function buildRoleAccessNotes(roleCode: RoleCode, navItems: ShellNavItem[] = shellNavItems): RoleAccessNote[] {
  const visiblePaths = new Set(getVisibleMenusForRole(roleCode, navItems).map((item) => item.path))

  return [
    { label: '数据看板', enabled: visiblePaths.has('/data-dashboards') },
    { label: '应用中心', enabled: visiblePaths.has('/applications') },
    { label: '告警管理', enabled: visiblePaths.has('/alarms') },
    { label: '智慧黑板', enabled: visiblePaths.has('/blackboard') },
    { label: '互动教学', enabled: visiblePaths.has('/teaching') },
  ]
}

export function toggleAccountStatus(account: DemoAccount): DemoAccount {
  return {
    ...account,
    roleCodes: [...account.roleCodes],
    status: account.status === '已启用' ? '已停用' : '已启用',
  }
}
```

- [ ] **Step 4: Run the focused data test and confirm it passes**

Run:

```powershell
npm --workspace apps/web run test -- accountData.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```powershell
git add -- apps/web/src/features/accounts/accountData.ts apps/web/src/features/accounts/accountData.test.ts
git commit -m "feat: add account role demo data"
```

## Task 2: Account And Role Management View

**Files:**

- Create: `apps/web/src/features/accounts/AccountsView.test.ts`
- Create: `apps/web/src/features/accounts/AccountsView.vue`

- [ ] **Step 1: Write the failing component tests**

Create `apps/web/src/features/accounts/AccountsView.test.ts` with this content:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AccountsView from './AccountsView.vue'

const elementStubs = {
  ElSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select :data-testid="$attrs[\'data-testid\']" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
  }
})

async function mountAccountsView() {
  const wrapper = mount(AccountsView, {
    global: {
      plugins: [ElementPlus],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return wrapper
}

describe('AccountsView', () => {
  beforeEach(() => {
    vi.mocked(ElMessage.error).mockReset()
    vi.mocked(ElMessage.success).mockReset()
    vi.mocked(ElMessageBox.confirm).mockReset()
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(
      'confirm' as unknown as Awaited<ReturnType<typeof ElMessageBox.confirm>>,
    )
  })

  test('renders summary cards, account table, role table, and visibility preview', async () => {
    const wrapper = await mountAccountsView()

    expect(wrapper.text()).toContain('账号与角色')
    expect(wrapper.text()).toContain('账号总数')
    expect(wrapper.text()).toContain('启用账号')
    expect(wrapper.text()).toContain('角色数量')
    expect(wrapper.text()).toContain('已绑定工作台')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('electro_director')
    expect(wrapper.text()).toContain('系统管理员')
    expect(wrapper.text()).toContain('角色可见性预览')
  })

  test('updates the preview when selecting another role', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-preview-role-select"]').setValue('electro-education-director')
    await flushPromises()

    expect(wrapper.get('[data-testid="account-visible-menu-list"]').text()).toContain('应用中心')
    expect(wrapper.get('[data-testid="account-visible-menu-list"]').text()).toContain('告警管理')
    expect(wrapper.get('[data-testid="account-visible-menu-list"]').text()).not.toContain('智慧黑板')
    expect(wrapper.get('[data-testid="account-visible-workbench-list"]').text()).toContain('电教主任工作台')
  })

  test('validates required fields before adding an account', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="accounts-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="account-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('账号不能为空')
    expect(wrapper.text()).toContain('姓名不能为空')
    expect(wrapper.text()).toContain('至少选择一个角色')
    expect(ElMessage.error).toHaveBeenCalledWith('账号不能为空')
  })

  test('adds a valid local demo account', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="accounts-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="account-username-input"]').setValue('demo_teacher')
    await wrapper.get('[data-testid="account-display-name-input"]').setValue('演示教师')
    await wrapper.get('[data-testid="account-phone-input"]').setValue('13800000006')
    await wrapper.findComponent({ name: 'ElCheckboxGroup' }).vm.$emit('update:modelValue', ['all-staff'])
    await wrapper.get('[data-testid="account-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('demo_teacher')
    expect(wrapper.text()).toContain('演示教师')
    expect(ElMessage.success).toHaveBeenCalledWith('演示账号已添加')
  })

  test('toggles account status and resets password through simulated actions', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-toggle-user-research-director"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="account-status-user-research-director"]').text()).toContain('已停用')

    await wrapper.get('[data-testid="account-reset-password-user-research-director"]').trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalled()
    expect(ElMessage.success).toHaveBeenCalledWith('已生成演示密码：Demo@123')
  })

  test('edits a role description and visible workbenches through the local role drawer', async () => {
    const wrapper = await mountAccountsView()

    wrapper.findComponent({ name: 'ElTabs' }).vm.$emit('update:modelValue', 'roles')
    await flushPromises()
    await wrapper.get('[data-testid="account-role-edit-role-electro-education-director"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="role-description-input"]').setValue('负责电教设备、应用与告警联动演示')
    const checkboxGroups = wrapper.findAllComponents({ name: 'ElCheckboxGroup' })
    expect(checkboxGroups.length).toBeGreaterThan(0)
    checkboxGroups.at(-1)!.vm.$emit('update:modelValue', ['dashboard-electro', 'dashboard-all'])
    await wrapper.get('[data-testid="role-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('负责电教设备、应用与告警联动演示')
    await wrapper.get('[data-testid="account-preview-role-select"]').setValue('electro-education-director')
    expect(wrapper.get('[data-testid="account-visible-workbench-list"]').text()).toContain('全员工作台')
    expect(ElMessage.success).toHaveBeenCalledWith('角色绑定已更新')
  })

  test('restores seeded demo state', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-toggle-user-research-director"]').trigger('click')
    await wrapper.get('[data-testid="accounts-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="account-status-user-research-director"]').text()).toContain('已启用')
    expect(ElMessage.success).toHaveBeenCalledWith('演示状态已重置')
  })
})
```

- [ ] **Step 2: Run the focused component test and confirm it fails**

Run:

```powershell
npm --workspace apps/web run test -- AccountsView.test.ts
```

Expected: FAIL because `AccountsView.vue` does not exist.

- [ ] **Step 3: Add the account management view**

Create `apps/web/src/features/accounts/AccountsView.vue`. Use this implementation shape:

```vue
<script setup lang="ts">
import { Edit, Key, Plus, Refresh, UserFilled } from '@element-plus/icons-vue'
import type { RoleCode } from '@analytics/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { defaultWorkbenchMetadata } from '../big-screen/workbenches/workbenchMetadata'
import { shellNavItems } from '../shell/navigation'
import {
  buildAccountSummary,
  buildRoleAccessNotes,
  buildRoleInsights,
  createAccountDraft,
  createAccountFromDraft,
  createDemoAccountState,
  getVisibleMenusForRole,
  getVisibleWorkbenchesForRole,
  roleNameByCode,
  toggleAccountStatus,
  validateAccountDraft,
  type AccountDraft,
  type AccountStatus,
  type DemoAccount,
} from './accountData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const seeded = createDemoAccountState()
const accounts = ref<DemoAccount[]>(seeded.accounts)
const roles = ref(seeded.roles)
const workbenches = ref(defaultWorkbenchMetadata.map((workbench) => ({ ...workbench, visibleRoles: [...workbench.visibleRoles] })))
const selectedRoleCode = ref<RoleCode>('electro-education-director')
const activeTab = ref('accounts')
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive<AccountDraft>(createAccountDraft())
const roleDrawerVisible = ref(false)
const editingRoleCode = ref<RoleCode | null>(null)
const roleDraft = reactive({
  name: '',
  description: '',
  visibleWorkbenchIds: [] as string[],
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

const roleOptions = computed(() => roles.value.map((role) => ({ label: role.name, value: role.code })))
const summary = computed(() => buildAccountSummary(accounts.value, roles.value))
const roleInsights = computed(() => buildRoleInsights(accounts.value, roles.value, shellNavItems, workbenches.value))
const visibleMenus = computed(() => getVisibleMenusForRole(selectedRoleCode.value))
const visibleWorkbenches = computed(() => getVisibleWorkbenchesForRole(selectedRoleCode.value, workbenches.value))
const accessNotes = computed(() => buildRoleAccessNotes(selectedRoleCode.value))
const selectedRole = computed(() => roles.value.find((role) => role.code === selectedRoleCode.value))
const drawerTitle = computed(() => (editingId.value ? '编辑账号' : '新增账号'))
const roleDrawerTitle = computed(() => (editingRoleCode.value ? '编辑角色' : '角色详情'))

function getStatusTagType(status: AccountStatus): TagType {
  return status === '已启用' ? 'success' : 'info'
}

function getRoleLabels(account: DemoAccount): string[] {
  return account.roleCodes.map((roleCode) => roleNameByCode[roleCode])
}

function getAccountWorkbenchNames(account: DemoAccount): string[] {
  const names = account.roleCodes.flatMap((roleCode) =>
    getVisibleWorkbenchesForRole(roleCode, workbenches.value).map((workbench) => workbench.name),
  )
  return [...new Set(names)]
}

function resetFieldErrors() {
  Object.assign(fieldErrors, {
    username: '',
    displayName: '',
    roleCodes: '',
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

function openRoleDrawer(role: { code: RoleCode; name: string; description: string }) {
  roleDraft.name = role.name
  roleDraft.description = role.description
  roleDraft.visibleWorkbenchIds = getVisibleWorkbenchesForRole(role.code, workbenches.value).map((workbench) => workbench.id)
  roleFieldErrors.name = ''
  roleFieldErrors.description = ''
  editingRoleCode.value = role.code
  roleDrawerVisible.value = true
}

function saveAccount() {
  const errors = validateAccountDraft(draft, accounts.value, editingId.value)
  if (errors.length > 0) {
    setFieldErrors(errors)
    ElMessage.error(errors[0])
    return
  }

  if (editingId.value) {
    const target = accounts.value.find((account) => account.id === editingId.value)
    if (target) {
      Object.assign(target, {
        username: draft.username.trim(),
        displayName: draft.displayName.trim(),
        phone: draft.phone.trim(),
        roleCodes: [...draft.roleCodes],
        status: draft.status,
      })
    }
    ElMessage.success('角色绑定已更新')
  } else {
    accounts.value.push(createAccountFromDraft(draft, accounts.value.length + 1))
    ElMessage.success('演示账号已添加')
  }

  resetFieldErrors()
  drawerVisible.value = false
}

function saveRole() {
  roleFieldErrors.name = roleDraft.name.trim() ? '' : '角色名称不能为空'
  roleFieldErrors.description = roleDraft.description.trim() ? '' : '角色说明不能为空'

  if (roleFieldErrors.name || roleFieldErrors.description) {
    ElMessage.error(roleFieldErrors.name || roleFieldErrors.description)
    return
  }

  const target = roles.value.find((role) => role.code === editingRoleCode.value)
  if (target) {
    target.name = roleDraft.name.trim() as typeof target.name
    target.description = roleDraft.description.trim()
  }

  if (editingRoleCode.value && editingRoleCode.value !== 'system-admin') {
    const roleName = roleNameByCode[editingRoleCode.value]
    workbenches.value = workbenches.value.map((workbench) => {
      const visibleRoles = workbench.visibleRoles.filter((name) => name !== roleName)
      if (roleDraft.visibleWorkbenchIds.includes(workbench.id)) visibleRoles.push(roleName)
      return { ...workbench, visibleRoles }
    })
  }

  roleDrawerVisible.value = false
  ElMessage.success('角色绑定已更新')
}

function toggleStatus(account: DemoAccount) {
  const index = accounts.value.findIndex((item) => item.id === account.id)
  if (index === -1) return
  accounts.value[index] = toggleAccountStatus(account)
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

  ElMessage.success('已生成演示密码：Demo@123')
}

function resetDemoState() {
  const state = createDemoAccountState()
  accounts.value = state.accounts
  roles.value = state.roles
  workbenches.value = defaultWorkbenchMetadata.map((workbench) => ({ ...workbench, visibleRoles: [...workbench.visibleRoles] }))
  selectedRoleCode.value = 'electro-education-director'
  ElMessage.success('演示状态已重置')
}
</script>
```

The template must include these exact anchors for tests and Playwright:

```vue
<template>
  <main class="accounts-view">
    <header class="accounts-view__header">
      <div>
        <div class="accounts-view__eyebrow">
          <ElTag size="small" effect="plain">系统管理</ElTag>
          <ElTag type="success" size="small" effect="plain">演示账号</ElTag>
        </div>
        <h1>账号与角色</h1>
        <p>维护演示账号、角色绑定和工作台可见范围。</p>
      </div>
      <div class="accounts-view__actions">
        <ElButton data-testid="accounts-reset-button" :icon="Refresh" @click="resetDemoState">重置演示状态</ElButton>
        <ElButton data-testid="accounts-add-button" type="primary" :icon="Plus" @click="openAddDrawer">新增账号</ElButton>
      </div>
    </header>

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
            <ElTable :data="accounts" class="accounts-view__table">
              <ElTableColumn label="账号" min-width="150">
                <template #default="{ row }">
                  <div class="accounts-view__account-cell" :data-testid="`account-row-${row.id}`">
                    <ElIcon><UserFilled /></ElIcon>
                    <div>
                      <strong>{{ row.username }}</strong>
                      <span>{{ row.displayName }}</span>
                    </div>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="phone" label="手机号" width="128" />
              <ElTableColumn label="角色" min-width="150">
                <template #default="{ row }">
                  <div class="accounts-view__tag-list">
                    <ElTag v-for="role in getRoleLabels(row)" :key="role" size="small" effect="plain">{{ role }}</ElTag>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" width="92">
                <template #default="{ row }">
                  <ElTag :data-testid="`account-status-${row.id}`" :type="getStatusTagType(row.status)" size="small" effect="plain">{{ row.status }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="lastLogin" label="最近登录" width="152" />
              <ElTableColumn label="可见工作台" min-width="170">
                <template #default="{ row }">
                  <div class="accounts-view__tag-list">
                    <ElTag v-for="name in getAccountWorkbenchNames(row)" :key="name" size="small" effect="plain">
                      {{ name }}
                    </ElTag>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="210" fixed="right">
                <template #default="{ row }">
                  <ElButton link type="primary" size="small" :icon="Edit" :data-testid="`account-edit-${row.id}`" @click="openEditDrawer(row)">编辑</ElButton>
                  <ElButton link type="primary" size="small" :data-testid="`account-toggle-${row.id}`" @click="toggleStatus(row)">
                    {{ row.status === '已启用' ? '停用' : '启用' }}
                  </ElButton>
                  <ElButton link type="primary" size="small" :icon="Key" :data-testid="`account-reset-password-${row.id}`" @click="resetPassword(row)">重置密码</ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElTabPane>

          <ElTabPane label="角色管理" name="roles">
            <ElTable :data="roleInsights" class="accounts-view__table">
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
                  <ElButton link type="primary" size="small" :data-testid="`account-role-edit-${row.id}`" @click="openRoleDrawer(row)">编辑</ElButton>
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
            <ElTag v-for="note in accessNotes" :key="note.label" :type="note.enabled ? 'success' : 'info'" size="small" effect="plain">
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
          <p v-if="fieldErrors.displayName" class="accounts-view__field-error" role="alert">{{ fieldErrors.displayName }}</p>
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="draft.phone" data-testid="account-phone-input" placeholder="13800000006" />
        </ElFormItem>
        <ElFormItem label="角色" required :error="fieldErrors.roleCodes">
          <ElCheckboxGroup v-model="draft.roleCodes">
            <ElCheckbox v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</ElCheckbox>
          </ElCheckboxGroup>
          <p v-if="fieldErrors.roleCodes" class="accounts-view__field-error" role="alert">{{ fieldErrors.roleCodes }}</p>
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
          <ElInput v-model="roleDraft.description" data-testid="role-description-input" type="textarea" placeholder="请输入角色说明" />
          <p v-if="roleFieldErrors.description" class="accounts-view__field-error" role="alert">{{ roleFieldErrors.description }}</p>
        </ElFormItem>
        <ElFormItem label="可见工作台">
          <ElCheckboxGroup v-model="roleDraft.visibleWorkbenchIds">
            <ElCheckbox v-for="workbench in workbenches" :key="workbench.id" :value="workbench.id">
              {{ workbench.name }}
            </ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
        <ElAlert title="本页为演示级角色绑定，正式工作台发布仍以工作台配置页为准。" type="info" :closable="false" />
      </ElForm>
      <template #footer>
        <ElButton @click="roleDrawerVisible = false">取消</ElButton>
        <ElButton data-testid="role-save-button" type="primary" @click="saveRole">保存</ElButton>
      </template>
    </ElDrawer>
  </main>
</template>
```

Add scoped styles based on existing management pages:

```vue
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
```

- [ ] **Step 4: Run the focused component test and fix compile errors only inside `features/accounts`**

Run:

```powershell
npm --workspace apps/web run test -- AccountsView.test.ts accountData.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```powershell
git add -- apps/web/src/features/accounts/AccountsView.vue apps/web/src/features/accounts/AccountsView.test.ts
git commit -m "feat: add account role management page"
```

## Task 3: Router And Sidebar Integration

**Files:**

- Modify: `apps/web/src/features/shell/navigation.ts`
- Modify: `apps/web/src/features/shell/navigation.test.ts`
- Modify: `apps/web/src/router.ts`
- Modify: `apps/web/src/router.test.ts`
- Modify: `apps/web/src/smoke.test.ts`

- [ ] **Step 1: Update tests before implementation**

In `apps/web/src/features/shell/navigation.test.ts`, change the expected sidebar order to include `账号与角色` after `互动教学`:

```ts
expect(shellNavItems.map((item) => item.label)).toEqual([
  '首页总览',
  '工作台配置',
  '数据看板',
  '应用中心',
  '告警管理',
  '智慧黑板',
  '互动教学',
  '账号与角色',
])
```

Change the admin visible-path assertion to:

```ts
expect(getVisibleShellNavItems(adminUser).map((item) => item.path)).toEqual([
  '/overview',
  '/workbenches',
  '/data-dashboards',
  '/applications',
  '/alarms',
  '/blackboard',
  '/teaching',
  '/accounts',
])
```

Keep the all-staff visible-path assertion unchanged so it verifies `/accounts` is admin-only:

```ts
expect(getVisibleShellNavItems(allStaffUser).map((item) => item.path)).toEqual([
  '/overview',
  '/workbenches',
  '/data-dashboards',
  '/blackboard',
  '/teaching',
])
```

In `apps/web/src/router.test.ts`, add this import near the other view imports:

```ts
import AccountsView from './features/accounts/AccountsView.vue'
```

Add this test after the interactive teaching route test:

```ts
test('routes account role management to the dedicated admin page', async () => {
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
  const router = createTestRouter()

  await router.push('/accounts')

  const matchedComponent = router.currentRoute.value.matched.at(-1)?.components?.default

  expect(router.currentRoute.value.fullPath).toBe('/accounts')
  expect(matchedComponent).toBe(AccountsView)
})
```

In `apps/web/src/smoke.test.ts`, add `/accounts` to the expected route array:

```ts
'/accounts',
```

- [ ] **Step 2: Run the focused router/navigation tests and confirm they fail**

Run:

```powershell
npm --workspace apps/web run test -- navigation.test.ts router.test.ts smoke.test.ts
```

Expected: FAIL because navigation and router do not include `/accounts`.

- [ ] **Step 3: Add the sidebar item**

In `apps/web/src/features/shell/navigation.ts`, add `UserFilled` to the icon import:

```ts
import {
  Bell,
  Collection,
  DataAnalysis,
  Grid,
  HomeFilled,
  Monitor,
  Tickets,
  UserFilled,
} from '@element-plus/icons-vue'
```

Append this item after the `teaching` item:

```ts
{
  key: 'accounts',
  label: '账号与角色',
  path: '/accounts',
  icon: UserFilled,
  allowedRoles: ['system-admin'],
},
```

- [ ] **Step 4: Add the protected shell route**

In `apps/web/src/router.ts`, add this child route after `teaching`:

```ts
{ path: 'accounts', component: () => import('./features/accounts/AccountsView.vue') },
```

- [ ] **Step 5: Run the focused router/navigation tests**

Run:

```powershell
npm --workspace apps/web run test -- navigation.test.ts router.test.ts smoke.test.ts accountData.test.ts AccountsView.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```powershell
git add -- apps/web/src/features/shell/navigation.ts apps/web/src/features/shell/navigation.test.ts apps/web/src/router.ts apps/web/src/router.test.ts apps/web/src/smoke.test.ts
git commit -m "feat: wire account role page into shell"
```

## Task 4: Playwright Demo Rehearsal Coverage

**Files:**

- Modify: `apps/web/e2e/demo-rehearsal.spec.ts`

- [ ] **Step 1: Update the rehearsal gate before running it**

In `apps/web/e2e/demo-rehearsal.spec.ts`, change:

```ts
const demoNavLabels = ['首页总览', '工作台配置', '数据看板', '应用中心', '告警管理', '智慧黑板', '互动教学']
```

to:

```ts
const demoNavLabels = ['首页总览', '工作台配置', '数据看板', '应用中心', '告警管理', '智慧黑板', '互动教学', '账号与角色']
```

Replace the previous account/settings negative assertions:

```ts
await expect(sidebar.getByText('账号权限')).toHaveCount(0)
await expect(sidebar.getByText('系统设置')).toHaveCount(0)
```

with:

```ts
await expect(sidebar.getByText('账号权限')).toHaveCount(0)
await expect(sidebar.getByText('系统设置')).toHaveCount(0)
await expect(sidebar.getByText('账号与角色', { exact: true })).toBeVisible()
```

Insert this account-page block after the overview KPI assertions and before `/workbenches`:

```ts
await gotoRoute(page, '/accounts', '账号与角色')
await expectMetricCard(page.locator('section[aria-label="账号统计"] .el-card').filter({ hasText: '账号总数' }), '5')
await expectMetricCard(page.locator('section[aria-label="账号统计"] .el-card').filter({ hasText: '启用账号' }), '5')
await expectMetricCard(page.locator('section[aria-label="账号统计"] .el-card').filter({ hasText: '角色数量' }), '5')
await expect(page.getByText('admin').first()).toBeVisible()
await expect(page.getByText('electro_director').first()).toBeVisible()
await expect(page.getByText('research_director').first()).toBeVisible()
await page.getByTestId('account-preview-role-select').click()
await page.getByRole('option', { name: '电教主任' }).click()
await expect(page.getByTestId('account-visible-menu-list')).toContainText('应用中心')
await expect(page.getByTestId('account-visible-menu-list')).toContainText('告警管理')
await expect(page.getByTestId('account-visible-workbench-list')).toContainText('电教主任工作台')
await page.getByTestId('account-toggle-user-research-director').click()
await expect(page.getByTestId('account-status-user-research-director')).toContainText('已停用')
await page.getByTestId('accounts-reset-button').click()
await expect(page.getByTestId('account-status-user-research-director')).toContainText('已启用')
```

- [ ] **Step 2: Run the rehearsal gate**

Run:

```powershell
npm run demo:rehearsal
```

Expected: PASS in both configured Chrome projects.

- [ ] **Step 3: Fix only account-page selectors or timing issues**

If the test fails because the Element Plus select overlay is not selecting `电教主任`, replace the two select lines with this deterministic browser interaction:

```ts
await page.getByTestId('account-preview-role-select').click()
await page.locator('.el-select-dropdown__item').filter({ hasText: '电教主任' }).last().click()
```

Then rerun:

```powershell
npm run demo:rehearsal
```

Expected: PASS.

- [ ] **Step 4: Commit Task 4**

Run:

```powershell
git add -- apps/web/e2e/demo-rehearsal.spec.ts
git commit -m "test: cover account role page in demo rehearsal"
```

## Task 5: PM Demo Docs And Final Verification

**Files:**

- Modify: `docs/superpowers/pm/demo-script.md`
- Modify: `docs/superpowers/pm/final-rehearsal-checklist.md`

- [ ] **Step 1: Update the manual demo script**

In `docs/superpowers/pm/demo-script.md`, add this checkpoint near the beginning of the 集控控制管理系统 section:

```md
### 账号与角色

1. 使用 `admin / Admin@123` 登录。
2. 打开 `账号与角色`。
3. 展示五个演示账号：系统管理员、全员、电教主任、德育主任、教研主任。
4. 在 `角色可见性预览` 中选择 `电教主任`，说明该角色可见 `应用中心`、`告警管理` 和 `电教主任工作台`。
5. 将 `research_director` 停用再点击 `重置演示状态`，说明本页为演示级账号管理，不接入生产身份认证。
```

- [ ] **Step 2: Update the final rehearsal checklist**

In `docs/superpowers/pm/final-rehearsal-checklist.md`, add this checklist section before workbench checks:

```md
### 账号与角色

- [ ] Sidebar shows `账号与角色` for `admin`.
- [ ] `账号总数` shows `5`.
- [ ] Account table contains `admin`, `electro_director`, and `research_director`.
- [ ] `角色可见性预览` can switch to `电教主任`.
- [ ] Preview shows `电教主任工作台`.
- [ ] Toggling `research_director` changes status and `重置演示状态` restores `已启用`.
```

- [ ] **Step 3: Run the full quality gate**

Run:

```powershell
npm run test
npm run lint
npm run build
npm run demo:rehearsal
```

Expected:

- `npm run test`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm run demo:rehearsal`: PASS.

- [ ] **Step 4: Commit Task 5**

Run:

```powershell
git add -- docs/superpowers/pm/demo-script.md docs/superpowers/pm/final-rehearsal-checklist.md
git commit -m "docs: add account role demo checkpoint"
```

## PM Review Gate

After each task, the reviewing agent must check:

- The implementation still describes a demo-grade account page, not a production identity system.
- No `/api/users` endpoint was added.
- No database schema changes were made.
- Sidebar only shows `账号与角色` to `system-admin`.
- The page reuses `getVisibleShellNavItems` and `getVisibleWorkbenches` for previews.
- Tests cover the visible demo behavior instead of only snapshotting markup.
- `系统设置` remains absent from navigation.

## Final Acceptance Criteria

The slice is complete when:

- `/accounts` loads inside the protected app shell.
- Admin sees `账号与角色` in the sidebar.
- All non-admin roles do not see `账号与角色`.
- The page shows five seeded accounts and five seeded roles.
- The role preview for `电教主任` shows `应用中心`, `告警管理`, and `电教主任工作台`.
- Local add/edit/toggle/reset-password/reset-state interactions work.
- `npm run test`, `npm run lint`, `npm run build`, and `npm run demo:rehearsal` pass.
