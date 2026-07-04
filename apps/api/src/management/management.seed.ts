import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../db.js'

type RoleCode =
  | 'system-admin'
  | 'all-staff'
  | 'electro-education-director'
  | 'moral-education-director'
  | 'teaching-research-director'

type SeedClient = Pick<
  PrismaClient,
  'applicationCategory' | 'managedApplication' | 'dataDashboard' | 'alarm'
> | Prisma.TransactionClient

type SeedApplication = {
  id: string
  name: string
  categoryId: string
  categoryName: string
  platform: 'web' | 'mobile'
  url: string
  packageId: string
  icon: string
  visibleRoleCodes: RoleCode[]
  status: 'enabled' | 'disabled' | 'uninstalled'
  sortOrder: number
}

type SeedDataDashboard = {
  id: string
  name: string
  type: string
  source: 'builtin' | 'embedded'
  embedUrl: string
  isDefault: boolean
  visibleRoleCodes: RoleCode[]
  status: 'enabled' | 'disabled'
  metrics: Array<{ label: string; value: string; trend: string }>
  sortOrder: number
}

type SeedAlarm = {
  id: string
  deviceIdentifier: string
  deviceName: string
  location: string
  responsibleName: string
  responsiblePhone: string
  triggerMethod: string
  eventType: string
  status: 'unhandled' | 'processing' | 'resolved'
  reportedAt: string
  recording: { duration: string; url: string | null }
  disposalRecords: Array<{
    id: string
    operatorName: string
    action: string
    note: string
    createdAt: string
  }>
}

export const seedApplicationCategories = [
  { id: 'teaching-tools', name: '教学工具', sortOrder: 1 },
  { id: 'management-tools', name: '管理工具', sortOrder: 2 },
  { id: 'data-dashboard', name: '数据看板', sortOrder: 3 },
  { id: 'mobile-service', name: '移动服务', sortOrder: 4 },
] as const

export const seedApplications: SeedApplication[] = [
  {
    id: 'app-notice',
    name: '校园通知发布系统',
    categoryId: 'management-tools',
    categoryName: '管理工具',
    platform: 'web',
    url: 'https://demo.school.local/notice',
    packageId: '',
    icon: 'notice',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    status: 'enabled',
    sortOrder: 1,
  },
  {
    id: 'app-inspection',
    name: '移动巡检',
    categoryId: 'management-tools',
    categoryName: '管理工具',
    platform: 'mobile',
    url: '',
    packageId: 'com.school.inspection',
    icon: 'shield',
    visibleRoleCodes: ['electro-education-director'],
    status: 'enabled',
    sortOrder: 2,
  },
  {
    id: 'app-leave',
    name: '学生请假审批',
    categoryId: 'mobile-service',
    categoryName: '移动服务',
    platform: 'web',
    url: 'https://demo.school.local/leave',
    packageId: '',
    icon: 'approval',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    status: 'enabled',
    sortOrder: 3,
  },
  {
    id: 'app-energy',
    name: '能耗管理平台',
    categoryId: 'data-dashboard',
    categoryName: '数据看板',
    platform: 'web',
    url: 'https://demo.school.local/energy',
    packageId: '',
    icon: 'energy',
    visibleRoleCodes: ['electro-education-director'],
    status: 'disabled',
    sortOrder: 4,
  },
  {
    id: 'app-family',
    name: '家校沟通助手',
    categoryId: 'mobile-service',
    categoryName: '移动服务',
    platform: 'mobile',
    url: '',
    packageId: 'com.school.family',
    icon: 'message',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    status: 'enabled',
    sortOrder: 5,
  },
  {
    id: 'app-resource',
    name: '教研资源库',
    categoryId: 'teaching-tools',
    categoryName: '教学工具',
    platform: 'web',
    url: 'https://demo.school.local/resources',
    packageId: '',
    icon: 'resource',
    visibleRoleCodes: ['teaching-research-director'],
    status: 'enabled',
    sortOrder: 6,
  },
  {
    id: 'app-governance',
    name: '教育治理看板',
    categoryId: 'data-dashboard',
    categoryName: '数据看板',
    platform: 'web',
    url: 'https://demo.school.local/governance',
    packageId: '',
    icon: 'dashboard',
    visibleRoleCodes: [
      'all-staff',
      'electro-education-director',
      'moral-education-director',
      'teaching-research-director',
    ],
    status: 'enabled',
    sortOrder: 7,
  },
  {
    id: 'app-blackboard',
    name: '智慧黑板工具',
    categoryId: 'teaching-tools',
    categoryName: '教学工具',
    platform: 'mobile',
    url: '',
    packageId: 'com.school.blackboard',
    icon: 'blackboard',
    visibleRoleCodes: ['all-staff', 'teaching-research-director'],
    status: 'disabled',
    sortOrder: 8,
  },
]

export const seedDataDashboards: SeedDataDashboard[] = [
  {
    id: 'dashboard-governance',
    name: '教育治理',
    type: '治理分析',
    source: 'builtin',
    embedUrl: '',
    isDefault: true,
    visibleRoleCodes: ['all-staff', 'electro-education-director'],
    status: 'enabled',
    sortOrder: 1,
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
    source: 'builtin',
    embedUrl: '',
    isDefault: true,
    visibleRoleCodes: ['teaching-research-director'],
    status: 'enabled',
    sortOrder: 2,
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
    source: 'builtin',
    embedUrl: '',
    isDefault: true,
    visibleRoleCodes: ['moral-education-director'],
    status: 'enabled',
    sortOrder: 3,
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
    source: 'builtin',
    embedUrl: '',
    isDefault: false,
    visibleRoleCodes: ['electro-education-director'],
    status: 'enabled',
    sortOrder: 4,
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
    source: 'embedded',
    embedUrl: 'https://demo.school.local/alarm-bi',
    isDefault: false,
    visibleRoleCodes: ['electro-education-director'],
    status: 'disabled',
    sortOrder: 5,
    metrics: [
      { label: '今日告警', value: '8', trend: '未处理 4' },
      { label: '平均响应', value: '6m', trend: '较昨日 -1m' },
      { label: '设备离线', value: '3', trend: '处理中' },
    ],
  },
  {
    id: 'dashboard-app-usage',
    name: '应用使用',
    type: '应用使用',
    source: 'embedded',
    embedUrl: 'https://demo.school.local/app-usage',
    isDefault: false,
    visibleRoleCodes: ['all-staff', 'electro-education-director'],
    status: 'enabled',
    sortOrder: 6,
    metrics: [
      { label: '启用应用', value: '6', trend: '网页端 5' },
      { label: '今日访问', value: '2,418', trend: '高峰 10:00' },
      { label: '移动端', value: '3', trend: '演示接入' },
    ],
  },
]

export const seedAlarms: SeedAlarm[] = [
  {
    id: 'alarm-blackboard-021',
    deviceIdentifier: 'HB-3F-021',
    deviceName: '三楼智慧黑板',
    location: '教学楼 3 楼 302 教室',
    responsibleName: '周老师',
    responsiblePhone: '138 0000 1201',
    triggerMethod: '设备离线',
    eventType: '黑板心跳中断',
    status: 'unhandled',
    reportedAt: '2026-07-09 10:28:12',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-blackboard-1',
        operatorName: '系统',
        action: '自动上报',
        note: '检测到设备连续 3 分钟未响应。',
        createdAt: '2026-07-09 10:28:12',
      },
    ],
  },
  {
    id: 'alarm-camera-101',
    deviceIdentifier: 'CAM-3-101-01',
    deviceName: '教室 1-101 摄像头',
    location: '教学楼 1 栋 101 教室',
    responsibleName: '李老师',
    responsiblePhone: '138 0000 1122',
    triggerMethod: 'AI识别',
    eventType: '人员摔倒',
    status: 'unhandled',
    reportedAt: '2026-07-09 10:21:35',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-camera-1',
        operatorName: '李老师',
        action: '收到告警',
        note: '正在确认现场情况。',
        createdAt: '2026-07-09 10:22:02',
      },
    ],
  },
  {
    id: 'alarm-dvr-201',
    deviceIdentifier: 'DVR-1-201-01',
    deviceName: '教学楼 1 栋 NVR',
    location: '弱电间',
    responsibleName: '王工',
    responsiblePhone: '138 0000 1188',
    triggerMethod: '设备离线',
    eventType: '录像服务异常',
    status: 'processing',
    reportedAt: '2026-07-09 10:18:12',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-dvr-1',
        operatorName: '王工',
        action: '远程排查',
        note: '已登录设备管理端，正在检查存储状态。',
        createdAt: '2026-07-09 10:20:18',
      },
    ],
  },
  {
    id: 'alarm-env-301',
    deviceIdentifier: 'ENV-2-301-02',
    deviceName: '3 楼温湿度传感器',
    location: '教学楼 2 栋 301 教室',
    responsibleName: '张老师',
    responsiblePhone: '138 0000 1311',
    triggerMethod: '阈值告警',
    eventType: '温度超阈值',
    status: 'unhandled',
    reportedAt: '2026-07-09 10:14:09',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-env-1',
        operatorName: '系统',
        action: '自动上报',
        note: '室内温度高于预警阈值。',
        createdAt: '2026-07-09 10:14:09',
      },
    ],
  },
  {
    id: 'alarm-access-001',
    deviceIdentifier: 'ACC-1-001-01',
    deviceName: '南门门禁控制器',
    location: '南门出入口',
    responsibleName: '赵老师',
    responsiblePhone: '138 0000 1518',
    triggerMethod: '刷卡失败',
    eventType: '门禁认证失败',
    status: 'resolved',
    reportedAt: '2026-07-09 09:58:03',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-access-1',
        operatorName: '赵老师',
        action: '核验身份',
        note: '已核实为临时访客证件过期。',
        createdAt: '2026-07-09 10:01:33',
      },
      {
        id: 'record-access-2',
        operatorName: '赵老师',
        action: '标记为已处理',
        note: '已重新登记访客信息。',
        createdAt: '2026-07-09 10:08:46',
      },
    ],
  },
  {
    id: 'alarm-speaker-401',
    deviceIdentifier: 'SPK-2-401-01',
    deviceName: '教学楼 2 栋广播',
    location: '教学楼 2 栋 4 楼走廊',
    responsibleName: '陈老师',
    responsiblePhone: '138 0000 1602',
    triggerMethod: '手动上报',
    eventType: '广播无声',
    status: 'processing',
    reportedAt: '2026-07-09 09:45:22',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-speaker-1',
        operatorName: '陈老师',
        action: '现场排查',
        note: '已安排电教人员前往楼层检查线路。',
        createdAt: '2026-07-09 09:50:16',
      },
    ],
  },
  {
    id: 'alarm-ipc-202',
    deviceIdentifier: 'IPC-3-202-02',
    deviceName: '操场球机',
    location: '操场看台',
    responsibleName: '刘老师',
    responsiblePhone: '138 0000 1707',
    triggerMethod: '移动侦测',
    eventType: '异常进入',
    status: 'unhandled',
    reportedAt: '2026-07-09 09:31:47',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-ipc-1',
        operatorName: '系统',
        action: '自动上报',
        note: '检测到非开放时段进入操场区域。',
        createdAt: '2026-07-09 09:31:47',
      },
    ],
  },
  {
    id: 'alarm-ups-001',
    deviceIdentifier: 'UPS-1-001-01',
    deviceName: '机房 UPS',
    location: '信息中心机房',
    responsibleName: '王工',
    responsiblePhone: '138 0000 1188',
    triggerMethod: '市电异常',
    eventType: '电源切换',
    status: 'resolved',
    reportedAt: '2026-07-09 08:55:33',
    recording: { duration: '0:15', url: null },
    disposalRecords: [
      {
        id: 'record-ups-1',
        operatorName: '王工',
        action: '电源恢复',
        note: '已确认市电恢复，UPS 状态正常。',
        createdAt: '2026-07-09 09:08:00',
      },
    ],
  },
]

function parseDemoDate(value: string) {
  return new Date(`${value.replace(' ', 'T')}.000Z`)
}

async function resetApplications(client: SeedClient) {
  await client.managedApplication.deleteMany()
  await client.applicationCategory.deleteMany()

  for (const category of seedApplicationCategories) {
    await client.applicationCategory.create({ data: category })
  }

  for (const application of seedApplications) {
    await client.managedApplication.create({
      data: {
        ...application,
        visibleRoleCodes: JSON.stringify(application.visibleRoleCodes),
      },
    })
  }
}

async function resetDataDashboards(client: SeedClient) {
  await client.dataDashboard.deleteMany()

  for (const dashboard of seedDataDashboards) {
    await client.dataDashboard.create({
      data: {
        ...dashboard,
        visibleRoleCodes: JSON.stringify(dashboard.visibleRoleCodes),
        metrics: JSON.stringify(dashboard.metrics),
      },
    })
  }
}

async function resetAlarms(client: SeedClient) {
  await client.alarm.deleteMany()

  for (const alarm of seedAlarms) {
    await client.alarm.create({
      data: {
        ...alarm,
        reportedAt: parseDemoDate(alarm.reportedAt),
        recording: JSON.stringify(alarm.recording),
        disposalRecords: JSON.stringify(
          alarm.disposalRecords.map((record) => ({
            ...record,
            createdAt: parseDemoDate(record.createdAt).toISOString(),
          })),
        ),
      },
    })
  }
}

export async function ensureDemoManagementSeed() {
  const [categoryCount, applicationCount, dashboardCount, alarmCount] = await Promise.all([
    prisma.applicationCategory.count(),
    prisma.managedApplication.count(),
    prisma.dataDashboard.count(),
    prisma.alarm.count(),
  ])

  if (categoryCount > 0 && applicationCount > 0 && dashboardCount > 0 && alarmCount > 0) {
    return
  }

  await resetDemoManagementSeed()
}

export async function resetDemoApplicationsSeed() {
  await prisma.$transaction(async (tx) => {
    await resetApplications(tx)
  })
}

export async function resetDemoDataDashboardsSeed() {
  await prisma.$transaction(async (tx) => {
    await resetDataDashboards(tx)
  })
}

export async function resetDemoAlarmsSeed() {
  await prisma.$transaction(async (tx) => {
    await resetAlarms(tx)
  })
}

export async function resetDemoManagementSeed() {
  await prisma.$transaction(async (tx) => {
    await resetApplications(tx)
    await resetDataDashboards(tx)
    await resetAlarms(tx)
  })
}
