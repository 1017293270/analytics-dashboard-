import { flushPromises, mount } from '@vue/test-utils'
import type { CurrentUser, RoleCode } from '@analytics/shared'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthStore } from '../../auth/stores/useAuthStore'
import { bigScreenApi, type DashboardListItem, type DashboardRecord, type DashboardVersion } from '../api/bigScreenApi'
import { bigScreenText } from '../i18n/zh-CN'
import { createDefaultDashboardSchema } from '../schema/defaults'
import DashboardList from './DashboardList.vue'

vi.mock('../api/bigScreenApi', () => ({
  bigScreenApi: {
    listDashboards: vi.fn(),
    createDashboard: vi.fn(),
    copyDashboard: vi.fn(),
    deleteDashboard: vi.fn(),
    createShareLink: vi.fn(),
    listVersions: vi.fn(),
    rollbackVersion: vi.fn(),
  },
}))

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function createStorageMock(): Storage {
  let storage: Record<string, string> = {}

  return {
    get length() {
      return Object.keys(storage).length
    },
    clear: vi.fn(() => {
      storage = {}
    }),
    getItem: vi.fn((key: string) => storage[key] ?? null),
    key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
  }
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function createListItem(overrides: Partial<DashboardListItem> = {}): DashboardListItem {
  const updatedAt = overrides.updatedAt ?? '2026-06-04T02:00:00.000Z'

  return {
    id: 'dashboard-1',
    name: 'Operations Board',
    description: null,
    status: 'draft',
    createdAt: '2026-06-04T01:00:00.000Z',
    publishedAt: null,
    ...overrides,
    updatedAt,
  }
}

function createRecord(id: string, overrides: Partial<DashboardRecord> = {}): DashboardRecord {
  const schema = createDefaultDashboardSchema()
  const updatedAt = overrides.updatedAt ?? '2026-06-04T02:00:00.000Z'

  return {
    id,
    name: 'Created Board',
    status: 'draft',
    draftSchema: schema,
    publishedSchema: null,
    ...overrides,
    updatedAt,
  }
}

function createVersion(version: number, overrides: Partial<DashboardVersion> = {}): DashboardVersion {
  return {
    id: `version-${version}`,
    dashboardId: 'dashboard-1',
    version,
    publishNote: `Release ${version}`,
    createdBy: 'demo-user',
    createdAt: '2026-06-04T04:00:00.000Z',
    ...overrides,
  }
}

function createUser(roleCode: RoleCode, roleName: string): CurrentUser {
  return {
    id: `user-${roleCode}`,
    username: roleCode,
    displayName: roleName,
    status: 'active',
    roles: [{ id: `role-${roleCode}`, code: roleCode, name: roleName }],
  }
}

const adminUser = createUser('system-admin', '系统管理员')

async function mountList(user: CurrentUser = adminUser) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.user = user
  auth.initialized = true

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/workbenches', component: DashboardList },
      { path: '/workbenches/:id', component: { template: '<main />' } },
    ],
  })

  await router.push('/workbenches')
  await router.isReady()
  const wrapper = mount(DashboardList, { global: { plugins: [pinia, router] } })

  return { router, wrapper }
}

function findButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`Button not found: ${label}`)

  return button
}

function findRow(wrapper: ReturnType<typeof mount>, text: string) {
  const row = wrapper.findAll('tbody tr').find((candidate) => candidate.text().includes(text))
  if (!row) throw new Error(`Row not found: ${text}`)

  return row
}

function findRowButton(wrapper: ReturnType<typeof mount>, rowText: string, label: string) {
  const button = findRow(wrapper, rowText).findAll('button').find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`Button not found: ${label}`)

  return button
}

describe('DashboardList', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  afterEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('loads dashboards and disables runtime for drafts', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem(),
      createListItem({ id: 'dashboard-2', name: 'Live Wall', status: 'published', publishedAt: '2026-06-04T03:00:00.000Z' }),
    ])

    const { wrapper } = await mountList()
    await flushPromises()

    expect(wrapper.text()).toContain('Operations Board')
    expect(wrapper.text()).toContain('Live Wall')
    const runtimeLinks = wrapper
      .findAll('.dashboard-list__action')
      .filter((link) => link.text() === bigScreenText.common.actions.runtime)
    expect(runtimeLinks[0]?.attributes('aria-disabled')).toBe('true')
    expect(runtimeLinks[1]?.attributes('href')).toBe('/runtime/dashboard-2')
  })

  test('shows workbench role chips and availability status', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-electro', name: '电教主任工作台' }),
      createListItem({ id: 'dashboard-moral', name: '德育主任工作台' }),
    ])

    const { wrapper } = await mountList()
    await flushPromises()

    const electroRow = findRow(wrapper, '电教主任工作台')
    const moralRow = findRow(wrapper, '德育主任工作台')

    expect(electroRow.findAll('[data-testid="workbench-role-chip"]').map((chip) => chip.text())).toEqual(['电教主任'])
    expect(electroRow.text()).toContain('已启用')
    expect(moralRow.findAll('[data-testid="workbench-role-chip"]').map((chip) => chip.text())).toEqual(['德育主任'])
    expect(moralRow.text()).toContain('已启用')
  })

  test('shows four default workbench rows returned by the API as editable links', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-all', name: '全员工作台', description: '工作台配置演示态' }),
      createListItem({ id: 'dashboard-electro', name: '电教主任工作台', description: '工作台配置演示态' }),
      createListItem({ id: 'dashboard-moral', name: '德育主任工作台', description: '工作台配置演示态' }),
      createListItem({ id: 'dashboard-research', name: '教研主任工作台', description: '工作台配置演示态' }),
    ])

    const { wrapper } = await mountList()
    await flushPromises()

    const links = wrapper.findAll('.dashboard-list__name-link')
    expect(links.map((link) => link.text())).toEqual([
      '全员工作台',
      '电教主任工作台',
      '德育主任工作台',
      '教研主任工作台',
    ])
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/workbenches/dashboard-all',
      '/workbenches/dashboard-electro',
      '/workbenches/dashboard-moral',
      '/workbenches/dashboard-research',
    ])
    expect(wrapper.text()).toContain('工作台配置演示态')
    expect(wrapper.text()).not.toContain(bigScreenText.dashboardList.createFirst)
  })

  test('does not synthesize default workbench rows when the API unexpectedly returns empty', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([])

    const { wrapper } = await mountList()
    await flushPromises()

    expect(wrapper.findAll('.dashboard-list__name-link')).toHaveLength(0)
    expect(wrapper.text()).toContain(bigScreenText.dashboardList.createFirst)
  })

  test('filters visible workbenches for a non-admin role', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-all', name: '全员工作台' }),
      createListItem({ id: 'dashboard-electro', name: '电教主任工作台' }),
      createListItem({ id: 'dashboard-moral', name: '德育主任工作台' }),
      createListItem({ id: 'dashboard-research', name: '教研主任工作台' }),
    ])

    const { wrapper } = await mountList(createUser('moral-education-director', '德育主任'))
    await flushPromises()

    expect(wrapper.findAll('.dashboard-list__name-link').map((link) => link.text())).toEqual(['德育主任工作台'])
    expect(wrapper.text()).not.toContain('全员工作台')
    expect(wrapper.text()).not.toContain('电教主任工作台')
    expect(wrapper.text()).not.toContain('教研主任工作台')
  })

  test('toggles workbench availability as local demo state', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-electro', name: '电教主任工作台' }),
    ])

    const { wrapper } = await mountList()
    await flushPromises()

    expect(wrapper.text()).toContain('启停状态为本机演示保存')

    await wrapper.get('[data-testid="toggle-workbench-availability-dashboard-electro"]').trigger('click')

    const disabledRow = findRow(wrapper, '电教主任工作台')
    expect(disabledRow.text()).toContain('已停用')
    expect(disabledRow.get('[data-testid="toggle-workbench-availability-dashboard-electro"]').text()).toBe('启用')

    await disabledRow.get('[data-testid="toggle-workbench-availability-dashboard-electro"]').trigger('click')

    const enabledRow = findRow(wrapper, '电教主任工作台')
    expect(enabledRow.text()).toContain('已启用')
    expect(enabledRow.get('[data-testid="toggle-workbench-availability-dashboard-electro"]').text()).toBe('停用')
  })

  test('keeps disabled workbench availability after remounting the list', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-electro', name: '电教主任工作台' }),
    ])

    const firstMount = await mountList()
    await flushPromises()
    await firstMount.wrapper.get('[data-testid="toggle-workbench-availability-dashboard-electro"]').trigger('click')
    expect(findRow(firstMount.wrapper, '电教主任工作台').text()).toContain('已停用')
    firstMount.wrapper.unmount()

    const secondMount = await mountList()
    await flushPromises()

    const restoredRow = findRow(secondMount.wrapper, '电教主任工作台')
    expect(restoredRow.text()).toContain('已停用')
    expect(restoredRow.get('[data-testid="toggle-workbench-availability-dashboard-electro"]').text()).toBe('启用')
  })

  test('creates a dashboard and navigates to the designer', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([])
    vi.mocked(bigScreenApi.createDashboard).mockResolvedValue(createRecord('created-1'))

    const { router, wrapper } = await mountList()
    await flushPromises()
    await findButton(wrapper, bigScreenText.dashboardList.newBigScreen).trigger('click')
    await flushPromises()

    expect(bigScreenApi.createDashboard).toHaveBeenCalledWith({ name: bigScreenText.dashboardList.untitled })
    expect(router.currentRoute.value.fullPath).toBe('/workbenches/created-1')
  })

  test('archives after confirmation and removes the row from the list', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([createListItem()])
    vi.mocked(bigScreenApi.deleteDashboard).mockResolvedValue(createRecord('dashboard-1'))
    vi.stubGlobal('confirm', vi.fn(() => true))

    const { wrapper } = await mountList()
    await flushPromises()
    await findButton(wrapper, bigScreenText.common.actions.archive).trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(bigScreenApi.deleteDashboard).toHaveBeenCalledWith('dashboard-1')
    expect(wrapper.text()).not.toContain('Operations Board')
  })

  test('loads versions and rolls back after confirmation', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ status: 'published', publishedAt: '2026-06-04T03:00:00.000Z' }),
    ])
    vi.mocked(bigScreenApi.listVersions)
      .mockResolvedValueOnce([createVersion(2), createVersion(1)])
      .mockResolvedValueOnce([createVersion(2), createVersion(1)])
    vi.mocked(bigScreenApi.rollbackVersion).mockResolvedValue(
      createRecord('dashboard-1', {
        status: 'published',
        publishedAt: '2026-06-04T05:00:00.000Z',
        updatedAt: '2026-06-04T05:00:00.000Z',
      }),
    )
    vi.stubGlobal('confirm', vi.fn(() => true))

    const { wrapper } = await mountList()
    await flushPromises()
    await findRowButton(wrapper, 'Operations Board', bigScreenText.common.actions.versions).trigger('click')
    await flushPromises()

    expect(bigScreenApi.listVersions).toHaveBeenCalledWith('dashboard-1')
    expect(wrapper.text()).toContain('v2')
    expect(wrapper.text()).toContain('Release 2')

    await findRowButton(wrapper, 'v2', bigScreenText.common.actions.rollback).trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(bigScreenApi.rollbackVersion).toHaveBeenCalledWith('dashboard-1', 2)
    expect(wrapper.text()).toContain(bigScreenText.common.status.published)
  })

  test('shows version empty and error states', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-1', name: 'Empty Versions', status: 'published' }),
      createListItem({ id: 'dashboard-2', name: 'Error Versions', status: 'published' }),
    ])
    vi.mocked(bigScreenApi.listVersions).mockImplementation((id) => {
      if (id === 'dashboard-1') return Promise.resolve([])
      if (id === 'dashboard-2') return Promise.reject(new Error('Version service unavailable'))

      throw new Error(`Unexpected id ${id}`)
    })

    const { wrapper } = await mountList()
    await flushPromises()
    await findRowButton(wrapper, 'Empty Versions', bigScreenText.common.actions.versions).trigger('click')
    await flushPromises()
    await findRowButton(wrapper, 'Error Versions', bigScreenText.common.actions.versions).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(bigScreenText.dashboardList.noPublishedVersions)
    expect(wrapper.text()).toContain('Version service unavailable')
  })

  test('keeps row action busy state isolated across rows', async () => {
    const pendingCopy = createDeferred<DashboardRecord>()
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([
      createListItem({ id: 'dashboard-1', name: 'Copy Row' }),
      createListItem({ id: 'dashboard-2', name: 'Share Row', status: 'published' }),
    ])
    vi.mocked(bigScreenApi.copyDashboard).mockReturnValue(pendingCopy.promise)
    vi.mocked(bigScreenApi.createShareLink).mockResolvedValue({
      id: 'share-1',
      dashboardId: 'dashboard-2',
      token: 'token-1',
      accessScope: 'public-runtime',
      expiresAt: null,
      url: '/share/token-1',
    })

    const { wrapper } = await mountList()
    await flushPromises()
    await findRowButton(wrapper, 'Copy Row', bigScreenText.common.actions.copy).trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain(bigScreenText.common.actions.copying)

    await findRowButton(wrapper, 'Share Row', bigScreenText.common.actions.share).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(bigScreenText.common.actions.copying)
    expect(wrapper.text()).toContain('/share/token-1')
    pendingCopy.resolve(createRecord('copied-dashboard'))
    await flushPromises()
  })
})
