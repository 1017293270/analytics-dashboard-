import type {
  ApplicationCategoryRow,
  ApplicationPlatform as ApplicationPlatformCode,
  ApplicationRow,
  ApplicationStatus as ApplicationStatusCode,
  CreateApplicationInput,
  RoleCode,
  UpdateApplicationInput,
} from '@analytics/shared'

export type ApplicationCategory = string
export type ApplicationPlatform = '网页端' | '移动端'
export type ApplicationStatus = '已启用' | '已停用' | '已卸载'
export type ApplicationCategoryFilter = ApplicationCategory | '全部'
export type ApplicationPlatformFilter = ApplicationPlatform | '全部'
export type ApplicationStatusFilter = ApplicationStatus | '全部'
export type VisibleRole = '系统管理员' | '全员' | '电教主任' | '德育主任' | '教研主任'
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
  categoryId: string
  category: ApplicationCategory
  platform: ApplicationPlatform
  url: string
  packageId: string
  icon: ApplicationIcon
  visibleRoleCodes: RoleCode[]
  visibleRoles: VisibleRole[]
  status: ApplicationStatus
  sortOrder: number
}

export type ApplicationDraft = {
  name: string
  categoryId: string
  category: ApplicationCategory
  platform: ApplicationPlatform
  url: string
  packageId: string
  icon: ApplicationIcon
  visibleRoles: VisibleRole[]
  status: Exclude<ApplicationStatus, '已卸载'>
}

export type ApplicationFilters = {
  keyword: string
  category: ApplicationCategoryFilter
  platform: ApplicationPlatformFilter
  status: ApplicationStatusFilter
  visibleRole: VisibleRoleFilter
}

export const defaultApplicationCategoryOptions: ApplicationCategoryRow[] = [
  { id: 'teaching-tools', name: '教学工具', sortOrder: 1 },
  { id: 'management-tools', name: '管理工具', sortOrder: 2 },
  { id: 'data-dashboard', name: '数据看板', sortOrder: 3 },
  { id: 'mobile-service', name: '移动服务', sortOrder: 4 },
]

export const applicationCategories: ApplicationCategoryFilter[] = [
  '全部',
  ...defaultApplicationCategoryOptions.map((category) => category.name),
]
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

const platformLabelByCode: Record<ApplicationPlatformCode, ApplicationPlatform> = {
  web: '网页端',
  mobile: '移动端',
}

const platformCodeByLabel: Record<ApplicationPlatform, ApplicationPlatformCode> = {
  网页端: 'web',
  移动端: 'mobile',
}

const statusLabelByCode: Record<ApplicationStatusCode, ApplicationStatus> = {
  enabled: '已启用',
  disabled: '已停用',
  uninstalled: '已卸载',
}

const statusCodeByLabel: Record<ApplicationStatus, ApplicationStatusCode> = {
  已启用: 'enabled',
  已停用: 'disabled',
  已卸载: 'uninstalled',
}

const roleLabelByCode: Record<RoleCode, VisibleRole> = {
  'system-admin': '系统管理员',
  'all-staff': '全员',
  'electro-education-director': '电教主任',
  'moral-education-director': '德育主任',
  'teaching-research-director': '教研主任',
}

const roleCodeByLabel: Record<VisibleRole, RoleCode> = {
  系统管理员: 'system-admin',
  全员: 'all-staff',
  电教主任: 'electro-education-director',
  德育主任: 'moral-education-director',
  教研主任: 'teaching-research-director',
}

const applicationIconValues: ApplicationIcon[] = [
  'notice',
  'shield',
  'approval',
  'energy',
  'message',
  'resource',
  'dashboard',
  'blackboard',
]

function toApplicationIcon(value: string): ApplicationIcon {
  return applicationIconValues.includes(value as ApplicationIcon) ? (value as ApplicationIcon) : 'dashboard'
}

function uniqueRoleCodes(roles: VisibleRole[]): RoleCode[] {
  return Array.from(new Set(roles.map((role) => roleCodeByLabel[role])))
}

function defaultCategoryName(categoryId: string): string {
  return defaultApplicationCategoryOptions.find((category) => category.id === categoryId)?.name ?? '管理工具'
}

export function mapApplicationRow(row: ApplicationRow): ManagedApplication {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.categoryId,
    category: row.categoryName,
    platform: platformLabelByCode[row.platform],
    url: row.url,
    packageId: row.packageId,
    icon: toApplicationIcon(row.icon),
    visibleRoleCodes: [...row.visibleRoleCodes],
    visibleRoles: row.visibleRoleCodes.map((roleCode) => roleLabelByCode[roleCode]),
    status: statusLabelByCode[row.status],
    sortOrder: row.sortOrder,
  }
}

export function applicationDraftToCreateInput(draft: ApplicationDraft): CreateApplicationInput {
  return {
    name: draft.name,
    categoryId: draft.categoryId,
    platform: platformCodeByLabel[draft.platform],
    url: draft.url,
    packageId: draft.packageId,
    icon: draft.icon,
    visibleRoleCodes: uniqueRoleCodes(draft.visibleRoles),
    status: statusCodeByLabel[draft.status],
  }
}

export function applicationDraftToUpdateInput(draft: ApplicationDraft): UpdateApplicationInput {
  return {
    name: draft.name,
    categoryId: draft.categoryId,
    platform: platformCodeByLabel[draft.platform],
    url: draft.url,
    packageId: draft.packageId,
    icon: draft.icon,
    visibleRoleCodes: uniqueRoleCodes(draft.visibleRoles),
    status: statusCodeByLabel[draft.status],
  }
}

export const seedApplications: ManagedApplication[] = [
  {
    id: 'app-notice',
    name: '校园通知发布系统',
    categoryId: 'management-tools',
    category: '管理工具',
    platform: '网页端',
    url: 'https://demo.school.local/notice',
    packageId: '',
    icon: 'notice',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 1,
  },
  {
    id: 'app-inspection',
    name: '移动巡检',
    categoryId: 'management-tools',
    category: '管理工具',
    platform: '移动端',
    url: '',
    packageId: 'com.school.inspection',
    icon: 'shield',
    visibleRoleCodes: ['electro-education-director'],
    visibleRoles: ['电教主任'],
    status: '已启用',
    sortOrder: 2,
  },
  {
    id: 'app-leave',
    name: '学生请假审批',
    categoryId: 'mobile-service',
    category: '移动服务',
    platform: '网页端',
    url: 'https://demo.school.local/leave',
    packageId: '',
    icon: 'approval',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 3,
  },
  {
    id: 'app-energy',
    name: '能耗管理平台',
    categoryId: 'data-dashboard',
    category: '数据看板',
    platform: '网页端',
    url: 'https://demo.school.local/energy',
    packageId: '',
    icon: 'energy',
    visibleRoleCodes: ['electro-education-director'],
    visibleRoles: ['电教主任'],
    status: '已停用',
    sortOrder: 4,
  },
  {
    id: 'app-family',
    name: '家校沟通助手',
    categoryId: 'mobile-service',
    category: '移动服务',
    platform: '移动端',
    url: '',
    packageId: 'com.school.family',
    icon: 'message',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 5,
  },
  {
    id: 'app-resource',
    name: '教研资源库',
    categoryId: 'teaching-tools',
    category: '教学工具',
    platform: '网页端',
    url: 'https://demo.school.local/resources',
    packageId: '',
    icon: 'resource',
    visibleRoleCodes: ['teaching-research-director'],
    visibleRoles: ['教研主任'],
    status: '已启用',
    sortOrder: 6,
  },
  {
    id: 'app-governance',
    name: '教育治理看板',
    categoryId: 'data-dashboard',
    category: '数据看板',
    platform: '网页端',
    url: 'https://demo.school.local/governance',
    packageId: '',
    icon: 'dashboard',
    visibleRoleCodes: [
      'all-staff',
      'electro-education-director',
      'moral-education-director',
      'teaching-research-director',
    ],
    visibleRoles: ['全员', '电教主任', '德育主任', '教研主任'],
    status: '已启用',
    sortOrder: 7,
  },
  {
    id: 'app-blackboard',
    name: '智慧黑板工具',
    categoryId: 'teaching-tools',
    category: '教学工具',
    platform: '移动端',
    url: '',
    packageId: 'com.school.blackboard',
    icon: 'blackboard',
    visibleRoleCodes: ['all-staff', 'teaching-research-director'],
    visibleRoles: ['全员', '教研主任'],
    status: '已停用',
    sortOrder: 8,
  },
]

export function createApplicationDraft(
  categoryId = 'management-tools',
  category = defaultCategoryName(categoryId),
): ApplicationDraft {
  return {
    name: '',
    categoryId,
    category,
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

export function isValidWebApplicationUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateApplicationDraft(draft: ApplicationDraft): string[] {
  const errors: string[] = []

  if (!draft.name.trim()) errors.push('应用名称不能为空')
  if (!draft.categoryId.trim()) errors.push('应用分类不能为空')
  if (draft.visibleRoles.length === 0) errors.push('至少选择一个可见角色')
  if (draft.platform === '网页端' && !draft.url.trim()) errors.push('网页端应用需要填写访问地址')
  if (draft.platform === '网页端' && draft.url.trim() && !isValidWebApplicationUrl(draft.url)) {
    errors.push('网页端应用访问地址必须以 http:// 或 https:// 开头')
  }
  if (draft.platform === '移动端' && !draft.packageId.trim()) errors.push('移动端应用需要填写包标识')

  return errors
}
