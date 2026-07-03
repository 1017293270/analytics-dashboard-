import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AlarmManagementView from './AlarmManagementView.vue'

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
  test('renders summary, filters, and required table columns', async () => {
    const wrapper = await mountAlarmView()

    expect(wrapper.text()).toContain('告警管理')
    expect(wrapper.text()).toContain('告警总数')
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
  })

  test('filters alarms by keyword and resets the table', async () => {
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
  })

  test('opens detail drawer from row action and updates status', async () => {
    const wrapper = await mountAlarmView()

    await wrapper.get('[data-testid="alarm-view-HB-3F-021"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警详情')
    expect(wrapper.text()).toContain('138 0000 1201')
    expect(wrapper.text()).toContain('0:00 / 0:15')
    expect(wrapper.text()).toContain('处理记录')
    expect(wrapper.get('[aria-label="播放录音占位"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="alarm-mark-processing"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('标记为处理中')
    expect(wrapper.text()).toContain('已接收告警，正在确认现场情况。')
  })

  test('opens matching alarm detail from device query parameter', async () => {
    const wrapper = await mountAlarmView('/alarms?device=CAM-3-101-01')

    expect(wrapper.text()).toContain('告警详情')
    expect(wrapper.text()).toContain('CAM-3-101-01')
    expect(wrapper.text()).toContain('人员摔倒')
  })
})
