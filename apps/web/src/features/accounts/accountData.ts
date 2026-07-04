import type {
  AccountRow,
  CreateAccountInput,
  CurrentUser,
  RoleCode,
  UpdateAccountInput,
  UserStatus,
} from '@analytics/shared'
import {
  defaultWorkbenchMetadata,
  getVisibleWorkbenches,
  type WorkbenchMetadata,
} from '../big-screen/workbenches/workbenchMetadata'
import { getVisibleShellNavItems, shellNavItems, type ShellNavItem } from '../shell/navigation'
import type { AccountRoleRow } from './accountApi'

export type AccountStatus = '已启用' | '已停用'
export type RoleName = '系统管理员' | '全员' | '电教主任' | '德育主任' | '教研主任'
export type DemoRoleStatus = '已启用'

export const defaultDemoPassword = 'Demo@123'

const accountStatusByApiStatus: Record<UserStatus, AccountStatus> = {
  active: '已启用',
  disabled: '已停用',
}

const apiStatusByAccountStatus: Record<AccountStatus, UserStatus> = {
  已启用: 'active',
  已停用: 'disabled',
}

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

export function accountStatusFromApi(status: UserStatus): AccountStatus {
  return accountStatusByApiStatus[status]
}

export function accountStatusToApi(status: AccountStatus): UserStatus {
  return apiStatusByAccountStatus[status]
}

export function getNextAccountStatus(status: AccountStatus): AccountStatus {
  return status === '已启用' ? '已停用' : '已启用'
}

function formatLastLogin(lastLoginAt: string | null): string {
  return lastLoginAt ? lastLoginAt.replace('T', ' ').slice(0, 16) : '尚未登录'
}

export function accountRowToDemoAccount(row: AccountRow): DemoAccount {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    phone: row.phone,
    roleCodes: [...row.roleCodes],
    status: accountStatusFromApi(row.status),
    lastLogin: formatLastLogin(row.lastLoginAt),
  }
}

export function accountRowsToDemoAccounts(rows: AccountRow[]): DemoAccount[] {
  return rows.map(accountRowToDemoAccount)
}

export function roleRowToDemoRole(row: AccountRoleRow): DemoRole {
  return {
    id: row.id,
    code: row.code,
    name: (row.name || roleNameByCode[row.code]) as RoleName,
    description: row.description,
    status: '已启用',
  }
}

export function roleRowsToDemoRoles(rows: AccountRoleRow[]): DemoRole[] {
  return rows.map(roleRowToDemoRole)
}

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

export function buildCreateAccountInput(draft: AccountDraft): CreateAccountInput {
  return {
    username: draft.username.trim(),
    displayName: draft.displayName.trim(),
    phone: draft.phone.trim(),
    password: defaultDemoPassword,
    roleCodes: [...draft.roleCodes],
  }
}

export function buildUpdateAccountInput(draft: AccountDraft): UpdateAccountInput {
  return {
    displayName: draft.displayName.trim(),
    phone: draft.phone.trim(),
    status: accountStatusToApi(draft.status),
    roleCodes: [...draft.roleCodes],
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
  const role = demoRoleRows.find((item) => item.code === roleCode) ?? demoRoleRows[0]

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
