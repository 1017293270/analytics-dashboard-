import type { AlarmDetail, AlarmStatusActionInput, CreateAlarmDisposalRecordInput } from '@analytics/shared'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { alarmApi } from './alarmApi'

const alarmDetail: AlarmDetail = {
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

const alarmListPayload = {
  items: [alarmDetail],
  summary: { total: 8, unhandled: 4, processing: 2, resolved: 2 },
  filteredTotal: 1,
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, data, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('alarmApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('lists alarms with cookies, query params, and validated payload', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(alarmListPayload))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      alarmApi.listAlarms({
        keyword: '黑板',
        status: 'unhandled',
        triggerMethod: '设备离线',
        reportedFrom: '2026-07-09T00:00:00.000Z',
        reportedTo: '2026-07-09T23:59:59.000Z',
        deviceIdentifier: 'HB-3F-021',
      }),
    ).resolves.toEqual(alarmListPayload)

    const [url, init] = fetchMock.mock.calls[0]
    const params = new URL(String(url), 'http://localhost').searchParams
    expect(String(url)).toContain('/api/alarms?')
    expect(params.get('keyword')).toBe('黑板')
    expect(params.get('status')).toBe('unhandled')
    expect(params.get('triggerMethod')).toBe('设备离线')
    expect(params.get('reportedFrom')).toBe('2026-07-09T00:00:00.000Z')
    expect(params.get('reportedTo')).toBe('2026-07-09T23:59:59.000Z')
    expect(params.get('deviceIdentifier')).toBe('HB-3F-021')
    expect(init).toEqual(expect.objectContaining({ credentials: 'include' }))

    fetchMock.mockResolvedValueOnce(jsonResponse({ ...alarmListPayload, items: [{ ...alarmDetail, status: 'paused' }] }))

    await expect(alarmApi.listAlarms()).rejects.toThrow('Invalid alarm list response')
  })

  test('validates the API envelope and alarm detail payload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, error: null }), { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ ...alarmDetail, recording: { duration: '', url: null } }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(alarmApi.getAlarm('alarm-blackboard-021')).rejects.toThrow('Invalid API response')
    await expect(alarmApi.getAlarm('alarm-blackboard-021')).rejects.toThrow('Invalid alarm response')
  })

  test('rejects non-integer or negative alarm summary counts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ...alarmListPayload, summary: { ...alarmListPayload.summary, total: -1 } }))
      .mockResolvedValueOnce(jsonResponse({ ...alarmListPayload, filteredTotal: 1.5 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(alarmApi.listAlarms()).rejects.toThrow('Invalid alarm list response')
    await expect(alarmApi.listAlarms()).rejects.toThrow('Invalid alarm list response')
  })

  test('targets detail, status, disposal-record, and demo-reset routes with cookies', async () => {
    const statusInput: AlarmStatusActionInput = { action: 'processing', note: '正在远程确认现场情况' }
    const disposalInput: CreateAlarmDisposalRecordInput = { action: '现场排查', note: '已通知楼层负责人' }
    const updatedAlarm = {
      ...alarmDetail,
      status: 'processing',
      disposalRecords: [
        ...alarmDetail.disposalRecords,
        {
          id: 'record-processing',
          operatorName: '系统管理员',
          action: '标记为处理中',
          note: '正在远程确认现场情况',
          createdAt: '2026-07-09T10:32:00.000Z',
        },
      ],
    } satisfies AlarmDetail
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(alarmDetail))
      .mockResolvedValueOnce(jsonResponse(updatedAlarm))
      .mockResolvedValueOnce(jsonResponse(updatedAlarm))
      .mockResolvedValueOnce(jsonResponse(alarmListPayload))
    vi.stubGlobal('fetch', fetchMock)

    await expect(alarmApi.getAlarm('alarm-blackboard-021')).resolves.toEqual(alarmDetail)
    await expect(alarmApi.updateAlarmStatus('alarm-blackboard-021', statusInput)).resolves.toEqual(updatedAlarm)
    await expect(alarmApi.createDisposalRecord('alarm-blackboard-021', disposalInput)).resolves.toEqual(updatedAlarm)
    await expect(alarmApi.resetDemoAlarms()).resolves.toEqual(alarmListPayload)

    expect(fetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit | undefined)?.method])).toEqual([
      ['/api/alarms/alarm-blackboard-021', undefined],
      ['/api/alarms/alarm-blackboard-021/status', 'PATCH'],
      ['/api/alarms/alarm-blackboard-021/disposal-records', 'POST'],
      ['/api/alarms/demo-reset', 'POST'],
    ])
    expect(fetchMock.mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual(statusInput)
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual(disposalInput)
  })
})
