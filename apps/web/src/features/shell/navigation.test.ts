import type { CurrentUser } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { getVisibleShellNavItems, shellNavItems } from './navigation'

const adminUser: CurrentUser = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  status: 'active',
  roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
}

const allStaffUser: CurrentUser = {
  id: 'user-all-staff',
  username: 'all_staff',
  displayName: '全员演示账号',
  status: 'active',
  roles: [{ id: 'role-all-staff', code: 'all-staff', name: '全员' }],
}

describe('shell navigation', () => {
  test('keeps the smart education sidebar order', () => {
    expect(shellNavItems.map((item) => item.label)).toEqual([
      '首页总览',
      '工作台配置',
      '数据看板',
      '应用中心',
      '告警管理',
      '智慧黑板',
      '互动教学',
      '账号权限',
      '系统设置',
    ])
  })

  test('shows every management item to system administrators', () => {
    expect(getVisibleShellNavItems(adminUser).map((item) => item.path)).toEqual([
      '/overview',
      '/workbenches',
      '/data-dashboards',
      '/applications',
      '/alarms',
      '/blackboard',
      '/teaching',
      '/accounts',
      '/settings',
    ])
  })

  test('shows only allowed demo entries to all-staff users', () => {
    expect(getVisibleShellNavItems(allStaffUser).map((item) => item.path)).toEqual([
      '/overview',
      '/workbenches',
      '/data-dashboards',
      '/blackboard',
      '/teaching',
    ])
  })
})
