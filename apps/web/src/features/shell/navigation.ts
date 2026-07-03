import type { CurrentUser, RoleCode } from '@analytics/shared'
import { isSystemAdmin } from '@analytics/shared'
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
import type { Component } from 'vue'

export type ShellNavItem = {
  key: string
  label: string
  path: string
  icon: Component
  allowedRoles: RoleCode[] | 'all'
}

export const shellNavItems: ShellNavItem[] = [
  { key: 'overview', label: '首页总览', path: '/overview', icon: HomeFilled, allowedRoles: 'all' },
  {
    key: 'workbenches',
    label: '工作台配置',
    path: '/workbenches',
    icon: Grid,
    allowedRoles: [
      'system-admin',
      'all-staff',
      'electro-education-director',
      'moral-education-director',
      'teaching-research-director',
    ],
  },
  {
    key: 'data-dashboards',
    label: '数据看板',
    path: '/data-dashboards',
    icon: DataAnalysis,
    allowedRoles: [
      'system-admin',
      'all-staff',
      'electro-education-director',
      'moral-education-director',
      'teaching-research-director',
    ],
  },
  {
    key: 'applications',
    label: '应用中心',
    path: '/applications',
    icon: Collection,
    allowedRoles: ['system-admin', 'electro-education-director'],
  },
  {
    key: 'alarms',
    label: '告警管理',
    path: '/alarms',
    icon: Bell,
    allowedRoles: ['system-admin', 'electro-education-director'],
  },
  {
    key: 'blackboard',
    label: '智慧黑板',
    path: '/blackboard',
    icon: Tickets,
    allowedRoles: ['system-admin', 'all-staff', 'teaching-research-director'],
  },
  {
    key: 'teaching',
    label: '互动教学',
    path: '/teaching',
    icon: Monitor,
    allowedRoles: ['system-admin', 'all-staff', 'teaching-research-director'],
  },
  {
    key: 'accounts',
    label: '账号与角色',
    path: '/accounts',
    icon: UserFilled,
    allowedRoles: ['system-admin'],
  },
]

export function getVisibleShellNavItems(user: CurrentUser | null): ShellNavItem[] {
  if (!user) return []
  if (isSystemAdmin(user)) return shellNavItems

  const roleCodes = new Set(user.roles.map((role) => role.code))
  return shellNavItems.filter(
    (item) => item.allowedRoles === 'all' || item.allowedRoles.some((roleCode) => roleCodes.has(roleCode)),
  )
}

export function getActiveShellNavPath(navItems: ShellNavItem[], currentPath: string): string {
  const matchingItem = [...navItems]
    .sort((first, second) => second.path.length - first.path.length)
    .find((item) => currentPath === item.path || currentPath.startsWith(`${item.path}/`))

  return matchingItem?.path ?? currentPath
}
