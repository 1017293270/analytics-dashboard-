import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardDesignerStore } from './useDashboardDesignerStore'
import { useDashboardHistoryStore } from './useDashboardHistoryStore'

const component: DashboardComponent = {
  id: 'component-1',
  type: 'metric-card',
  name: 'Revenue',
  layout: { x: 0, y: 0, width: 320, height: 180, zIndex: 1 },
  props: { title: 'Revenue', unit: 'USD' },
  style: { color: '#fff', fontSize: 20 },
}

function createRecord(schema: DashboardSchema, overrides: Partial<DashboardRecord> = {}): DashboardRecord {
  return {
    id: 'dashboard-1',
    name: 'Command Center',
    status: 'draft',
    draftSchema: schema,
    publishedSchema: null,
    ...overrides,
  }
}

describe('useDashboardDesignerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  test('saveDraft preserves selected component and history', async () => {
    const store = useDashboardDesignerStore()
    const history = useDashboardHistoryStore()
    store.dashboardId = 'dashboard-1'
    store.dashboardName = 'Command Center'
    store.addComponent(component)
    const historyLength = history.past.length

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord(store.schema))
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(store.schema))

    await store.saveDraft()

    expect(store.selectedComponentId).toBe(component.id)
    expect(history.past).toHaveLength(historyLength)
  })

  test('saveDraft creates a backend dashboard for local drafts before saving schema', async () => {
    const store = useDashboardDesignerStore()
    store.dashboardName = 'Local Command'
    store.addComponent(component)

    const createSpy = vi.spyOn(bigScreenApi, 'createDashboard').mockResolvedValue(
      createRecord(createDefaultDashboardSchema(), { id: 'dashboard-created', name: 'Local Command' }),
    )
    const saveSpy = vi.spyOn(bigScreenApi, 'saveDraft').mockImplementation(async (id, schema) =>
      createRecord(schema, { id, name: 'Local Command' }),
    )

    await store.saveDraft()

    expect(createSpy).toHaveBeenCalledWith({ name: 'Local Command' })
    expect(saveSpy).toHaveBeenCalledWith('dashboard-created', expect.objectContaining({ components: [component] }))
    expect(store.dashboardId).toBe('dashboard-created')
    expect(store.dashboardName).toBe('Local Command')
    expect(store.dashboardStatus).toBe('draft')
    expect(store.selectedComponentId).toBe(component.id)
  })

  test('saveDraft persists dashboard metadata before saving an existing draft', async () => {
    const store = useDashboardDesignerStore()
    store.dashboardId = 'dashboard-1'
    store.dashboardName = 'Renamed Command'

    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(store.schema, { name: 'Renamed Command' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockResolvedValue(createRecord(store.schema, { name: 'Renamed Command', status: 'published' }))

    await store.saveDraft()

    expect(updateSpy).toHaveBeenCalledWith('dashboard-1', { name: 'Renamed Command' })
    expect(saveSpy).toHaveBeenCalledWith('dashboard-1', store.schema)
    expect(store.dashboardName).toBe('Renamed Command')
    expect(store.dashboardStatus).toBe('published')
  })

  test('locked components ignore edits and removal until unlocked', () => {
    const store = useDashboardDesignerStore()
    store.addComponent({ ...component, layout: { ...component.layout, locked: true } })

    store.updateComponent(component.id, { name: 'Ignored', layout: { x: 40 } })
    store.patchComponentStyle(component.id, { fontSize: 32 })
    store.patchComponentProps(component.id, { title: 'Ignored' })
    store.removeSelectedComponent()

    expect(store.selectedComponent).toMatchObject({
      name: 'Revenue',
      layout: { x: 0, locked: true },
      props: { title: 'Revenue' },
      style: { fontSize: 20 },
    })

    store.updateComponent(component.id, { layout: { locked: false } })
    store.updateComponent(component.id, { layout: { x: 40 } })

    expect(store.selectedComponent?.layout).toMatchObject({ x: 40, locked: false })
  })

  test('replace and unset props and styles remove stale keys', () => {
    const store = useDashboardDesignerStore()
    store.addComponent(component)

    store.replaceComponentProps(component.id, { title: 'Profit' })
    expect(store.selectedComponent?.props).toEqual({ title: 'Profit' })

    store.patchComponentProps(component.id, { unit: 'USD' })
    store.unsetComponentProp(component.id, 'title')

    expect(store.selectedComponent?.props).toEqual({ unit: 'USD' })

    store.replaceComponentStyle(component.id, { color: '#000' })
    expect(store.selectedComponent?.style).toEqual({ color: '#000' })

    store.patchComponentStyle(component.id, { fontSize: 24 })
    store.unsetComponentStyle(component.id, 'color')

    expect(store.selectedComponent?.style).toEqual({ fontSize: 24 })
  })

  test('patchSchema does not push history for equivalent schemas', () => {
    const store = useDashboardDesignerStore()
    const history = useDashboardHistoryStore()

    store.patchSchema((draft) => {
      draft.canvas.width = 1920
    })

    expect(history.past).toHaveLength(0)
  })
})
