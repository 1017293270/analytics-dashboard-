import { flushPromises, mount } from '@vue/test-utils'
import type { AlarmDetail } from '@analytics/shared'
import ElementPlus from 'element-plus'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AlarmManagementView from './AlarmManagementView.vue'

const alarmApiMock = vi.hoisted(() => ({
  listAlarms: vi.fn(),
  getAlarm: vi.fn(),
  updateAlarmStatus: vi.fn(),
  createDisposalRecord: vi.fn(),
  resetDemoAlarms: vi.fn(),
}))

vi.mock('./alarmApi', () => ({ alarmApi: alarmApiMock }))

const blackboardAlarm: AlarmDetail = {
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

const cameraAlarm: AlarmDetail = {
  ...blackboardAlarm,
  id: 'alarm-camera-101',
  deviceIdentifier: 'CAM-3-101-01',
  deviceName: '教室 1-101 摄像头',
  location: '教学楼 1 栋 101 教室',
  responsibleName: '李老师',
  responsiblePhone: '138 0000 1122',
  triggerMethod: 'AI识别',
  eventType: '人员摔倒',
  disposalRecords: [
    {
      id: 'record-camera-1',
      operatorName: '李老师',
      action: '收到告警',
      note: '正在确认现场情况。',
      createdAt: '2026-07-09T10:22:02.000Z',
    },
  ],
}

const upsAlarm: AlarmDetail = {
  ...blackboardAlarm,
  id: 'alarm-ups-001',
  deviceIdentifier: 'UPS-1-001-01',
  deviceName: '机房 UPS',
  location: '信息中心机房',
  responsibleName: '王工',
  responsiblePhone: '138 0000 1188',
  triggerMethod: '市电异常',
  eventType: '电源切换',
  status: 'resolved',
}

const demoSummary = { total: 8, unhandled: 4, processing: 2, resolved: 2 }

function listPayload(items: AlarmDetail[]) {
  return {
    items,
    summary: demoSummary,
    filteredTotal: items.length,
  }
}

function withProcessingRecord(alarm: AlarmDetail): AlarmDetail {
  return {
    ...alarm,
    status: 'processing',
    disposalRecords: [
      ...alarm.disposalRecords,
      {
        id: 'record-processing',
        operatorName: '系统管理员',
        action: '标记为处理中',
        note: '已接收告警，正在确认现场情况。',
        createdAt: '2026-07-09T10:32:00.000Z',
      },
    ],
  }
}

function withFalsePositiveRecord(alarm: AlarmDetail): AlarmDetail {
  return {
    ...alarm,
    disposalRecords: [
      ...alarm.disposalRecords,
      {
        id: 'record-false-positive',
        operatorName: '系统管理员',
        action: '误报反馈',
        note: '已记录误报反馈，待复核告警规则。',
        createdAt: '2026-07-09T10:33:00.000Z',
      },
    ],
  }
}

const elementStubs = {
  ElDatePicker: {
    props: ['modelValue'],
    template: '<div class="el-date-editor"><input placeholder="开始时间" /><input placeholder="结束时间" /></div>',
  },
  ElSelect: {
    props: ['modelValue'],
    template: '<select><slot /></select>',
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

async function mountAlarmView(route = '/alarms') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/alarms', component: AlarmManagementView }],
  })
  await router.push(route)
  await router.isReady()

  const wrapper = mount(AlarmManagementView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return wrapper
}

describe('AlarmManagementView', () => {
  beforeEach(() => {
    const allAlarms = [blackboardAlarm, cameraAlarm, upsAlarm]
    alarmApiMock.listAlarms.mockReset()
    alarmApiMock.getAlarm.mockReset()
    alarmApiMock.updateAlarmStatus.mockReset()
    alarmApiMock.createDisposalRecord.mockReset()
    alarmApiMock.resetDemoAlarms.mockReset()
    alarmApiMock.listAlarms.mockResolvedValue(listPayload(allAlarms))
    alarmApiMock.getAlarm.mockImplementation((id: string) => {
      const alarm = allAlarms.find((item) => item.id === id)
      return Promise.resolve(alarm ?? blackboardAlarm)
    })
    alarmApiMock.updateAlarmStatus.mockImplementation((id: string) => {
      const alarm = allAlarms.find((item) => item.id === id) ?? blackboardAlarm
      return Promise.resolve(withProcessingRecord(alarm))
    })
    alarmApiMock.createDisposalRecord.mockImplementation((id: string) => {
      const alarm = allAlarms.find((item) => item.id === id) ?? blackboardAlarm
      return Promise.resolve(withFalsePositiveRecord(alarm))
    })
    alarmApiMock.resetDemoAlarms.mockResolvedValue(listPayload(allAlarms))
  })

  test('renders summary, filters, and required table columns', async () => {
    const wrapper = await mountAlarmView()

    expect(wrapper.text()).toContain('告警管理')
    expect(wrapper.text()).toContain('告警总数')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).not.toContain('本地演示状态')
    expect(wrapper.text()).toContain('设备编号/名称/位置')
    const columnLabels = wrapper.findAllComponents({ name: 'ElTableColumn' }).map((column) => column.props('label'))
    expect(columnLabels).toEqual(
      expect.arrayContaining([
        '设备标识符',
        '设备名称',
        '发生位置',
        '通知人/责任人',
        '触发方式',
        '事件状态',
        '上报时间',
        '操作',
      ]),
    )
    expect(wrapper.text()).toContain('HB-3F-021')
    expect(alarmApiMock.listAlarms).toHaveBeenCalledWith({})
  })

  test('filters alarms by keyword and resets the table', async () => {
    alarmApiMock.listAlarms.mockResolvedValueOnce(listPayload([blackboardAlarm, cameraAlarm, upsAlarm]))
    alarmApiMock.listAlarms.mockResolvedValueOnce(listPayload([upsAlarm]))
    alarmApiMock.resetDemoAlarms.mockResolvedValueOnce(listPayload([blackboardAlarm, cameraAlarm, upsAlarm]))
    const wrapper = await mountAlarmView()

    await wrapper.get('[data-testid="alarm-keyword-input"]').setValue('UPS')
    await wrapper.get('[data-testid="alarm-search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('UPS-1-001-01')
    expect(wrapper.text()).not.toContain('HB-3F-021')

    await wrapper.get('[data-testid="alarm-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('UPS-1-001-01')
    expect(wrapper.text()).toContain('HB-3F-021')
    expect(alarmApiMock.listAlarms).toHaveBeenLastCalledWith({ keyword: 'UPS' })
    expect(alarmApiMock.resetDemoAlarms).toHaveBeenCalledOnce()
  })

  test('opens detail drawer from row action and updates status', async () => {
    const wrapper = await mountAlarmView()

    await wrapper.get('[data-testid="alarm-view-HB-3F-021"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警详情')
    expect(wrapper.text()).toContain('138 0000 1201')
    expect(wrapper.text()).toContain('事件触发录音')
    expect(wrapper.text()).toContain('0:00 / 0:15')
    expect(wrapper.text()).toContain('处理记录')
    expect(wrapper.find('[data-testid="alarm-recording-track"]').exists()).toBe(true)

    const playButton = wrapper.get('[data-testid="alarm-recording-toggle"]')
    expect(playButton.text()).toContain('播放')

    await playButton.trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="alarm-recording-toggle"]').text()).toContain('暂停')

    await wrapper.get('[data-testid="alarm-mark-processing"]').trigger('click')
    await flushPromises()

    expect(alarmApiMock.getAlarm).toHaveBeenCalledWith('alarm-blackboard-021')
    expect(alarmApiMock.updateAlarmStatus).toHaveBeenCalledWith('alarm-blackboard-021', { action: 'processing' })
    expect(wrapper.text()).toContain('系统管理员 · 标记为处理中')
    expect(wrapper.text()).toContain('标记为处理中')
    expect(wrapper.text()).toContain('已接收告警，正在确认现场情况。')
  })

  test('opens matching alarm detail from device query parameter', async () => {
    const wrapper = await mountAlarmView('/alarms?device=HB-3F-021')

    expect(wrapper.text()).toContain('告警详情')
    expect(wrapper.text()).toContain('HB-3F-021')
    expect(wrapper.text()).toContain('黑板心跳中断')
    expect(alarmApiMock.getAlarm).toHaveBeenCalledWith('alarm-blackboard-021')
  })

  test('adds disposal records from the backend response', async () => {
    const wrapper = await mountAlarmView()

    await wrapper.get('[data-testid="alarm-view-HB-3F-021"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="alarm-false-positive"]').trigger('click')
    await flushPromises()

    expect(alarmApiMock.createDisposalRecord).toHaveBeenCalledWith('alarm-blackboard-021', {
      action: '误报反馈',
      note: '已记录误报反馈，待复核告警规则。',
    })
    expect(wrapper.text()).toContain('系统管理员 · 误报反馈')
  })
})
