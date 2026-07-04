import { describe, expect, test } from 'vitest'
import {
  alarmSummary,
  applyAlarmFilters,
  createDisposalRecord,
  getNextAlarmStatus,
  seedAlarms,
  type AlarmFilters,
} from './alarmData'

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
})
