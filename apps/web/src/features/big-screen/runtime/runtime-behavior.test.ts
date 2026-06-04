import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi } from '../api/bigScreenApi'
import { mockDataAdapter } from '../data-adapters/mockDataAdapter'
import { createDefaultDashboardSchema } from '../schema/defaults'
import RuntimeComponent from './RuntimeComponent.vue'
import RuntimeScreen from './RuntimeScreen.vue'

vi.mock('../api/bigScreenApi', () => ({
  bigScreenApi: {
    getRuntime: vi.fn(),
    getSharedRuntime: vi.fn(),
  },
}))

vi.mock('../data-adapters/mockDataAdapter', () => ({
  mockDataAdapter: {
    query: vi.fn(),
  },
}))

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

function createRuntimeComponent(dataBindingId?: string): DashboardComponent {
  return {
    id: 'component-1',
    type: 'metric-card',
    name: 'Metric',
    layout: { x: 10, y: 20, width: 320, height: 180, zIndex: 2, visible: true },
    props: { title: 'Metric' },
    style: {},
    dataBindingId,
  }
}

function createSchema(binding?: DashboardSchema['dataBindings'][string]): DashboardSchema {
  const schema = createDefaultDashboardSchema()

  return {
    ...schema,
    dataBindings: binding ? { [binding.id]: binding } : {},
  }
}

function createMockBinding(overrides: Partial<DashboardSchema['dataBindings'][string]> = {}) {
  return {
    id: 'binding-1',
    sourceType: 'mock' as const,
    query: { metrics: ['count'] },
    ...overrides,
  }
}

function createMetricData(value: number) {
  return { kind: 'metric' as const, value, label: 'Requests', trend: 1.2 }
}

describe('RuntimeComponent data loading', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  test('ignores stale data after binding is removed while a request is pending', async () => {
    const pendingQuery = createDeferred<ReturnType<typeof createMetricData>>()
    vi.mocked(mockDataAdapter.query).mockReturnValue(pendingQuery.promise)
    const wrapper = mount(RuntimeComponent, {
      props: {
        component: createRuntimeComponent('binding-1'),
        schema: createSchema(createMockBinding()),
      },
    })

    expect(vi.mocked(mockDataAdapter.query)).toHaveBeenCalledOnce()

    await wrapper.setProps({
      component: createRuntimeComponent(),
      schema: createSchema(),
    })
    pendingQuery.resolve(createMetricData(42))
    await flushPromises()

    expect(wrapper.text()).toContain('No metric data')
    expect(wrapper.text()).not.toContain('42')
    expect(wrapper.text()).not.toContain('Requests')
  })

  test('reloads when the same binding id receives a different query', async () => {
    vi.mocked(mockDataAdapter.query).mockResolvedValue(createMetricData(12))
    const wrapper = mount(RuntimeComponent, {
      props: {
        component: createRuntimeComponent('binding-1'),
        schema: createSchema(createMockBinding({ query: { metrics: ['count'] } })),
      },
    })
    await flushPromises()

    await wrapper.setProps({
      schema: createSchema(createMockBinding({ query: { metrics: ['revenue'] } })),
    })
    await flushPromises()

    expect(vi.mocked(mockDataAdapter.query)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(mockDataAdapter.query).mock.calls[0]?.[0].query).toEqual({ metrics: ['count'] })
    expect(vi.mocked(mockDataAdapter.query).mock.calls[1]?.[0].query).toEqual({ metrics: ['revenue'] })
  })

  test('rejects unsupported non-mock source types instead of calling the mock adapter', async () => {
    const wrapper = mount(RuntimeComponent, {
      props: {
        component: createRuntimeComponent('binding-1'),
        schema: createSchema(createMockBinding({ sourceType: 'dataset' })),
      },
    })
    await flushPromises()

    expect(vi.mocked(mockDataAdapter.query)).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Unsupported data source: dataset')
  })

  test('stops refreshing after unmount', async () => {
    vi.useFakeTimers()
    vi.mocked(mockDataAdapter.query).mockResolvedValue(createMetricData(7))
    const wrapper = mount(RuntimeComponent, {
      props: {
        component: createRuntimeComponent('binding-1'),
        schema: createSchema(createMockBinding({ refreshSeconds: 5 })),
      },
    })
    await flushPromises()
    expect(vi.mocked(mockDataAdapter.query)).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    await flushPromises()
    expect(vi.mocked(mockDataAdapter.query)).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    vi.advanceTimersByTime(15000)
    await flushPromises()

    expect(vi.mocked(mockDataAdapter.query)).toHaveBeenCalledTimes(2)
  })
})

describe('RuntimeScreen loading', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('loads shared runtime by token and ignores stale id runtime data', async () => {
    const pendingRuntime = createDeferred<{
      id: string
      name: string
      schema: DashboardSchema
      publishedAt?: string | null
    }>()
    vi.mocked(bigScreenApi.getRuntime).mockReturnValue(pendingRuntime.promise)
    vi.mocked(bigScreenApi.getSharedRuntime).mockResolvedValue({
      id: 'shared',
      name: 'Shared',
      schema: createSchema(),
      publishedAt: null,
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/runtime/:id', component: RuntimeScreen },
        { path: '/share/:token', component: RuntimeScreen },
      ],
    })

    await router.push('/runtime/first')
    await router.isReady()
    const wrapper = mount(RuntimeScreen, {
      global: {
        plugins: [router],
        stubs: {
          RuntimeComponent: true,
          RuntimeScaler: { template: '<section><slot /></section>' },
        },
      },
    })

    expect(vi.mocked(bigScreenApi.getRuntime)).toHaveBeenCalledWith('first')

    await router.push('/share/token-1')
    await flushPromises()
    expect(vi.mocked(bigScreenApi.getSharedRuntime)).toHaveBeenCalledWith('token-1')

    pendingRuntime.resolve({ id: 'first', name: 'First', schema: createSchema(), publishedAt: null })
    await flushPromises()

    expect(wrapper.text()).toContain('No visible components')
    expect(wrapper.text()).not.toContain('Runtime screen not found')
  })
})
