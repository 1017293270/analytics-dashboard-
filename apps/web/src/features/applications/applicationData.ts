export type ApplicationCategory = '教学工具' | '管理工具' | '数据看板' | '移动服务'
export type ApplicationPlatform = '网页端' | '移动端'
export type ApplicationStatus = '已启用' | '已停用' | '已卸载'
export type ApplicationCategoryFilter = ApplicationCategory | '全部'
export type ApplicationPlatformFilter = ApplicationPlatform | '全部'
export type ApplicationStatusFilter = ApplicationStatus | '全部'
export type VisibleRole = '全员' | '电教主任' | '德育主任' | '教研主任'
export type VisibleRoleFilter = VisibleRole | '全部'
export type ApplicationIcon =
  | 'notice'
  | 'shield'
  | 'approval'
  | 'energy'
  | 'message'
  | 'resource'
  | 'dashboard'
  | 'blackboard'

export type ManagedApplication = {
  id: string
  name: string
  category: ApplicationCategory
  platform: ApplicationPlatform
  url: string
  packageId: string
  icon: ApplicationIcon
  visibleRoles: VisibleRole[]
  status: ApplicationStatus
  sortOrder: number
}

export type ApplicationDraft = Omit<ManagedApplication, 'id' | 'sortOrder'>

export type ApplicationFilters = {
  keyword: string
  category: ApplicationCategoryFilter
  platform: ApplicationPlatformFilter
  status: ApplicationStatusFilter
  visibleRole: VisibleRoleFilter
}

export const applicationCategories: ApplicationCategoryFilter[] = ['全部', '教学工具', '管理工具', '数据看板', '移动服务']
export const applicationPlatforms: ApplicationPlatformFilter[] = ['全部', '网页端', '移动端']
export const applicationStatuses: ApplicationStatusFilter[] = ['全部', '已启用', '已停用', '已卸载']
export const visibleRoles: VisibleRole[] = ['全员', '电教主任', '德育主任', '教研主任']
export const visibleRoleFilters: VisibleRoleFilter[] = ['全部', ...visibleRoles]

export const defaultApplicationFilters: ApplicationFilters = {
  keyword: '',
  category: '全部',
  platform: '全部',
  status: '全部',
  visibleRole: '全部',
}

export const seedApplications: ManagedApplication[] = [
  {
    id: 'app-notice',
    name: '校园通知发布系统',
    category: '管理工具',
    platform: '网页端',
    url: 'https://demo.school.local/notice',
    packageId: '',
    icon: 'notice',
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 1,
  },
  {
    id: 'app-inspection',
    name: '移动巡检',
    category: '管理工具',
    platform: '移动端',
    url: '',
    packageId: 'com.school.inspection',
    icon: 'shield',
    visibleRoles: ['电教主任'],
    status: '已启用',
    sortOrder: 2,
  },
  {
    id: 'app-leave',
    name: '学生请假审批',
    category: '移动服务',
    platform: '网页端',
    url: 'https://demo.school.local/leave',
    packageId: '',
    icon: 'approval',
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 3,
  },
  {
    id: 'app-energy',
    name: '能耗管理平台',
    category: '数据看板',
    platform: '网页端',
    url: 'https://demo.school.local/energy',
    packageId: '',
    icon: 'energy',
    visibleRoles: ['电教主任'],
    status: '已停用',
    sortOrder: 4,
  },
  {
    id: 'app-family',
    name: '家校沟通助手',
    category: '移动服务',
    platform: '移动端',
    url: '',
    packageId: 'com.school.family',
    icon: 'message',
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 5,
  },
  {
    id: 'app-resource',
    name: '教研资源库',
    category: '教学工具',
    platform: '网页端',
    url: 'https://demo.school.local/resources',
    packageId: '',
    icon: 'resource',
    visibleRoles: ['教研主任'],
    status: '已启用',
    sortOrder: 6,
  },
  {
    id: 'app-governance',
    name: '教育治理看板',
    category: '数据看板',
    platform: '网页端',
    url: 'https://demo.school.local/governance',
    packageId: '',
    icon: 'dashboard',
    visibleRoles: ['全员', '电教主任', '德育主任', '教研主任'],
    status: '已启用',
    sortOrder: 7,
  },
  {
    id: 'app-blackboard',
    name: '智慧黑板工具',
    category: '教学工具',
    platform: '移动端',
    url: '',
    packageId: 'com.school.blackboard',
    icon: 'blackboard',
    visibleRoles: ['全员', '教研主任'],
    status: '已停用',
    sortOrder: 8,
  },
]

export function createApplicationDraft(): ApplicationDraft {
  return {
    name: '',
    category: '管理工具',
    platform: '网页端',
    url: '',
    packageId: '',
    icon: 'notice',
    visibleRoles: ['全员'],
    status: '已启用',
  }
}

export function applicationSummary(applications: ManagedApplication[]) {
  return {
    total: applications.length,
    web: applications.filter((app) => app.platform === '网页端').length,
    mobile: applications.filter((app) => app.platform === '移动端').length,
    enabled: applications.filter((app) => app.status === '已启用').length,
  }
}

export function applyApplicationFilters(
  applications: ManagedApplication[],
  filters: ApplicationFilters,
): ManagedApplication[] {
  const keyword = filters.keyword.trim().toLowerCase()

  return applications
    .filter((app) => {
      const searchableText = [app.name, app.url, app.packageId, app.category].join(' ').toLowerCase()
      const matchesKeyword = keyword.length === 0 || searchableText.includes(keyword)
      const matchesCategory = filters.category === '全部' || app.category === filters.category
      const matchesPlatform = filters.platform === '全部' || app.platform === filters.platform
      const matchesStatus = filters.status === '全部' || app.status === filters.status
      const matchesRole = filters.visibleRole === '全部' || app.visibleRoles.includes(filters.visibleRole)

      return matchesKeyword && matchesCategory && matchesPlatform && matchesStatus && matchesRole
    })
    .sort((first, second) => first.sortOrder - second.sortOrder)
}

export function validateApplicationDraft(draft: ApplicationDraft): string[] {
  const errors: string[] = []

  if (!draft.name.trim()) errors.push('应用名称不能为空')
  if (!draft.category) errors.push('应用分类不能为空')
  if (draft.visibleRoles.length === 0) errors.push('至少选择一个可见角色')
  if (draft.platform === '网页端' && !draft.url.trim()) errors.push('网页端应用需要填写访问地址')
  if (draft.platform === '移动端' && !draft.packageId.trim()) errors.push('移动端应用需要填写包标识')

  return errors
}
