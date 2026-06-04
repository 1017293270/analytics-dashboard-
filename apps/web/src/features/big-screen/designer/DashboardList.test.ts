import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi, type DashboardListItem, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import DashboardList from './DashboardList.vue'

vi.mock('../api/bigScreenApi', () => ({
  bigScreenApi: {
    listDashboards: vi.fn(),
    createDashboard: vi.fn(),
    copyDashboard: vi.fn(),
    deleteDashboard: vi.fn(),
    createShareLink: vi.fn(),
  },
}))

function createListItem(overrides: Partial<DashboardListItem> = {}): DashboardListItem {
  return {
    id: 'dashboard-1',
    name: 'Operations Board',
    description: null,
    status: 'draft',
    createdAt: '2026-06-04T01:00:00.000Z',
    updatedAt: '2026-06-04T02:00:00.000Z',
    publishedAt: null,
    ...overrides,
  }
}

function createRecord(id: string): DashboardRecord {
  const schema = createDefaultDashboardSchema()

  return {
    id,
    name: 'Created Board',
    status: 'draft',
    draftSchema: schema,
    publishedSchema: null,
  }
}

async function mountList() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/big-screens', component: DashboardList },
      { path: '/big-screens/:id', component: { template: '<main />' } },
    ],
  })

  await router.push('/big-screens')
  await router.isReady()
  const wrapper = mount(DashboardList, { global: { plugins: [router] } })

  return { router, wrapper }
}

function findButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`Button not found: ${label}`)

  return button
}

describe('DashboardList', () => {
  afterEach(() => {
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
    const runtimeLinks = wrapper.findAll('.dashboard-list__action').filter((link) => link.text() === 'Runtime')
    expect(runtimeLinks[0]?.attributes('aria-disabled')).toBe('true')
    expect(runtimeLinks[1]?.attributes('href')).toBe('/runtime/dashboard-2')
  })

  test('creates a dashboard and navigates to the designer', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([])
    vi.mocked(bigScreenApi.createDashboard).mockResolvedValue(createRecord('created-1'))

    const { router, wrapper } = await mountList()
    await flushPromises()
    await findButton(wrapper, 'New Big Screen').trigger('click')
    await flushPromises()

    expect(bigScreenApi.createDashboard).toHaveBeenCalledWith({ name: 'Untitled Dashboard' })
    expect(router.currentRoute.value.fullPath).toBe('/big-screens/created-1')
  })

  test('archives after confirmation and removes the row from the list', async () => {
    vi.mocked(bigScreenApi.listDashboards).mockResolvedValue([createListItem()])
    vi.mocked(bigScreenApi.deleteDashboard).mockResolvedValue(createRecord('dashboard-1'))
    vi.stubGlobal('confirm', vi.fn(() => true))

    const { wrapper } = await mountList()
    await flushPromises()
    await findButton(wrapper, 'Archive').trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(bigScreenApi.deleteDashboard).toHaveBeenCalledWith('dashboard-1')
    expect(wrapper.text()).not.toContain('Operations Board')
  })
})
