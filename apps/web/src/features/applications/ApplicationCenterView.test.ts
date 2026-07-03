import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessageBox } from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import ApplicationCenterView from './ApplicationCenterView.vue'

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
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
  }
})

async function mountApplicationView(options: { errorHandler?: (error: unknown) => void } = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/applications', component: ApplicationCenterView }],
  })
  await router.push('/applications')
  await router.isReady()

  const wrapper = mount(ApplicationCenterView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: elementStubs,
      config: options.errorHandler ? { errorHandler: options.errorHandler } : undefined,
    },
  })

  await flushPromises()
  return wrapper
}

describe('ApplicationCenterView', () => {
  beforeEach(() => {
    vi.mocked(ElMessageBox.confirm).mockReset()
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(
      'confirm' as unknown as Awaited<ReturnType<typeof ElMessageBox.confirm>>,
    )
  })

  test('renders summary, filters, required table columns, and seed applications', async () => {
    const wrapper = await mountApplicationView()

    expect(wrapper.text()).toContain('应用中心')
    expect(wrapper.text()).toContain('应用总数')
    expect(wrapper.text()).toContain('网页端')
    expect(wrapper.text()).toContain('移动端')
    expect(wrapper.text()).toContain('应用名称')
    expect(wrapper.text()).toContain('应用分类')
    expect(wrapper.text()).toContain('端类型')
    const columnLabels = wrapper.findAllComponents({ name: 'ElTableColumn' }).map((column) => column.props('label'))
    expect(columnLabels).toEqual(
      expect.arrayContaining(['应用名称', '应用分类', '端类型', '访问地址 / 包标识', '可见范围', '状态', '操作']),
    )
    expect(wrapper.text()).toContain('校园通知发布系统')
  })

  test('filters applications by keyword and resets the table', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-keyword-input"]').setValue('巡检')
    await wrapper.get('[data-testid="application-search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('移动巡检')
    expect(wrapper.text()).not.toContain('校园通知发布系统')

    await wrapper.get('[data-testid="application-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('移动巡检')
    expect(wrapper.text()).toContain('校园通知发布系统')
  })

  test('validates required fields before saving a new application', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="application-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('添加应用')
    expect(wrapper.text()).toContain('应用名称不能为空')
  })

  test('adds a valid web application from the drawer', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="application-name-input"]').setValue('访客预约系统')
    await wrapper.get('[data-testid="application-url-input"]').setValue('https://demo.school.local/visitor')
    await wrapper.get('[data-testid="application-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('访客预约系统')
  })

  test('edits an application name from the drawer', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-edit-app-resource"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="application-name-input"]').setValue('教研资源中心')
    await wrapper.get('[data-testid="application-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('教研资源中心')
    expect(wrapper.text()).not.toContain('教研资源库')
  })

  test('toggles application status and uninstalls an application', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-toggle-app-energy"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('能耗管理平台')
    expect(wrapper.text()).toContain('已启用')

    await wrapper.get('[data-testid="application-uninstall-app-blackboard"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('智慧黑板工具')
    expect(wrapper.text()).toContain('已卸载')
  })

  test('keeps an application unchanged when uninstall is canceled', async () => {
    const errorHandler = vi.fn()
    const wrapper = await mountApplicationView({ errorHandler })
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))

    await wrapper.get('[data-testid="application-uninstall-app-blackboard"]').trigger('click')
    await flushPromises()

    const applications = wrapper.findComponent({ name: 'ElTable' }).props('data') as Array<{
      id: string
      status: string
    }>
    expect(applications.find((app) => app.id === 'app-blackboard')?.status).toBe('已停用')
    expect(errorHandler).not.toHaveBeenCalled()
  })
})
