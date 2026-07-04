import type { AccountRow } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { defaultWorkbenchMetadata } from '../big-screen/workbenches/workbenchMetadata'
import { shellNavItems } from '../shell/navigation'
import type { AccountRoleRow } from './accountApi'
import {
  accountRowToDemoAccount,
  accountRowsToDemoAccounts,
  accountStatusFromApi,
  accountStatusToApi,
  buildAccountSummary,
  buildCreateAccountInput,
  buildRoleInsights,
  buildUpdateAccountInput,
  createAccountDraft,
  demoAccountRows,
  demoRoleRows,
  getAccountsByRole,
  getNextAccountStatus,
  getVisibleMenusForRole,
  getVisibleWorkbenchesForRole,
  roleNameByCode,
  roleRowToDemoRole,
  roleRowsToDemoRoles,
  validateAccountDraft,
} from './accountData'

const backendAccount: AccountRow = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  phone: '13800000001',
  roleCodes: ['system-admin'],
  status: 'active',
  lastLoginAt: '2026-07-03T09:18:00.000Z',
}

const backendRole: AccountRoleRow = {
  id: 'role-system-admin',
  code: 'system-admin',
  name: '系统管理员',
  description: '平台配置与演示管理账号',
}

describe('account data helpers', () => {
  test('defines the five seeded tender-demo accounts and roles for previews', () => {
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

  test('maps backend account and role rows into the existing Chinese UI model', () => {
    expect(accountStatusFromApi('active')).toBe('已启用')
    expect(accountStatusFromApi('disabled')).toBe('已停用')
    expect(accountStatusToApi('已启用')).toBe('active')
    expect(accountStatusToApi('已停用')).toBe('disabled')
    expect(accountRowToDemoAccount(backendAccount)).toEqual({
      id: 'user-system-admin',
      username: 'admin',
      displayName: '系统管理员',
      phone: '13800000001',
      roleCodes: ['system-admin'],
      status: '已启用',
      lastLogin: '2026-07-03 09:18',
    })
    expect(accountRowsToDemoAccounts([{ ...backendAccount, lastLoginAt: null }])[0].lastLogin).toBe('尚未登录')
    expect(roleRowToDemoRole(backendRole)).toEqual({
      ...backendRole,
      name: '系统管理员',
      status: '已启用',
    })
    expect(roleRowsToDemoRoles([backendRole])).toHaveLength(1)
  })

  test('derives account summary from current account and role state', () => {
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

  test('validates account drafts deterministically before API calls', () => {
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

  test('builds backend create and update inputs from the Chinese UI draft', () => {
    const draft = {
      username: ' demo_teacher ',
      displayName: ' 演示教师 ',
      phone: ' 13800000006 ',
      roleCodes: ['all-staff' as const],
      status: '已停用' as const,
    }

    expect(buildCreateAccountInput(draft)).toEqual({
      username: 'demo_teacher',
      displayName: '演示教师',
      phone: '13800000006',
      password: 'Demo@123',
      roleCodes: ['all-staff'],
    })
    expect(buildUpdateAccountInput(draft)).toEqual({
      displayName: '演示教师',
      phone: '13800000006',
      roleCodes: ['all-staff'],
      status: 'disabled',
    })
    expect(getNextAccountStatus('已启用')).toBe('已停用')
    expect(roleNameByCode['teaching-research-director']).toBe('教研主任')
  })
})
