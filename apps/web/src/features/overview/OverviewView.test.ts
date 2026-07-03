import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { demoLaunchItems, demoReadiness, priorityAlarms } from './overviewData'
import OverviewView from './OverviewView.vue'

async function mountOverview() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/overview', component: OverviewView },
      { path: '/workbenches', component: { template: '<div>workbenches</div>' } },
      { path: '/data-dashboards', component: { template: '<div>dashboards</div>' } },
      { path: '/applications', component: { template: '<div>applications</div>' } },
      { path: '/alarms', component: { template: '<div>alarms</div>' } },
      { path: '/blackboard', component: { template: '<div>blackboard</div>' } },
      { path: '/teaching', component: { template: '<div>teaching</div>' } },
    ],
  })

  await router.push('/overview')
  await router.isReady()

  const wrapper = mount(OverviewView, {
    global: { plugins: [ElementPlus, router] },
  })

  return { wrapper, router }
}

describe('OverviewView', () => {
  test('renders the enterprise console sections', async () => {
    const { wrapper } = await mountOverview()

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).toContain('现场演示')
    expect(wrapper.text()).toContain('设备在线率')
    expect(wrapper.text()).toContain('未处理告警')
    expect(wrapper.text()).toContain('告警优先级队列')
    expect(wrapper.text()).toContain('系统健康')
    expect(wrapper.text()).toContain('演示快捷入口')
    expect(wrapper.text()).toContain('数据看板覆盖')
    expect(wrapper.text()).toContain('角色工作台发布')
    expect(wrapper.text()).toContain('演示准备进度')
    expect(wrapper.find('.overview-view__console-grid').exists()).toBe(true)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  test('filters the alarm queue by event status', async () => {
    const { wrapper } = await mountOverview()

    expect(wrapper.text()).toContain('HB-3F-021')
    expect(wrapper.text()).toContain('IPANEL-104')

    await wrapper.get('[data-testid="alarm-filter-unhandled"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="alarm-filter-unhandled"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findComponent({ name: 'ElTable' }).props('data')).toEqual([priorityAlarms[0]])

    await wrapper.get('[data-testid="alarm-filter-processing"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="alarm-filter-processing"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findComponent({ name: 'ElTable' }).props('data')).toEqual([priorityAlarms[1]])

    await wrapper.get('[data-testid="alarm-filter-all"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="alarm-filter-all"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findComponent({ name: 'ElTable' }).props('data')).toEqual(priorityAlarms)
  })

  test('wires visible overview actions to real routes', async () => {
    const { wrapper, router } = await mountOverview()

    await wrapper.get('[data-testid="demo-mode-link"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/workbenches')

    await router.push('/overview')
    await flushPromises()

    await wrapper.get('[data-testid="alarm-compact-detail-link-HB-3F-021"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/alarms?device=HB-3F-021')
  })

  test('marks completed alarm and application slices as demo-ready', () => {
    expect(Object.fromEntries(demoLaunchItems.map((item) => [item.label, item.status]))).toMatchObject({
      应用中心: '可演示',
      告警管理: '可演示',
    })
    expect(demoReadiness).toContainEqual({
      label: '告警与应用',
      status: '可演示',
      detail: '列表、筛选、详情和应用管理已接入',
    })
  })
})
