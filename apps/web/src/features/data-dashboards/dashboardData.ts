export type DashboardType = '治理分析' | '教师发展' | '学生成长' | '设备运维' | '告警态势' | '应用使用'
export type DashboardTypeFilter = DashboardType | '全部'
export type DashboardSource = '内置看板' | '第三方嵌入'
export type DashboardSourceFilter = DashboardSource | '全部'
export type DashboardStatus = '已启用' | '已停用'
export type DashboardStatusFilter = DashboardStatus | '全部'
export type DashboardRole = '全员' | '电教主任' | '德育主任' | '教研主任'
export type DashboardRoleFilter = DashboardRole | '全部'

export type DashboardMetric = {
  label: string
  value: string
  trend: string
}

export type ManagedDashboard = {
  id: string
  name: string
  type: DashboardType
  source: DashboardSource
  url: string
  isDefault: boolean
  visibleRoles: DashboardRole[]
  status: DashboardStatus
  updatedAt: string
  metrics: DashboardMetric[]
}

export type DashboardDraft = Omit<ManagedDashboard, 'id' | 'updatedAt' | 'metrics'>

export type DashboardFilters = {
  keyword: string
  type: DashboardTypeFilter
  visibleRole: DashboardRoleFilter
  status: DashboardStatusFilter
  source: DashboardSourceFilter
}

export const dashboardTypes: DashboardTypeFilter[] = [
  '全部',
  '治理分析',
  '教师发展',
  '学生成长',
  '设备运维',
  '告警态势',
  '应用使用',
]
export const dashboardSources: DashboardSourceFilter[] = ['全部', '内置看板', '第三方嵌入']
export const dashboardStatuses: DashboardStatusFilter[] = ['全部', '已启用', '已停用']
export const dashboardRoles: DashboardRole[] = ['全员', '电教主任', '德育主任', '教研主任']
export const dashboardRoleFilters: DashboardRoleFilter[] = ['全部', ...dashboardRoles]

export const defaultDashboardFilters: DashboardFilters = {
  keyword: '',
  type: '全部',
  visibleRole: '全部',
  status: '全部',
  source: '全部',
}

export const seedDashboards: ManagedDashboard[] = [
  {
    id: 'dashboard-governance',
    name: '教育治理',
    type: '治理分析',
    source: '内置看板',
    url: '',
    isDefault: true,
    visibleRoles: ['全员', '电教主任'],
    status: '已启用',
    updatedAt: '2026-07-03 10:10',
    metrics: [
      { label: '治理事项', value: '128', trend: '本周 +12' },
      { label: '完成率', value: '93.6%', trend: '较昨日 +2.1%' },
      { label: '校区覆盖', value: '4', trend: '全部在线' },
    ],
  },
  {
    id: 'dashboard-teacher',
    name: '教师发展',
    type: '教师发展',
    source: '内置看板',
    url: '',
    isDefault: true,
    visibleRoles: ['教研主任'],
    status: '已启用',
    updatedAt: '2026-07-03 09:42',
    metrics: [
      { label: '教研活动', value: '36', trend: '本月 +6' },
      { label: '培训完成', value: '88%', trend: '较上周 +5%' },
      { label: '资源共建', value: '214', trend: '活跃' },
    ],
  },
  {
    id: 'dashboard-student',
    name: '学生成长',
    type: '学生成长',
    source: '内置看板',
    url: '',
    isDefault: true,
    visibleRoles: ['德育主任'],
    status: '已启用',
    updatedAt: '2026-07-03 09:20',
    metrics: [
      { label: '成长档案', value: '1,286', trend: '全量同步' },
      { label: '德育活动', value: '42', trend: '本学期' },
      { label: '预警跟进', value: '18', trend: '待处理 3' },
    ],
  },
  {
    id: 'dashboard-device',
    name: '设备运维',
    type: '设备运维',
    source: '内置看板',
    url: '',
    isDefault: false,
    visibleRoles: ['电教主任'],
    status: '已启用',
    updatedAt: '2026-07-03 09:05',
    metrics: [
      { label: '在线设备', value: '642', trend: '在线率 98.6%' },
      { label: '巡检任务', value: '24', trend: '今日' },
      { label: '待维修', value: '7', trend: '高优先 1' },
    ],
  },
  {
    id: 'dashboard-alarm',
    name: '告警态势',
    type: '告警态势',
    source: '第三方嵌入',
    url: 'https://demo.school.local/alarm-bi',
    isDefault: false,
    visibleRoles: ['电教主任'],
    status: '已停用',
    updatedAt: '2026-07-03 08:58',
    metrics: [
      { label: '今日告警', value: '12', trend: '未处理 4' },
      { label: '平均响应', value: '6m', trend: '较昨日 -1m' },
      { label: '设备离线', value: '3', trend: '处理中' },
    ],
  },
  {
    id: 'dashboard-app-usage',
    name: '应用使用',
    type: '应用使用',
    source: '第三方嵌入',
    url: 'https://demo.school.local/app-usage',
    isDefault: false,
    visibleRoles: ['全员', '电教主任'],
    status: '已启用',
    updatedAt: '2026-07-03 08:45',
    metrics: [
      { label: '启用应用', value: '36', trend: '网页端 24' },
      { label: '今日访问', value: '2,418', trend: '高峰 10:00' },
      { label: '移动端', value: '12', trend: '稳定' },
    ],
  },
]

export function dashboardSummary(dashboards: ManagedDashboard[]) {
  return {
    total: dashboards.length,
    enabled: dashboards.filter((dashboard) => dashboard.status === '已启用').length,
    defaults: dashboards.filter((dashboard) => dashboard.isDefault).length,
    embedded: dashboards.filter((dashboard) => dashboard.source === '第三方嵌入').length,
  }
}

export function applyDashboardFilters(
  dashboards: ManagedDashboard[],
  filters: DashboardFilters,
): ManagedDashboard[] {
  const keyword = filters.keyword.trim().toLowerCase()

  return dashboards.filter((dashboard) => {
    const searchableText = [dashboard.name, dashboard.type, dashboard.source, dashboard.url].join(' ').toLowerCase()
    const matchesKeyword = keyword.length === 0 || searchableText.includes(keyword)
    const matchesType = filters.type === '全部' || dashboard.type === filters.type
    const matchesRole = filters.visibleRole === '全部' || dashboard.visibleRoles.includes(filters.visibleRole)
    const matchesStatus = filters.status === '全部' || dashboard.status === filters.status
    const matchesSource = filters.source === '全部' || dashboard.source === filters.source

    return matchesKeyword && matchesType && matchesRole && matchesStatus && matchesSource
  })
}

export function createDashboardDraft(source: DashboardSource = '内置看板'): DashboardDraft {
  return {
    name: '',
    type: source === '第三方嵌入' ? '告警态势' : '治理分析',
    source,
    url: '',
    isDefault: false,
    visibleRoles: source === '第三方嵌入' ? ['电教主任'] : ['全员'],
    status: '已启用',
  }
}

export function isValidDashboardEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateDashboardDraft(draft: DashboardDraft): string[] {
  const errors: string[] = []

  if (!draft.name.trim()) errors.push('看板名称不能为空')
  if (draft.visibleRoles.length === 0) errors.push('至少选择一个可见角色')
  if (draft.source === '第三方嵌入' && !draft.url.trim()) errors.push('第三方看板需要填写链接')
  if (draft.source === '第三方嵌入' && draft.url.trim() && !isValidDashboardEmbedUrl(draft.url)) {
    errors.push('第三方看板链接必须以 http:// 或 https:// 开头')
  }

  return errors
}
