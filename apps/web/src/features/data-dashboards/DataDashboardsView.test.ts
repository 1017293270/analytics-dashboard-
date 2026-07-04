import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
import DataDashboardsView from './DataDashboardsView.vue'

const elementStubs = {
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

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
    },
  }
})

async function mountDashboardView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/data-dashboards', component: DataDashboardsView }],
  })
  await router.push('/data-dashboards')
  await router.isReady()

  const wrapper = mount(DataDashboardsView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return wrapper
}

describe('DataDashboardsView', () => {
  test('renders summary, filters, required table columns, and seed dashboards', async () => {
    const wrapper = await mountDashboardView()

    expect(wrapper.text()).toContain('数据看板')
    expect(wrapper.text()).toContain('看板总数')
    expect(wrapper.text()).toContain('第三方嵌入')
    expect(wrapper.text()).toContain('看板名称')
    expect(wrapper.text()).toContain('看板类型')
    expect(wrapper.text()).toContain('使用角色')
    expect(wrapper.text()).toContain('来源')
    expect(wrapper.text()).toContain('更新时间')
    const columnLabels = wrapper.findAllComponents({ name: 'ElTableColumn' }).map((column) => column.props('label'))
    expect(columnLabels).toEqual(
      expect.arrayContaining(['看板名称', '看板类型', '使用角色', '来源', '状态', '更新时间', '操作']),
    )
    expect(wrapper.text()).toContain('教育治理')
    expect(wrapper.text()).toContain('教师发展')
    expect(wrapper.text()).toContain('学生成长')
    expect(wrapper.text()).toContain('设备运维')
    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).toContain('应用使用')
    expect(wrapper.text()).toContain('默认')
  })

  test('filters dashboards by keyword and resets the table', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-keyword-input"]').setValue('告警')
    await wrapper.get('[data-testid="dashboard-search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).not.toContain('教育治理')

    await wrapper.get('[data-testid="dashboard-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).toContain('教育治理')
  })

  test('opens preview drawer and toggles dashboard status', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-preview-dashboard-governance"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('配置数据看板')
    expect(wrapper.text()).toContain('教育治理')
    expect(wrapper.text()).toContain('治理事项')
    expect(wrapper.text()).toContain('内置看板预览')

    await wrapper.get('[data-testid="dashboard-toggle-dashboard-device"]').trigger('click')
    await flushPromises()

    const dashboards = wrapper.findComponent({ name: 'ElTable' }).props('data') as Array<{
      id: string
      status: string
    }>
    expect(dashboards.find((dashboard) => dashboard.id === 'dashboard-device')?.status).toBe('已停用')
  })

  test('locks source type and shows status text for existing dashboards', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-preview-dashboard-alarm"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'ElRadioGroup' }).props('disabled')).toBe(true)
    expect(wrapper.get('[data-testid="dashboard-status-control"]').text()).toContain('已停用')
  })

  test('shows third-party dashboard metrics in the preview drawer', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-preview-dashboard-alarm"]').trigger('click')
    await flushPromises()

    const metrics = wrapper.get('[data-testid="dashboard-embed-metrics"]').text()
    expect(metrics).toContain('今日告警')
    expect(metrics).toContain('8')
    expect(metrics).toContain('未处理 4')
  })

  test('validates and saves a third-party dashboard from the drawer', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-add-embed-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('看板名称不能为空')

    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('资产态势')
    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('javascript:alert(1)')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('第三方看板链接必须以 http:// 或 https:// 开头')

    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('https://demo.school.local/assets')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('资产态势')
    expect(wrapper.text()).toContain('https://demo.school.local/assets')
  })
})
