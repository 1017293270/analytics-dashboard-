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

function createRecord(schema: DashboardSchema): DashboardRecord {
  return {
    id: 'dashboard-1',
    name: 'Command Center',
    status: 'draft',
    draftSchema: schema,
    publishedSchema: null,
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

    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(store.schema))

    await store.saveDraft()

    expect(store.selectedComponentId).toBe(component.id)
    expect(history.past).toHaveLength(historyLength)
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
