import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { seedAlarms } from '../alarms/alarmData'
import { seedApplications } from '../applications/applicationData'
import { defaultWorkbenchMetadata } from '../big-screen/workbenches/workbenchMetadata'
import {
  dashboardCoverage,
  demoLaunchItems,
  demoReadiness,
  overviewKpis,
  priorityAlarms,
  roleWorkbenches,
  systemHealth,
} from './overviewData'
import OverviewView from './OverviewView.vue'

async function mountOverview() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/overview', component: OverviewView },
      { path: '/workbenches', component: { template: '<div>workbenches</div>' } },
      { path: '/data-dashboards', component: { template: '<div>dashboards</div>' } },
      { path: '/applications', component: { template: '<div>applications</div>' } },
      { path: '/accounts', component: { template: '<div>accounts</div>' } },
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
    expect(wrapper.text()).toContain('角色工作台状态')
    expect(wrapper.text()).toContain('演示准备进度')
    expect(wrapper.find('.overview-view__console-grid').exists()).toBe(true)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  test('keeps overview KPIs aligned with current demo seed data', () => {
    const alarmKpi = overviewKpis.find((item) => item.label === '未处理告警')
    const workbenchKpi = overviewKpis.find((item) => item.label === '角色工作台')
    const applicationKpi = overviewKpis.find((item) => item.label === '演示应用')

    const unhandledAlarms = seedAlarms.filter((alarm) => alarm.status === '未处理').length
    const highPriorityAlarms = priorityAlarms.filter((alarm) => alarm.severity === '高').length
    const enabledWorkbenches = defaultWorkbenchMetadata.filter((workbench) => workbench.availability === '已启用').length
    const webApplications = seedApplications.filter((app) => app.platform === '网页端').length
    const mobileApplications = seedApplications.filter((app) => app.platform === '移动端').length
    const enabledApplications = seedApplications.filter((app) => app.status === '已启用').length

    expect(alarmKpi).toMatchObject({
      value: unhandledAlarms,
      trend: `高优先级 ${highPriorityAlarms} 条`,
      secondaryValue: `${seedAlarms.length} 条`,
    })
    expect(workbenchKpi).toMatchObject({
      value: defaultWorkbenchMetadata.length,
      secondaryValue: `${enabledWorkbenches} 个`,
    })
    expect(applicationKpi).toMatchObject({
      value: seedApplications.length,
      trend: `网页端 ${webApplications} / 移动端 ${mobileApplications}`,
      secondaryValue: `${enabledApplications} 个`,
    })
    expect(roleWorkbenches.every((workbench) => workbench.status === '已启用')).toBe(true)
  })

  test('filters the alarm queue by event status', async () => {
    const { wrapper } = await mountOverview()

    expect(wrapper.text()).toContain('HB-3F-021')
    expect(wrapper.text()).toContain('DVR-1-201-01')

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

  test('keeps overview alarm quick links aligned with alarm detail seed data', () => {
    const seededDeviceIds = new Set(seedAlarms.map((alarm) => alarm.deviceIdentifier))

    expect(priorityAlarms.map((alarm) => alarm.deviceId)).toEqual(
      expect.arrayContaining(['HB-3F-021', 'DVR-1-201-01', 'ACC-1-001-01']),
    )
    expect(priorityAlarms.every((alarm) => seededDeviceIds.has(alarm.deviceId))).toBe(true)
  })

  test('wires visible overview actions to real routes', async () => {
    const { wrapper, router } = await mountOverview()

    await wrapper.get('[data-testid="demo-mode-link"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/workbenches')

    await router.push('/overview')
    await flushPromises()

    const accountsLaunchItem = wrapper
      .findAll('.overview__launch-item')
      .find((item) => item.text().includes('账号与角色'))
    expect(accountsLaunchItem, '账号与角色快捷入口应该显示在首页').toBeTruthy()
    expect(accountsLaunchItem!.text()).toContain('账号、角色与菜单范围')

    await accountsLaunchItem!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/accounts')

    await router.push('/overview')
    await flushPromises()

    await wrapper.get('[data-testid="alarm-compact-detail-link-HB-3F-021"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/alarms?device=HB-3F-021')

    await router.push('/overview')
    await flushPromises()

    await wrapper.get('[data-testid="alarm-compact-detail-link-DVR-1-201-01"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/alarms?device=DVR-1-201-01')

    await router.push('/overview')
    await flushPromises()

    await wrapper.get('[data-testid="alarm-compact-detail-link-ACC-1-001-01"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/alarms?device=ACC-1-001-01')
  })

  test('marks completed alarm and application slices as demo-ready', async () => {
    const { wrapper } = await mountOverview()

    expect(Object.fromEntries(demoLaunchItems.map((item) => [item.label, item.status]))).toMatchObject({
      工作台配置: '可演示',
      数据看板: '可演示',
      应用中心: '可演示',
      账号与角色: '可演示',
      告警管理: '可演示',
      智慧黑板: '可演示',
      互动教学: '可演示',
    })
    expect(Object.fromEntries(dashboardCoverage.map((item) => [item.name, item.status]))).toMatchObject({
      教育治理: '已配置',
      教师发展: '已配置',
      学生成长: '已配置',
      设备运维: '已配置',
      告警态势: '已配置',
      应用使用: '已配置',
    })
    expect(demoReadiness).toContainEqual({
      label: '告警与应用',
      status: '可演示',
      detail: '列表、筛选、详情和应用管理已接入',
    })
    expect(demoReadiness).toContainEqual({
      label: '互动教学',
      status: '可演示',
      detail: '角色切换、共享、截屏、答题器、布局控制已接入',
    })
    expect(wrapper.text()).toContain('互动教学演示')
    expect(wrapper.text()).toContain('模拟课堂控制台可用')
    expect(wrapper.text()).not.toContain('42ms')
    expect(wrapper.text()).not.toContain('第三方看板延迟')
    expect(wrapper.text()).not.toContain('2.4s')
    expect(systemHealth).toContainEqual({
      name: '数据看板服务',
      status: 'success',
      detail: '2 个第三方嵌入看板接入',
      metric: '可演示',
    })
    expect(systemHealth).toContainEqual({
      name: '角色可见性演示',
      status: 'success',
      detail: '菜单与工作台可见范围可演示',
      metric: '可演示',
    })
    expect(wrapper.text()).not.toContain('角色权限服务')
    expect(wrapper.text()).not.toContain('策略生效')
  })
})
