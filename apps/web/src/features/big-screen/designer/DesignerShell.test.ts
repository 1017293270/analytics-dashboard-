import type { DashboardSchema } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import DesignerShell from './DesignerShell.vue'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function createRecord(id: string, schema: DashboardSchema = createDefaultDashboardSchema()): DashboardRecord {
  return {
    id,
    name: `Dashboard ${id}`,
    status: 'draft',
    draftSchema: schema,
    publishedSchema: null,
  }
}

async function mountShellAt(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/big-screens/:id', component: DesignerShell }],
  })

  await router.push(path)
  await router.isReady()

  const wrapper = mount(DesignerShell, {
    global: {
      plugins: [pinia, router],
      stubs: {
        ComponentPalette: true,
        DesignerCanvas: true,
        DesignerPropertyPanel: true,
        DesignerToolbar: true,
      },
    },
  })

  return { router, store: useDashboardDesignerStore(), wrapper }
}

describe('DesignerShell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  test('ignores stale dashboard loads after the route changes', async () => {
    const firstLoad = createDeferred<DashboardRecord>()
    const secondLoad = createDeferred<DashboardRecord>()
    vi.spyOn(bigScreenApi, 'getDashboard').mockImplementation((id) => {
      if (id === 'first') return firstLoad.promise
      if (id === 'second') return secondLoad.promise

      throw new Error(`Unexpected id ${id}`)
    })
    const { router, store } = await mountShellAt('/big-screens/first')

    await router.push('/big-screens/second')
    secondLoad.resolve(createRecord('second'))
    await flushPromises()
    expect(store.dashboardId).toBe('second')

    firstLoad.resolve(createRecord('first'))
    await flushPromises()

    expect(store.dashboardId).toBe('second')
    expect(store.dashboardName).toBe('Dashboard second')
  })

  test('ignores stale save responses after routing to a different dashboard', async () => {
    const firstLoad = createDeferred<DashboardRecord>()
    const secondLoad = createDeferred<DashboardRecord>()
    const staleSave = createDeferred<DashboardRecord>()

    vi.spyOn(bigScreenApi, 'getDashboard').mockImplementation((id) => {
      if (id === 'first') return firstLoad.promise
      if (id === 'second') return secondLoad.promise

      throw new Error(`Unexpected id ${id}`)
    })
    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord('first'))
    vi.spyOn(bigScreenApi, 'saveDraft').mockReturnValue(staleSave.promise)

    const { router, store } = await mountShellAt('/big-screens/first')

    firstLoad.resolve(createRecord('first'))
    await flushPromises()
    expect(store.dashboardId).toBe('first')

    const savePromise = store.saveDraft()
    await flushPromises()
    expect(store.isSaving).toBe(true)

    await router.push('/big-screens/second')
    secondLoad.resolve(createRecord('second'))
    await flushPromises()
    expect(store.dashboardId).toBe('second')

    staleSave.resolve(createRecord('first'))
    await savePromise
    await flushPromises()

    expect(store.dashboardId).toBe('second')
    expect(store.dashboardName).toBe('Dashboard second')
    expect(store.isSaving).toBe(false)
  })

  test('does not let an unmounted load clear a newer loading state', async () => {
    const load = createDeferred<DashboardRecord>()
    vi.spyOn(bigScreenApi, 'getDashboard').mockReturnValue(load.promise)
    const { store, wrapper } = await mountShellAt('/big-screens/first')
    expect(store.isLoading).toBe(true)

    wrapper.unmount()
    store.isLoading = true
    load.resolve(createRecord('first'))
    await flushPromises()

    expect(store.isLoading).toBe(true)
    expect(store.dashboardId).toBeNull()
  })
})
