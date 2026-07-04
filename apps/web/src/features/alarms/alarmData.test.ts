import { describe, expect, test } from 'vitest'
import type { AlarmDetail } from '@analytics/shared'
import {
  alarmSummary,
  applyAlarmFilters,
  buildAlarmListQuery,
  createDisposalRecord,
  getNextAlarmStatus,
  mapAlarmDetailToEvent,
  seedAlarms,
  toApiAlarmStatus,
  toUiAlarmStatus,
  type AlarmFilters,
} from './alarmData'

const apiAlarmDetail: AlarmDetail = {
  id: 'alarm-blackboard-021',
  deviceIdentifier: 'HB-3F-021',
  deviceName: '三楼智慧黑板',
  location: '教学楼 3 楼 302 教室',
  responsibleName: '周老师',
  responsiblePhone: '138 0000 1201',
  triggerMethod: '设备离线',
  eventType: '黑板心跳中断',
  status: 'unhandled',
  reportedAt: '2026-07-09T10:28:12.000Z',
  recording: { duration: '0:15', url: null },
  disposalRecords: [
    {
      id: 'record-blackboard-1',
      operatorName: '系统',
      action: '自动上报',
      note: '检测到设备连续 3 分钟未响应。',
      createdAt: '2026-07-09T10:28:12.000Z',
    },
  ],
  createdAt: '2026-07-04T05:30:00.000Z',
  updatedAt: '2026-07-04T05:30:00.000Z',
}

describe('alarmData', () => {
  test('summarizes alarm status counts from seed records', () => {
    expect(alarmSummary(seedAlarms)).toEqual({
      total: 8,
      unhandled: 4,
      processing: 2,
      resolved: 2,
    })
  })

  test('uses the July 9 presentation date for visible demo alarm timestamps', () => {
    expect(seedAlarms.every((alarm) => alarm.reportedAt.startsWith('2026-07-09'))).toBe(true)
    expect(
      seedAlarms.every((alarm) =>
        alarm.disposalRecords.every((record) => record.createdAt.startsWith('2026-07-09')),
      ),
    ).toBe(true)
  })

  test('filters alarms by keyword, status, trigger method, and date range', () => {
    const filters: AlarmFilters = {
      keyword: '101',
      status: '未处理',
      triggerMethod: 'AI识别',
      dateRange: ['2026-07-09 00:00:00', '2026-07-09 23:59:59'],
    }

    expect(applyAlarmFilters(seedAlarms, filters).map((alarm) => alarm.deviceIdentifier)).toEqual(['CAM-3-101-01'])
  })

  test('returns all alarms when filters are empty', () => {
    expect(
      applyAlarmFilters(seedAlarms, {
        keyword: '',
        status: '全部',
        triggerMethod: '全部',
        dateRange: [],
      }),
    ).toHaveLength(seedAlarms.length)
  })

  test('treats a cleared date range as no date filter', () => {
    const filters = {
      keyword: '',
      status: '全部',
      triggerMethod: '全部',
      dateRange: null,
    } as unknown as AlarmFilters

    expect(applyAlarmFilters(seedAlarms, filters)).toHaveLength(seedAlarms.length)
  })

  test('moves alarm status through valid demo transitions', () => {
    expect(getNextAlarmStatus('未处理', 'processing')).toBe('处理中')
    expect(getNextAlarmStatus('未处理', 'resolved')).toBe('已处理')
    expect(getNextAlarmStatus('处理中', 'resolved')).toBe('已处理')
    expect(getNextAlarmStatus('已处理', 'processing')).toBe('已处理')
  })

  test('creates deterministic disposal records for status actions', () => {
    expect(createDisposalRecord('系统管理员', '标记为处理中', '已接收告警，正在确认现场情况。')).toMatchObject({
      operatorName: '系统管理员',
      action: '标记为处理中',
      note: '已接收告警，正在确认现场情况。',
      createdAt: '2026-07-09 10:32:00',
    })
  })

  test('maps API alarm details to the Chinese UI model', () => {
    expect(toUiAlarmStatus('unhandled')).toBe('未处理')
    expect(toUiAlarmStatus('processing')).toBe('处理中')
    expect(toUiAlarmStatus('resolved')).toBe('已处理')
    expect(toApiAlarmStatus('未处理')).toBe('unhandled')

    expect(mapAlarmDetailToEvent(apiAlarmDetail)).toMatchObject({
      id: 'alarm-blackboard-021',
      deviceIdentifier: 'HB-3F-021',
      status: '未处理',
      reportedAt: '2026-07-09 10:28:12',
      recordingDuration: '0:15',
      disposalRecords: [
        {
          operatorName: '系统',
          action: '自动上报',
          createdAt: '2026-07-09 10:28:12',
        },
      ],
    })
  })

  test('builds backend alarm list query values from UI filters', () => {
    expect(
      buildAlarmListQuery({
        keyword: ' 黑板 ',
        status: '未处理',
        triggerMethod: '设备离线',
        dateRange: ['2026-07-09 00:00:00', '2026-07-09 23:59:59'],
      }),
    ).toEqual({
      keyword: '黑板',
      status: 'unhandled',
      triggerMethod: '设备离线',
      reportedFrom: '2026-07-09T00:00:00.000Z',
      reportedTo: '2026-07-09T23:59:59.000Z',
    })

    expect(buildAlarmListQuery({ keyword: '', status: '全部', triggerMethod: '全部', dateRange: [] })).toEqual({})
  })
})
