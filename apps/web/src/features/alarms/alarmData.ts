import type {
  AlarmDetail as ApiAlarmDetail,
  AlarmListQuery,
  AlarmStatus as ApiAlarmStatus,
} from '@analytics/shared'

export type AlarmStatus = '未处理' | '处理中' | '已处理'
export type AlarmStatusFilter = AlarmStatus | '全部'
export type TriggerMethodFilter = '全部' | 'AI识别' | '设备离线' | '阈值告警' | '刷卡失败' | '手动上报' | '移动侦测' | '市电异常'
export type AlarmAction = 'processing' | 'resolved'

export type DisposalRecord = {
  id: string
  operatorName: string
  action: string
  note: string
  createdAt: string
}

export type AlarmEvent = {
  id: string
  deviceIdentifier: string
  deviceName: string
  location: string
  responsibleName: string
  responsiblePhone: string
  triggerMethod: Exclude<TriggerMethodFilter, '全部'>
  eventType: string
  status: AlarmStatus
  reportedAt: string
  recordingDuration: string
  disposalRecords: DisposalRecord[]
}

export type AlarmFilters = {
  keyword: string
  status: AlarmStatusFilter
  triggerMethod: TriggerMethodFilter
  dateRange: string[] | null
}

export const defaultAlarmFilters: AlarmFilters = {
  keyword: '',
  status: '全部',
  triggerMethod: '全部',
  dateRange: [],
}

export const alarmStatusOptions: AlarmStatusFilter[] = ['全部', '未处理', '处理中', '已处理']
export const triggerMethodOptions: TriggerMethodFilter[] = [
  '全部',
  'AI识别',
  '设备离线',
  '阈值告警',
  '刷卡失败',
  '手动上报',
  '移动侦测',
  '市电异常',
]

const uiStatusByApiStatus: Record<ApiAlarmStatus, AlarmStatus> = {
  unhandled: '未处理',
  processing: '处理中',
  resolved: '已处理',
}

const apiStatusByUiStatus: Record<AlarmStatus, ApiAlarmStatus> = {
  未处理: 'unhandled',
  处理中: 'processing',
  已处理: 'resolved',
}

export function toUiAlarmStatus(status: ApiAlarmStatus): AlarmStatus {
  return uiStatusByApiStatus[status]
}

export function toApiAlarmStatus(status: AlarmStatus): ApiAlarmStatus {
  return apiStatusByUiStatus[status]
}

function formatApiDateTime(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/)
  if (match) return `${match[1]} ${match[2]}`

  return value.replace('T', ' ').replace(/\.\d{3}Z$/, '').replace(/Z$/, '')
}

function toApiDateTime(value: string) {
  const trimmed = value.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.includes('T')) return trimmed

  const normalized = trimmed.replace(' ', 'T')
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized) ? `${normalized}:00` : normalized
  return `${withSeconds.replace(/\.\d+$/, '')}.000Z`
}

export function mapAlarmDetailToEvent(alarm: ApiAlarmDetail): AlarmEvent {
  return {
    id: alarm.id,
    deviceIdentifier: alarm.deviceIdentifier,
    deviceName: alarm.deviceName,
    location: alarm.location,
    responsibleName: alarm.responsibleName,
    responsiblePhone: alarm.responsiblePhone,
    triggerMethod: alarm.triggerMethod as Exclude<TriggerMethodFilter, '全部'>,
    eventType: alarm.eventType,
    status: toUiAlarmStatus(alarm.status),
    reportedAt: formatApiDateTime(alarm.reportedAt),
    recordingDuration: alarm.recording.duration,
    disposalRecords: alarm.disposalRecords.map((record) => ({
      ...record,
      createdAt: formatApiDateTime(record.createdAt),
    })),
  }
}

export function buildAlarmListQuery(filters: AlarmFilters): Partial<AlarmListQuery> {
  const query: Partial<AlarmListQuery> = {}
  const keyword = filters.keyword.trim()
  const [reportedFrom, reportedTo] = Array.isArray(filters.dateRange) ? filters.dateRange : []

  if (keyword.length > 0) query.keyword = keyword
  if (filters.status !== '全部') query.status = toApiAlarmStatus(filters.status)
  if (filters.triggerMethod !== '全部') query.triggerMethod = filters.triggerMethod
  if (reportedFrom) query.reportedFrom = toApiDateTime(reportedFrom)
  if (reportedTo) query.reportedTo = toApiDateTime(reportedTo)

  return query
}

export const seedAlarms: AlarmEvent[] = [
  {
    id: 'alarm-blackboard-021',
    deviceIdentifier: 'HB-3F-021',
    deviceName: '三楼智慧黑板',
    location: '教学楼 3 楼 302 教室',
    responsibleName: '周老师',
    responsiblePhone: '138 0000 1201',
    triggerMethod: '设备离线',
    eventType: '黑板心跳中断',
    status: '未处理',
    reportedAt: '2026-07-09 10:28:12',
    recordingDuration: '0:15',
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
    status: '未处理',
    reportedAt: '2026-07-09 10:21:35',
    recordingDuration: '0:15',
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
    status: '处理中',
    reportedAt: '2026-07-09 10:18:12',
    recordingDuration: '0:15',
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
    status: '未处理',
    reportedAt: '2026-07-09 10:14:09',
    recordingDuration: '0:15',
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
    status: '已处理',
    reportedAt: '2026-07-09 09:58:03',
    recordingDuration: '0:15',
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
    status: '处理中',
    reportedAt: '2026-07-09 09:45:22',
    recordingDuration: '0:15',
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
    status: '未处理',
    reportedAt: '2026-07-09 09:31:47',
    recordingDuration: '0:15',
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
    status: '已处理',
    reportedAt: '2026-07-09 08:55:33',
    recordingDuration: '0:15',
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

export function alarmSummary(alarms: AlarmEvent[]) {
  return {
    total: alarms.length,
    unhandled: alarms.filter((alarm) => alarm.status === '未处理').length,
    processing: alarms.filter((alarm) => alarm.status === '处理中').length,
    resolved: alarms.filter((alarm) => alarm.status === '已处理').length,
  }
}

export function applyAlarmFilters(alarms: AlarmEvent[], filters: AlarmFilters): AlarmEvent[] {
  const keyword = filters.keyword.trim().toLowerCase()
  const [start, end] = Array.isArray(filters.dateRange) ? filters.dateRange : []

  return alarms.filter((alarm) => {
    const matchesKeyword =
      keyword.length === 0 ||
      [alarm.deviceIdentifier, alarm.deviceName, alarm.location, alarm.responsibleName].some((value) =>
        value.toLowerCase().includes(keyword),
      )
    const matchesStatus = filters.status === '全部' || alarm.status === filters.status
    const matchesTrigger = filters.triggerMethod === '全部' || alarm.triggerMethod === filters.triggerMethod
    const matchesStart = !start || alarm.reportedAt >= start
    const matchesEnd = !end || alarm.reportedAt <= end

    return matchesKeyword && matchesStatus && matchesTrigger && matchesStart && matchesEnd
  })
}

export function getNextAlarmStatus(currentStatus: AlarmStatus, action: AlarmAction): AlarmStatus {
  if (currentStatus === '已处理') return '已处理'
  if (action === 'resolved') return '已处理'
  if (currentStatus === '未处理' && action === 'processing') return '处理中'

  return currentStatus
}

export function createDisposalRecord(operatorName: string, action: string, note: string): DisposalRecord {
  return {
    id: `record-${Date.now()}`,
    operatorName,
    action,
    note,
    createdAt: '2026-07-09 10:32:00',
  }
}
