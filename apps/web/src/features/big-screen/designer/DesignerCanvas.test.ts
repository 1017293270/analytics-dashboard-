import type { DashboardSchema } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createComponent } from '../components/registry'
import { mockDataAdapter } from '../data-adapters/mockDataAdapter'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import DesignerCanvas from './DesignerCanvas.vue'

vi.mock('../data-adapters/mockDataAdapter', () => ({
  mockDataAdapter: {
    query: vi.fn(),
  },
}))

function mountCanvas() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return {
    store: useDashboardDesignerStore(),
    wrapper: mount(DesignerCanvas, { global: { plugins: [pinia] } }),
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

describe('DesignerCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  test('does not move or delete locked components from keyboard controls', async () => {
    const { store, wrapper } = mountCanvas()
    const component = createComponent('text', 20, 30, 1)
    store.addComponent({ ...component, layout: { ...component.layout, locked: true } })
    await wrapper.vm.$nextTick()

    const frame = wrapper.get('.designer-canvas__component-frame')
    await frame.trigger('keydown', { key: 'ArrowRight' })
    await frame.trigger('keydown', { key: 'Delete' })

    expect(store.schema.components).toHaveLength(1)
    expect(store.selectedComponent?.layout).toMatchObject({ x: 20, locked: true })
    expect(wrapper.find('.designer-canvas__resize-handle').exists()).toBe(false)
  })

  test('does not move or delete components from keyboard controls while saving', async () => {
    const { store, wrapper } = mountCanvas()
    const component = createComponent('text', 20, 30, 1)
    store.addComponent(component)
    store.isSaving = true
    await wrapper.vm.$nextTick()

    const frame = wrapper.get('.designer-canvas__component-frame')
    await frame.trigger('keydown', { key: 'ArrowRight' })
    await frame.trigger('keydown', { key: 'Delete' })

    expect(store.schema.components).toHaveLength(1)
    expect(store.selectedComponent?.layout.x).toBe(20)
    expect(wrapper.find('.designer-canvas__resize-handle').exists()).toBe(false)
  })

  test('loads mock data into bound components inside the editor canvas', async () => {
    vi.mocked(mockDataAdapter.query).mockResolvedValue({
      kind: 'metric',
      value: 1482,
      label: 'Requests',
      trend: 6.4,
    })
    const { store, wrapper } = mountCanvas()
    const component = {
      ...createComponent('metric-card', 20, 30, 1),
      dataBindingId: 'binding-1',
    }

    store.replaceLocalDraft({
      ...store.schema,
      dataBindings: { 'binding-1': createMockBinding() },
      components: [component],
    })
    await flushPromises()

    expect(vi.mocked(mockDataAdapter.query)).toHaveBeenCalledWith(store.schema.dataBindings['binding-1'])
    expect(wrapper.text()).toContain('1,482')
    expect(wrapper.text()).not.toContain('No metric data')
  })
})
