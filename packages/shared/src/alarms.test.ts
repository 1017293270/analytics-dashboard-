import { describe, expect, test } from 'vitest'
import {
  alarmDetailValidator,
  alarmListQueryValidator,
  alarmStatusActionInputValidator,
  createAlarmDisposalRecordInputValidator,
} from './alarms.js'
import * as sharedIndex from './index.js'

describe('alarm shared contract', () => {
  test('alarm detail validator accepts recording and disposal records', () => {
    expect(
      alarmDetailValidator.parse({
        id: 'alarm-camera-101',
        deviceIdentifier: 'CAM-3-101-01',
        deviceName: '教室 1-101 摄像头',
        location: '教学楼 1 栋 101 教室',
        responsibleName: '李老师',
        responsiblePhone: '138 0000 1122',
        triggerMethod: 'AI识别',
        eventType: '人员摔倒',
        status: 'unhandled',
        reportedAt: '2026-07-09T10:21:35.000Z',
        recording: { duration: '0:15', url: null },
        disposalRecords: [
          {
            id: 'record-camera-1',
            operatorName: '李老师',
            action: '收到告警',
            note: '正在确认现场情况。',
            createdAt: '2026-07-09T10:22:02.000Z',
          },
        ],
        createdAt: '2026-07-04T05:30:00.000Z',
        updatedAt: '2026-07-04T05:30:00.000Z',
      }),
    ).toMatchObject({
      id: 'alarm-camera-101',
      status: 'unhandled',
      recording: { duration: '0:15', url: null },
    })
  })

  test('alarm status action validator only accepts processing and resolved actions', () => {
    expect(alarmStatusActionInputValidator.parse({ action: 'processing', note: '正在远程排查' })).toEqual({
      action: 'processing',
      note: '正在远程排查',
    })
    expect(alarmStatusActionInputValidator.parse({ action: 'resolved' })).toEqual({ action: 'resolved' })
    expect(alarmStatusActionInputValidator.safeParse({ action: 'unhandled' }).success).toBe(false)
  })

  test('alarm disposal record and list query validators accept management filters', () => {
    expect(createAlarmDisposalRecordInputValidator.parse({ action: '现场排查', note: '已安排人员到场' })).toEqual({
      action: '现场排查',
      note: '已安排人员到场',
    })

    expect(
      alarmListQueryValidator.parse({
        keyword: '摄像头',
        status: 'unhandled',
        triggerMethod: 'AI识别',
        reportedFrom: '2026-07-09T00:00:00.000Z',
        reportedTo: '2026-07-09T23:59:59.000Z',
        deviceIdentifier: 'CAM-3-101-01',
      }),
    ).toMatchObject({ keyword: '摄像头', status: 'unhandled' })
  })

  test('index exports alarm validators', () => {
    expect(sharedIndex.alarmDetailValidator).toBe(alarmDetailValidator)
    expect(sharedIndex.alarmStatusActionInputValidator).toBe(alarmStatusActionInputValidator)
    expect(sharedIndex.createAlarmDisposalRecordInputValidator).toBe(createAlarmDisposalRecordInputValidator)
  })
})
