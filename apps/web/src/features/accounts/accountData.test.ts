import { describe, expect, test } from 'vitest'
import { defaultWorkbenchMetadata } from '../big-screen/workbenches/workbenchMetadata'
import { shellNavItems } from '../shell/navigation'
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
