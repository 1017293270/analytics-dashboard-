import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
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

    await wrapper.get('[data-testid="alarm-filter-processing"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('HB-3F-021')
    expect(wrapper.text()).toContain('IPANEL-104')

    await wrapper.get('[data-testid="alarm-filter-all"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('HB-3F-021')
    expect(wrapper.text()).toContain('IPANEL-104')
  })
})
