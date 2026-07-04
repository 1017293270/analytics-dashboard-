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
    value: 4,
    precision: 0,
    suffix: '',
    trend: '高优先级 1 条',
    status: 'danger',
    secondaryLabel: '今日上报',
    secondaryValue: '8 条',
  },
  {
    label: '角色工作台',
    value: 4,
    precision: 0,
    suffix: '',
    trend: '覆盖 4 类角色',
    status: 'primary',
    secondaryLabel: '已启用',
    secondaryValue: '4 个',
  },
  {
    label: '演示应用',
    value: 8,
    precision: 0,
    suffix: '',
    trend: '网页端 5 / 移动端 3',
    status: 'success',
    secondaryLabel: '已启用',
    secondaryValue: '6 个',
  },
] as const

export const priorityAlarms = [
  {
    severity: '高',
    deviceId: 'HB-3F-021',
    deviceName: '三楼智慧黑板',
    location: '教学楼 3 楼 302 教室',
    owner: '周老师',
    trigger: '黑板心跳中断',
    status: '未处理',
    reportedAt: '10:28',
  },
  {
    severity: '中',
    deviceId: 'DVR-1-201-01',
    deviceName: '教学楼 1 栋 NVR',
    location: '弱电间',
    owner: '王工',
    trigger: '录像服务异常',
    status: '处理中',
    reportedAt: '10:18',
  },
  {
    severity: '低',
    deviceId: 'ACC-1-001-01',
    deviceName: '南门门禁控制器',
    location: '南门出入口',
    owner: '赵老师',
    trigger: '门禁认证失败',
    status: '已处理',
    reportedAt: '09:58',
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
  { name: '互动教学演示', status: 'success', detail: '模拟课堂控制台可用', metric: '可演示' },
  { name: '应用中心', status: 'success', detail: '8 个演示应用接入', metric: '正常' },
  { name: '数据看板服务', status: 'success', detail: '2 个第三方嵌入看板接入', metric: '可演示' },
  { name: '角色可见性演示', status: 'success', detail: '菜单与工作台可见范围可演示', metric: '可演示' },
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
  { label: '账号与角色', description: '账号、角色与菜单范围', path: '/accounts', status: '可演示' },
  { label: '告警管理', description: '设备事件筛选与处置', path: '/alarms', status: '可演示' },
  { label: '智慧黑板', description: '课堂活动智能生成', path: '/blackboard', status: '可演示' },
  { label: '互动教学', description: '远程白板与答题器', path: '/teaching', status: '可演示' },
] as const

export const dashboardCoverage = [
  { name: '教育治理', owner: '校长室', status: '已配置', updatedAt: '09:10' },
  { name: '教师发展', owner: '教研主任', status: '已配置', updatedAt: '08:44' },
  { name: '学生成长', owner: '德育主任', status: '已配置', updatedAt: '08:12' },
  { name: '设备运维', owner: '电教主任', status: '已配置', updatedAt: '09:05' },
  { name: '告警态势', owner: '信息中心', status: '已配置', updatedAt: '08:58' },
  { name: '应用使用', owner: '信息中心', status: '已配置', updatedAt: '08:45' },
] as const

export const roleWorkbenches = [
  { name: '全员工作台', role: '全员', status: '已启用', visibleTo: '全员', updatedAt: '09:18' },
  { name: '电教主任工作台', role: '电教主任', status: '已启用', visibleTo: '电教主任', updatedAt: '08:42' },
  { name: '德育主任工作台', role: '德育主任', status: '已启用', visibleTo: '德育主任', updatedAt: '08:30' },
  { name: '教研主任工作台', role: '教研主任', status: '已启用', visibleTo: '教研主任', updatedAt: '08:20' },
] as const

export const demoReadiness = [
  { label: '账号体系', status: '已完成', detail: '管理员与角色账号可登录' },
  { label: '管理 Shell', status: '已完成', detail: '侧边栏、顶部栏、角色菜单已接入' },
  { label: '工作台配置', status: '可演示', detail: '30+ 组件、角色可见和启停管理已接入' },
  { label: '数据看板', status: '可演示', detail: '六类看板和第三方嵌入已接入' },
  { label: '告警与应用', status: '可演示', detail: '列表、筛选、详情和应用管理已接入' },
  { label: '互动教学', status: '可演示', detail: '角色切换、共享、截屏、答题器、布局控制已接入' },
] as const
