export type OverviewStatus = 'success' | 'warning' | 'danger' | 'primary' | 'info'

export type AlarmQueueStatus = '未处理' | '处理中' | '已处理'

export const overviewKpis = [
  {
    label: '设备在线率',
    value: 98.6,
    precision: 1,
    suffix: '%',
    trend: '较昨日 +1.2%',
    status: 'success',
    secondaryLabel: '在线设备',
    secondaryValue: '642 / 651',
  },
  {
    label: '未处理告警',
    value: 1,
    precision: 0,
    suffix: '',
    trend: '高优先级 1 条',
    status: 'danger',
    secondaryLabel: '今日上报',
    secondaryValue: '12 条',
  },
  {
    label: '已发布工作台',
    value: 9,
    precision: 0,
    suffix: '',
    trend: '覆盖 5 类角色',
    status: 'primary',
    secondaryLabel: '启用中',
    secondaryValue: '8 个',
  },
  {
    label: '启用应用',
    value: 36,
    precision: 0,
    suffix: '',
    trend: '网页端 24 / 移动端 12',
    status: 'success',
    secondaryLabel: '本周新增',
    secondaryValue: '4 个',
  },
] as const

export const priorityAlarms = [
  {
    severity: '高',
    deviceId: 'HB-3F-021',
    deviceName: '智慧黑板 302',
    location: '三楼 302 教室',
    owner: '王老师',
    trigger: '离线超过 5 分钟',
    status: '未处理',
    reportedAt: '09:42',
  },
  {
    severity: '中',
    deviceId: 'IPANEL-104',
    deviceName: '交互智能平板',
    location: '一楼 录播教室',
    owner: '李老师',
    trigger: '远程共享失败',
    status: '处理中',
    reportedAt: '09:18',
  },
  {
    severity: '低',
    deviceId: 'GATEWAY-07',
    deviceName: '班班通网关',
    location: '信息中心',
    owner: '赵老师',
    trigger: '心跳延迟',
    status: '已处理',
    reportedAt: '08:56',
  },
] as const satisfies ReadonlyArray<{
  severity: '高' | '中' | '低'
  deviceId: string
  deviceName: string
  location: string
  owner: string
  trigger: string
  status: AlarmQueueStatus
  reportedAt: string
}>

export const systemHealth = [
  { name: '设备连接服务', status: 'success', detail: '651 台设备接入', metric: '99.99%' },
  { name: '远程白板共享', status: 'success', detail: '12 个课堂可用', metric: '42ms' },
  { name: '应用中心', status: 'success', detail: '36 个应用启用', metric: '正常' },
  { name: '数据看板服务', status: 'warning', detail: '1 个第三方看板延迟', metric: '2.4s' },
  { name: '账号权限服务', status: 'success', detail: '5 类角色策略生效', metric: '正常' },
] as const satisfies ReadonlyArray<{
  name: string
  status: OverviewStatus
  detail: string
  metric: string
}>

export const demoLaunchItems = [
  { label: '工作台配置', description: '拖拽配置角色工作台', path: '/workbenches', status: '可演示' },
  { label: '数据看板', description: '教育治理与学生成长', path: '/data-dashboards', status: '可演示' },
  { label: '应用中心', description: '网页端与移动端应用', path: '/applications', status: '可演示' },
  { label: '告警管理', description: '设备事件筛选与处置', path: '/alarms', status: '可演示' },
  { label: '智慧黑板', description: '课堂活动智能生成', path: '/blackboard', status: '待开发' },
  { label: '互动教学', description: '远程白板与答题器', path: '/teaching', status: '待开发' },
] as const

export const dashboardCoverage = [
  { name: '教育治理', owner: '校长室', status: '已配置', updatedAt: '09:10' },
  { name: '教师发展', owner: '教研主任', status: '已配置', updatedAt: '08:44' },
  { name: '学生成长', owner: '德育主任', status: '已配置', updatedAt: '08:12' },
  { name: '设备运维', owner: '电教主任', status: '草稿', updatedAt: '昨天' },
  { name: '告警态势', owner: '信息中心', status: '草稿', updatedAt: '昨天' },
  { name: '应用使用', owner: '信息中心', status: '待接入', updatedAt: '未同步' },
] as const

export const roleWorkbenches = [
  { name: '全员工作台', role: '全员', status: '已启用', visibleTo: '全员', updatedAt: '09:18' },
  { name: '电教主任工作台', role: '电教主任', status: '已启用', visibleTo: '电教主任', updatedAt: '08:42' },
  { name: '德育主任工作台', role: '德育主任', status: '已启用', visibleTo: '德育主任', updatedAt: '08:30' },
  { name: '教研主任工作台', role: '教研主任', status: '草稿', visibleTo: '教研主任', updatedAt: '昨天' },
] as const

export const demoReadiness = [
  { label: '账号体系', status: '已完成', detail: '管理员与角色账号可登录' },
  { label: '管理 Shell', status: '已完成', detail: '侧边栏、顶部栏、角色菜单已接入' },
  { label: '工作台配置', status: '可演示', detail: '复用大屏拖拽编辑器' },
  { label: '数据看板', status: '可演示', detail: '六类看板和第三方嵌入已接入' },
  { label: '告警与应用', status: '可演示', detail: '列表、筛选、详情和应用管理已接入' },
] as const
