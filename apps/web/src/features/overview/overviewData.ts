export const overviewKpis = [
  { label: '设备在线率', value: 98.6, precision: 1, suffix: '%', trend: '较昨日 +1.2%', status: 'success' },
  { label: '今日告警', value: 12, precision: 0, suffix: '', trend: '3 条待处理', status: 'warning' },
  { label: '工作台发布', value: 9, precision: 0, suffix: '', trend: '4 个角色可见', status: 'primary' },
  { label: '应用启用', value: 36, precision: 0, suffix: '', trend: '网页端 24 / 移动端 12', status: 'success' },
] as const

export const overviewAlarms = [
  { device: 'HB-3F-021', location: '三楼 302 教室', status: '待处理', owner: '王老师' },
  { device: 'IPANEL-104', location: '一楼 录播教室', status: '处理中', owner: '李老师' },
  { device: 'GATEWAY-07', location: '信息中心', status: '已解决', owner: '赵老师' },
] as const

export const overviewWorkbenches = [
  { name: '全员工作台', role: '全员', status: '已启用', update: '09:18' },
  { name: '电教主任工作台', role: '电教主任', status: '已启用', update: '08:42' },
  { name: '教研主任工作台', role: '教研主任', status: '草稿', update: '昨天' },
] as const
