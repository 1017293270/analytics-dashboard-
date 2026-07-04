import type { ApplicationCategoryRow, ApplicationRow } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessageBox } from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { applicationApi, type ApplicationListPayload } from './applicationApi'
import ApplicationCenterView from './ApplicationCenterView.vue'

const elementStubs = {
  ElSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <slot />
      </select>
    `,
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

vi.mock('./applicationApi', () => ({
  applicationApi: {
    listApplications: vi.fn(),
    listCategories: vi.fn(),
    createApplication: vi.fn(),
    updateApplication: vi.fn(),
    uninstallApplication: vi.fn(),
    resetDemoApplications: vi.fn(),
  },
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
  }
})

const applicationCategories: ApplicationCategoryRow[] = [
  { id: 'teaching-tools', name: '教学工具', sortOrder: 1 },
  { id: 'management-tools', name: '管理工具', sortOrder: 2 },
  { id: 'data-dashboard', name: '数据看板', sortOrder: 3 },
  { id: 'mobile-service', name: '移动服务', sortOrder: 4 },
]

function apiApplication(overrides: Partial<ApplicationRow>): ApplicationRow {
  return {
    id: 'app-notice',
    name: '校园通知发布系统',
    categoryId: 'management-tools',
    categoryName: '管理工具',
    platform: 'web',
    url: 'https://demo.school.local/notice',
    packageId: '',
    icon: 'notice',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    status: 'enabled',
    sortOrder: 1,
    createdAt: '2026-07-04T08:00:00.000Z',
    updatedAt: '2026-07-04T08:00:00.000Z',
    ...overrides,
  }
}

const apiApplications: ApplicationRow[] = [
  apiApplication({}),
  apiApplication({
    id: 'app-inspection',
    name: '移动巡检',
    platform: 'mobile',
    url: '',
    packageId: 'com.school.inspection',
    icon: 'shield',
    visibleRoleCodes: ['electro-education-director'],
    sortOrder: 2,
  }),
  apiApplication({
    id: 'app-energy',
    name: '能耗管理平台',
    categoryId: 'data-dashboard',
    categoryName: '数据看板',
    icon: 'energy',
    visibleRoleCodes: ['electro-education-director'],
    status: 'disabled',
    sortOrder: 4,
  }),
  apiApplication({
    id: 'app-resource',
    name: '教研资源库',
    categoryId: 'teaching-tools',
    categoryName: '教学工具',
    icon: 'resource',
    visibleRoleCodes: ['teaching-research-director'],
    sortOrder: 6,
  }),
  apiApplication({
    id: 'app-blackboard',
    name: '智慧黑板工具',
    categoryId: 'teaching-tools',
    categoryName: '教学工具',
    platform: 'mobile',
    url: '',
    packageId: 'com.school.blackboard',
    icon: 'blackboard',
    visibleRoleCodes: ['all-staff', 'teaching-research-director'],
    status: 'disabled',
    sortOrder: 8,
  }),
]

function applicationListPayload(items: ApplicationRow[] = apiApplications): ApplicationListPayload {
  return {
    items,
    summary: { total: 8, web: 5, mobile: 3, enabled: 6 },
    filteredTotal: items.length,
  }
}

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
    vi.mocked(applicationApi.listApplications).mockReset()
    vi.mocked(applicationApi.listCategories).mockReset()
    vi.mocked(applicationApi.createApplication).mockReset()
    vi.mocked(applicationApi.updateApplication).mockReset()
    vi.mocked(applicationApi.uninstallApplication).mockReset()
    vi.mocked(applicationApi.resetDemoApplications).mockReset()
    vi.mocked(applicationApi.listApplications).mockResolvedValue(applicationListPayload())
    vi.mocked(applicationApi.listCategories).mockResolvedValue(applicationCategories)

    vi.mocked(ElMessageBox.confirm).mockReset()
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(
      'confirm' as unknown as Awaited<ReturnType<typeof ElMessageBox.confirm>>,
    )
  })

  test('loads summary, categories, filters, columns, and applications from the API', async () => {
    const wrapper = await mountApplicationView()

    expect(applicationApi.listApplications).toHaveBeenCalledTimes(1)
    expect(applicationApi.listCategories).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('应用中心')
    expect(wrapper.text()).toContain('应用总数')
    expect(wrapper.text()).toContain('校园通知发布系统')
    expect(wrapper.text()).toContain('网页端')
    expect(wrapper.text()).toContain('已启用')
    expect(wrapper.text()).toContain('数据看板')
    const columnLabels = wrapper.findAllComponents({ name: 'ElTableColumn' }).map((column) => column.props('label'))
    expect(columnLabels).toEqual(
      expect.arrayContaining(['应用名称', '应用分类', '端类型', '访问地址 / 包标识', '可见范围', '状态', '操作']),
    )
  })

  test('filters applications by keyword and resets the table locally', async () => {
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
    expect(applicationApi.createApplication).not.toHaveBeenCalled()
  })

  test('creates a valid web application through the API with a category id payload', async () => {
    const created = apiApplication({
      id: 'app-visitor',
      name: '访客预约系统',
      categoryId: 'data-dashboard',
      categoryName: '数据看板',
      url: 'https://demo.school.local/visitor',
      sortOrder: 9,
    })
    vi.mocked(applicationApi.createApplication).mockResolvedValue(created)
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="application-name-input"]').setValue('访客预约系统')
    await wrapper.get('[data-testid="application-category-select"]').setValue('data-dashboard')
    await wrapper.get('[data-testid="application-url-input"]').setValue('https://demo.school.local/visitor')
    await wrapper.get('[data-testid="application-save-button"]').trigger('click')
    await flushPromises()

    expect(applicationApi.createApplication).toHaveBeenCalledWith({
      name: '访客预约系统',
      categoryId: 'data-dashboard',
      platform: 'web',
      url: 'https://demo.school.local/visitor',
      packageId: '',
      icon: 'notice',
      visibleRoleCodes: ['all-staff'],
      status: 'enabled',
    })
    expect(wrapper.text()).toContain('访客预约系统')
  })

  test('edits an application name through the API', async () => {
    const updated = apiApplication({
      id: 'app-resource',
      name: '教研资源中心',
      categoryId: 'teaching-tools',
      categoryName: '教学工具',
      icon: 'resource',
      visibleRoleCodes: ['teaching-research-director'],
      sortOrder: 6,
    })
    vi.mocked(applicationApi.updateApplication).mockResolvedValue(updated)
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-edit-app-resource"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="application-name-input"]').setValue('教研资源中心')
    await wrapper.get('[data-testid="application-save-button"]').trigger('click')
    await flushPromises()

    expect(applicationApi.updateApplication).toHaveBeenCalledWith(
      'app-resource',
      expect.objectContaining({
        name: '教研资源中心',
        categoryId: 'teaching-tools',
        platform: 'web',
        visibleRoleCodes: ['teaching-research-director'],
        status: 'enabled',
      }),
    )
    expect(wrapper.text()).toContain('教研资源中心')
    expect(wrapper.text()).not.toContain('教研资源库')
  })

  test('toggles application status and uninstalls an application through the API', async () => {
    vi.mocked(applicationApi.updateApplication).mockResolvedValue(
      apiApplication({
        id: 'app-energy',
        name: '能耗管理平台',
        categoryId: 'data-dashboard',
        categoryName: '数据看板',
        status: 'enabled',
        sortOrder: 4,
      }),
    )
    vi.mocked(applicationApi.uninstallApplication).mockResolvedValue(
      apiApplication({
        id: 'app-blackboard',
        name: '智慧黑板工具',
        categoryId: 'teaching-tools',
        categoryName: '教学工具',
        platform: 'mobile',
        url: '',
        packageId: 'com.school.blackboard',
        icon: 'blackboard',
        visibleRoleCodes: ['all-staff', 'teaching-research-director'],
        status: 'uninstalled',
        sortOrder: 8,
      }),
    )
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-toggle-app-energy"]').trigger('click')
    await flushPromises()

    expect(applicationApi.updateApplication).toHaveBeenCalledWith('app-energy', { status: 'enabled' })

    await wrapper.get('[data-testid="application-uninstall-app-blackboard"]').trigger('click')
    await flushPromises()

    expect(applicationApi.uninstallApplication).toHaveBeenCalledWith('app-blackboard')
    const applications = wrapper.findComponent({ name: 'ElTable' }).props('data') as Array<{
      id: string
      status: string
    }>
    expect(applications.find((app) => app.id === 'app-energy')?.status).toBe('已启用')
    expect(applications.find((app) => app.id === 'app-blackboard')?.status).toBe('已卸载')
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
    expect(applicationApi.uninstallApplication).not.toHaveBeenCalled()
    expect(errorHandler).not.toHaveBeenCalled()
  })

  test('refreshes the list and resets demo data through API responses', async () => {
    const refreshed = apiApplication({ id: 'app-refreshed', name: '刷新后的应用', sortOrder: 10 })
    const reset = apiApplication({ id: 'app-reset', name: '恢复后的应用', sortOrder: 1 })
    vi.mocked(applicationApi.listApplications)
      .mockResolvedValueOnce(applicationListPayload())
      .mockResolvedValueOnce(applicationListPayload([refreshed]))
    vi.mocked(applicationApi.resetDemoApplications).mockResolvedValue(applicationListPayload([reset]))
    const wrapper = await mountApplicationView()

    await wrapper.get('[data-testid="application-refresh-button"]').trigger('click')
    await flushPromises()

    expect(applicationApi.listApplications).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('刷新后的应用')

    await wrapper.get('[data-testid="application-demo-reset-button"]').trigger('click')
    await flushPromises()

    expect(applicationApi.resetDemoApplications).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('恢复后的应用')
  })
})
