import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { aiOperationsPreset } from '../presets/presets'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { bigScreenText } from '../i18n/zh-CN'
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

const DEFAULT_UPDATED_AT = '2026-06-04T00:00:00.000Z'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

async function flushAsyncWork() {
  await Promise.resolve()
  await Promise.resolve()
}

function createRecord(schema: DashboardSchema, overrides: Partial<DashboardRecord> = {}): DashboardRecord {
  return {
    id: 'dashboard-1',
    name: 'Command Center',
    status: 'draft',
    draftSchema: schema,
    publishedSchema: null,
    updatedAt: DEFAULT_UPDATED_AT,
    ...overrides,
  }
}

function withoutRevision(record: DashboardRecord): DashboardRecord {
  const { updatedAt: _updatedAt, ...recordWithoutRevision } = record

  return recordWithoutRevision as DashboardRecord
}

describe('useDashboardDesignerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  test('resizes the canvas and scales existing components proportionally', () => {
    const store = useDashboardDesignerStore()
    const history = useDashboardHistoryStore()
    const positionedComponent: DashboardComponent = {
      ...component,
      layout: { x: 120, y: 90, width: 360, height: 180, zIndex: 1 },
    }

    store.addComponent(positionedComponent)
    const initialHistoryLength = history.past.length

    store.resizeCanvas({ width: 2560, height: 1440, scaleComponents: true })

    expect(store.schema.canvas.width).toBe(2560)
    expect(store.schema.canvas.height).toBe(1440)
    expect(store.schema.components[0]?.layout).toMatchObject({
      x: 160,
      y: 120,
      width: 480,
      height: 240,
    })
    expect(history.past.length).toBe(initialHistoryLength + 1)
  })

  test('resizes the canvas without scaling components when requested', () => {
    const store = useDashboardDesignerStore()
    store.addComponent(component)

    store.resizeCanvas({ width: 2560, height: 1440, scaleComponents: false })

    expect(store.schema.canvas).toMatchObject({ width: 2560, height: 1440 })
    expect(store.schema.components[0]?.layout).toMatchObject(component.layout)
  })

  test('preserves component aspect ratio for custom non-wide canvas scaling', () => {
    const store = useDashboardDesignerStore()
    const positionedComponent: DashboardComponent = {
      ...component,
      layout: { x: 120, y: 90, width: 360, height: 180, zIndex: 1 },
    }

    store.addComponent(positionedComponent)
    store.resizeCanvas({ width: 3000, height: 1200, scaleComponents: true })

    expect(store.schema.components[0]?.layout).toMatchObject({
      x: 188,
      y: 100,
      width: 400,
      height: 200,
    })
  })

  test('clamps canvas dimensions and component layouts when resizing', () => {
    const store = useDashboardDesignerStore()
    const oversizedComponent: DashboardComponent = {
      ...component,
      layout: { x: 1800, y: 950, width: 320, height: 180, zIndex: 1 },
    }

    store.addComponent(oversizedComponent)
    store.resizeCanvas({ width: 100, height: 100, scaleComponents: false })

    expect(store.schema.canvas).toMatchObject({ width: 320, height: 240 })
    expect(store.schema.components[0]?.layout).toMatchObject({ x: 0, y: 60, width: 320, height: 180 })
  })
  test('saveDraft preserves selected component and history', async () => {
    const store = useDashboardDesignerStore()
    const history = useDashboardHistoryStore()
    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-1' }))
    store.addComponent(component)
    const historyLength = history.past.length

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord(store.schema))
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(store.schema))

    await store.saveDraft()

    expect(store.selectedComponentId).toBe(component.id)
    expect(history.past).toHaveLength(historyLength)
  })

  test('blocks schema and name edits while saveDraft is in flight', async () => {
    const store = useDashboardDesignerStore()
    const createDeferredRecord = createDeferred<DashboardRecord>()
    store.dashboardName = 'Before Save'
    store.addComponent(component)

    vi.spyOn(bigScreenApi, 'createDashboard').mockReturnValue(createDeferredRecord.promise)
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(store.schema, { id: 'dashboard-created' }))

    const savePromise = store.saveDraft()
    expect(store.isSaving).toBe(true)

    store.setDashboardName('Edited During Save')
    store.addComponent({ ...component, id: 'component-2' })
    store.updateComponent(component.id, { layout: { x: 90 } })
    store.removeSelectedComponent()

    expect(store.dashboardName).toBe('Before Save')
    expect(store.schema.components).toHaveLength(1)
    expect(store.selectedComponent?.layout.x).toBe(0)

    createDeferredRecord.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-created', name: 'Before Save' }))
    await savePromise
  })

  test('ignores concurrent saveDraft calls while a create is in flight', async () => {
    const store = useDashboardDesignerStore()
    const createDeferredRecord = createDeferred<DashboardRecord>()
    const createSpy = vi.spyOn(bigScreenApi, 'createDashboard').mockReturnValue(createDeferredRecord.promise)
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(store.schema, { id: 'dashboard-created' }))

    const firstSave = store.saveDraft()
    const secondSave = store.saveDraft()

    expect(createSpy).toHaveBeenCalledOnce()

    createDeferredRecord.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-created' }))
    await Promise.all([firstSave, secondSave])
  })

  test('ignores stale existing dashboard save responses after the editor context changes', async () => {
    const store = useDashboardDesignerStore()
    const staleSave = createDeferred<DashboardRecord>()
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    store.dashboardName = 'Dashboard A edited'
    store.addComponent(component)

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(
      createRecord(store.schema, { id: 'dashboard-a', name: 'Dashboard A edited' }),
    )
    vi.spyOn(bigScreenApi, 'saveDraft').mockReturnValue(staleSave.promise)

    const savePromise = store.saveDraft()
    await flushAsyncWork()
    expect(store.isSaving).toBe(true)

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Fresh local draft')
    store.setDashboardName('Fresh local draft edited')
    store.addComponent(activeComponent)

    staleSave.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A edited' }))
    await savePromise

    expect(store.dashboardId).toBeNull()
    expect(store.dashboardName).toBe('Fresh local draft edited')
    expect(store.schema.components).toEqual([activeComponent])
    expect(store.selectedComponentId).toBe(activeComponent.id)
    expect(store.isSaving).toBe(false)
  })

  test('reuses a stale local create reservation for the next local save without overwriting the active draft', async () => {
    const store = useDashboardDesignerStore()
    const staleCreate = createDeferred<DashboardRecord>()
    const reservationId = store.localDraftReservationId
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.dashboardName = 'First local draft'
    store.addComponent(component)

    const createSpy = vi
      .spyOn(bigScreenApi, 'createDashboard')
      .mockReturnValueOnce(staleCreate.promise)
      .mockResolvedValueOnce(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Second local draft' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockImplementation(async (id, schema) => createRecord(schema, { id, name: 'Second local draft' }))

    const savePromise = store.saveDraft()
    expect(store.isSaving).toBe(true)
    expect(createSpy).toHaveBeenCalledWith({ name: 'First local draft', clientReservationId: reservationId })

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Second local draft')
    store.addComponent(activeComponent)

    staleCreate.resolve(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    await savePromise

    expect(saveSpy).not.toHaveBeenCalled()
    expect(store.dashboardId).toBeNull()
    expect(store.dashboardName).toBe('Second local draft')
    expect(store.schema.components).toEqual([activeComponent])
    expect(store.isSaving).toBe(false)

    await store.saveDraft()

    expect(createSpy).toHaveBeenCalledTimes(2)
    expect(createSpy).toHaveBeenLastCalledWith({ name: 'Second local draft', clientReservationId: reservationId })
    expect(updateSpy).toHaveBeenCalledWith(reservationId, {
      name: 'Second local draft',
      expectedUpdatedAt: DEFAULT_UPDATED_AT,
    })
    expect(saveSpy).toHaveBeenCalledWith(
      reservationId,
      expect.objectContaining({ components: [activeComponent] }),
      DEFAULT_UPDATED_AT,
    )
    expect(store.dashboardId).toBe(reservationId)
    expect(store.dashboardName).toBe('Second local draft')
  })

  test('uses the same local create reservation when a new local save starts before a stale create resolves', async () => {
    const store = useDashboardDesignerStore()
    const staleCreate = createDeferred<DashboardRecord>()
    const activeCreate = createDeferred<DashboardRecord>()
    const reservationId = store.localDraftReservationId
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.dashboardName = 'First local draft'
    const createSpy = vi
      .spyOn(bigScreenApi, 'createDashboard')
      .mockReturnValueOnce(staleCreate.promise)
      .mockReturnValueOnce(activeCreate.promise)
    vi.spyOn(bigScreenApi, 'saveDraft').mockImplementation(async (id, schema) =>
      createRecord(schema, { id, name: 'Second local draft' }),
    )

    const staleSavePromise = store.saveDraft()
    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Second local draft')
    store.addComponent(activeComponent)

    const activeSavePromise = store.saveDraft()

    expect(createSpy).toHaveBeenNthCalledWith(1, { name: 'First local draft', clientReservationId: reservationId })
    expect(createSpy).toHaveBeenCalledTimes(1)

    staleCreate.resolve(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    await staleSavePromise
    await flushAsyncWork()

    expect(createSpy).toHaveBeenNthCalledWith(2, { name: 'Second local draft', clientReservationId: reservationId })

    activeCreate.resolve(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Second local draft' }))
    await activeSavePromise

    expect(store.dashboardId).toBe(reservationId)
    expect(store.schema.components).toEqual([activeComponent])
  })

  test('reuses the reservation when a local create succeeds before its stale draft save resolves', async () => {
    const store = useDashboardDesignerStore()
    const staleDraftSave = createDeferred<DashboardRecord>()
    const reservationId = store.localDraftReservationId
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.dashboardName = 'First local draft'

    const createSpy = vi
      .spyOn(bigScreenApi, 'createDashboard')
      .mockResolvedValueOnce(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
      .mockResolvedValueOnce(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Second local draft' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockReturnValueOnce(staleDraftSave.promise)
      .mockImplementationOnce(async (id, schema) => createRecord(schema, { id, name: 'Second local draft' }))

    const staleSavePromise = store.saveDraft()
    await flushAsyncWork()

    expect(saveSpy).toHaveBeenCalledWith(reservationId, expect.any(Object), DEFAULT_UPDATED_AT)
    expect(store.dashboardId).toBe(reservationId)
    expect(store.localDraftReservationId).toBe(reservationId)

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Second local draft')
    store.addComponent(activeComponent)

    staleDraftSave.resolve(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    await staleSavePromise

    expect(store.dashboardId).toBeNull()
    expect(store.dashboardName).toBe('Second local draft')
    expect(store.schema.components).toEqual([activeComponent])

    await store.saveDraft()

    expect(createSpy).toHaveBeenCalledTimes(2)
    expect(createSpy).toHaveBeenLastCalledWith({ name: 'Second local draft', clientReservationId: reservationId })
    expect(updateSpy).toHaveBeenCalledWith(reservationId, {
      name: 'Second local draft',
      expectedUpdatedAt: DEFAULT_UPDATED_AT,
    })
    expect(saveSpy).toHaveBeenCalledWith(
      reservationId,
      expect.objectContaining({ components: [activeComponent] }),
      DEFAULT_UPDATED_AT,
    )
    expect(store.dashboardId).toBe(reservationId)
  })

  test('serializes stale reservation draft writes before a newer local save starts backend mutations', async () => {
    const store = useDashboardDesignerStore()
    const staleDraftSave = createDeferred<DashboardRecord>()
    const reservationId = store.localDraftReservationId
    const oldComponent = { ...component, id: 'component-old', name: 'Old metric' }
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.dashboardName = 'First local draft'
    store.addComponent(oldComponent)

    const createSpy = vi
      .spyOn(bigScreenApi, 'createDashboard')
      .mockResolvedValueOnce(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
      .mockResolvedValueOnce(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Second local draft' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockReturnValueOnce(staleDraftSave.promise)
      .mockImplementationOnce(async (id, schema) => createRecord(schema, { id, name: 'Second local draft' }))

    const staleSavePromise = store.saveDraft()
    await flushAsyncWork()
    expect(saveSpy).toHaveBeenCalledWith(
      reservationId,
      expect.objectContaining({ components: [oldComponent] }),
      DEFAULT_UPDATED_AT,
    )

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Second local draft')
    store.addComponent(activeComponent)

    const activeSavePromise = store.saveDraft()
    await flushAsyncWork()

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).not.toHaveBeenCalled()
    expect(saveSpy).toHaveBeenCalledTimes(1)

    staleDraftSave.resolve(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    await staleSavePromise
    await activeSavePromise

    expect(createSpy).toHaveBeenCalledTimes(2)
    expect(createSpy).toHaveBeenLastCalledWith({ name: 'Second local draft', clientReservationId: reservationId })
    expect(updateSpy).toHaveBeenCalledWith(reservationId, {
      name: 'Second local draft',
      expectedUpdatedAt: DEFAULT_UPDATED_AT,
    })
    expect(saveSpy).toHaveBeenCalledTimes(2)
    expect(saveSpy).toHaveBeenLastCalledWith(
      reservationId,
      expect.objectContaining({ components: [activeComponent] }),
      DEFAULT_UPDATED_AT,
    )
    expect(store.dashboardId).toBe(reservationId)
    expect(store.schema.components).toEqual([activeComponent])
  })

  test('does not start queued reservation backend mutations after the queued save becomes stale', async () => {
    const store = useDashboardDesignerStore()
    const staleDraftSave = createDeferred<DashboardRecord>()
    const reservationId = store.localDraftReservationId
    const oldComponent = { ...component, id: 'component-old', name: 'Old metric' }
    const thirdComponent = { ...component, id: 'component-third', name: 'Third metric' }

    store.dashboardName = 'First local draft'
    store.addComponent(oldComponent)

    const createSpy = vi
      .spyOn(bigScreenApi, 'createDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Ignored draft' }))
    const saveSpy = vi.spyOn(bigScreenApi, 'saveDraft').mockReturnValue(staleDraftSave.promise)

    const staleSavePromise = store.saveDraft()
    await flushAsyncWork()
    expect(saveSpy).toHaveBeenCalledTimes(1)

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Second local draft')
    const queuedSavePromise = store.saveDraft()
    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Third local draft')
    store.addComponent(thirdComponent)
    await flushAsyncWork()

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).not.toHaveBeenCalled()
    expect(saveSpy).toHaveBeenCalledTimes(1)

    staleDraftSave.resolve(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'First local draft' }))
    await staleSavePromise
    await queuedSavePromise

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).not.toHaveBeenCalled()
    expect(saveSpy).toHaveBeenCalledTimes(1)
    expect(store.dashboardId).toBeNull()
    expect(store.dashboardName).toBe('Third local draft')
    expect(store.schema.components).toEqual([thirdComponent])
  })

  test('serializes existing dashboard draft writes for the same dashboard id', async () => {
    const store = useDashboardDesignerStore()
    const staleDraftSave = createDeferred<DashboardRecord>()
    const oldComponent = { ...component, id: 'component-old', name: 'Old metric' }
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    store.addComponent(oldComponent)

    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockReturnValueOnce(staleDraftSave.promise)
      .mockImplementationOnce(async (id, schema) => createRecord(schema, { id, name: 'Dashboard A current' }))

    const staleSavePromise = store.saveDraft()
    await flushAsyncWork()

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(saveSpy).toHaveBeenCalledWith(
      'dashboard-a',
      expect.objectContaining({ components: [oldComponent] }),
      DEFAULT_UPDATED_AT,
    )

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    store.addComponent(activeComponent)

    const activeSavePromise = store.saveDraft()
    await flushAsyncWork()

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(saveSpy).toHaveBeenCalledTimes(1)

    staleDraftSave.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A stale' }))
    await staleSavePromise
    await activeSavePromise

    expect(updateSpy).toHaveBeenCalledTimes(2)
    expect(saveSpy).toHaveBeenCalledTimes(2)
    expect(saveSpy).toHaveBeenLastCalledWith(
      'dashboard-a',
      expect.objectContaining({ components: [activeComponent] }),
      DEFAULT_UPDATED_AT,
    )
    expect(store.dashboardId).toBe('dashboard-a')
    expect(store.schema.components).toEqual([activeComponent])
  })

  test('does not let stale save completion clear a newer active save', async () => {
    const store = useDashboardDesignerStore()
    const staleSave = createDeferred<DashboardRecord>()
    const currentCreate = createDeferred<DashboardRecord>()
    const currentSave = createDeferred<DashboardRecord>()
    const reservationId = store.localDraftReservationId
    const createSpy = vi.spyOn(bigScreenApi, 'createDashboard').mockReturnValue(currentCreate.promise)

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(
      createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }),
    )
    vi.spyOn(bigScreenApi, 'saveDraft').mockImplementation((id, schema) => {
      if (id === 'dashboard-a') return staleSave.promise
      if (id === 'dashboard-created') return currentSave.promise

      return Promise.resolve(createRecord(schema, { id }))
    })

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    const staleSavePromise = store.saveDraft()
    await flushAsyncWork()

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Current local draft')
    expect(store.isSaving).toBe(false)

    const currentSavePromise = store.saveDraft()
    expect(createSpy).toHaveBeenCalledWith({ name: 'Current local draft', clientReservationId: reservationId })
    expect(store.isSaving).toBe(true)

    staleSave.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A stale' }))
    await staleSavePromise

    expect(store.dashboardId).toBeNull()
    expect(store.dashboardName).toBe('Current local draft')
    expect(store.isSaving).toBe(true)

    currentCreate.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-created', name: 'Current local draft' }))
    await flushAsyncWork()
    currentSave.resolve(createRecord(store.schema, { id: 'dashboard-created', name: 'Current local draft' }))
    await currentSavePromise

    expect(store.dashboardId).toBe('dashboard-created')
    expect(store.isSaving).toBe(false)
  })

  test('saveDraft creates a backend dashboard for local drafts before saving schema', async () => {
    const store = useDashboardDesignerStore()
    const reservationId = store.localDraftReservationId
    store.dashboardName = 'Local Command'
    store.addComponent(component)

    const createSpy = vi.spyOn(bigScreenApi, 'createDashboard').mockResolvedValue(
      createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Local Command' }),
    )
    const saveSpy = vi.spyOn(bigScreenApi, 'saveDraft').mockImplementation(async (id, schema) =>
      createRecord(schema, { id, name: 'Local Command' }),
    )

    await store.saveDraft()

    expect(createSpy).toHaveBeenCalledWith({
      name: 'Local Command',
      clientReservationId: expect.stringMatching(/^local-draft-/),
    })
    expect(saveSpy).toHaveBeenCalledWith(
      reservationId,
      expect.objectContaining({ components: [component] }),
      DEFAULT_UPDATED_AT,
    )
    expect(store.dashboardId).toBe(reservationId)
    expect(store.dashboardName).toBe('Local Command')
    expect(store.dashboardStatus).toBe('draft')
    expect(store.selectedComponentId).toBe(component.id)
    expect(store.localDraftReservationId).not.toBe(reservationId)
  })

  test('retries failed local draft saves against the created dashboard id', async () => {
    const store = useDashboardDesignerStore()
    const reservationId = store.localDraftReservationId
    store.dashboardName = 'Retry Command'
    store.addComponent(component)

    const createSpy = vi
      .spyOn(bigScreenApi, 'createDashboard')
      .mockResolvedValue(createRecord(createDefaultDashboardSchema(), { id: reservationId, name: 'Retry Command' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockRejectedValueOnce(new Error('Draft failed'))
      .mockImplementation(async (id, schema) => createRecord(schema, { id, name: 'Retry Command' }))
    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(store.schema, { id: reservationId, name: 'Retry Command' }))

    await store.saveDraft()

    expect(store.dashboardId).toBe(reservationId)
    expect(store.error).toBe('Draft failed')
    expect(store.localDraftReservationId).toBe(reservationId)

    await store.saveDraft()

    expect(createSpy).toHaveBeenCalledOnce()
    expect(updateSpy).toHaveBeenCalledWith(reservationId, {
      name: 'Retry Command',
      expectedUpdatedAt: DEFAULT_UPDATED_AT,
    })
    expect(saveSpy).toHaveBeenCalledTimes(2)
    expect(store.error).toBeNull()
    expect(store.localDraftReservationId).not.toBe(reservationId)
  })

  test('saveDraft persists dashboard metadata before saving an existing draft', async () => {
    const store = useDashboardDesignerStore()
    store.replaceDashboardForLoad(createRecord(store.schema, { id: 'dashboard-1', name: 'Command Center' }))
    store.setDashboardName('Renamed Command')

    const updateSpy = vi
      .spyOn(bigScreenApi, 'updateDashboard')
      .mockResolvedValue(createRecord(store.schema, { name: 'Renamed Command' }))
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockResolvedValue(createRecord(store.schema, { name: 'Renamed Command', status: 'published' }))

    await store.saveDraft()

    expect(updateSpy).toHaveBeenCalledWith('dashboard-1', {
      name: 'Renamed Command',
      expectedUpdatedAt: DEFAULT_UPDATED_AT,
    })
    expect(saveSpy).toHaveBeenCalledWith('dashboard-1', store.schema, DEFAULT_UPDATED_AT)
    expect(store.dashboardName).toBe('Renamed Command')
    expect(store.dashboardStatus).toBe('published')
  })

  test('saveDraft reports an error when the saved draft response omits its revision', async () => {
    const store = useDashboardDesignerStore()
    store.replaceDashboardForLoad(createRecord(store.schema, { id: 'dashboard-1', name: 'Command Center' }))
    store.addComponent(component)

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord(store.schema, { id: 'dashboard-1' }))
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(withoutRevision(createRecord(store.schema, { id: 'dashboard-1' })))

    await store.saveDraft()

    expect(store.error).toBe(bigScreenText.common.errors.missingDashboardRevision)
    expect(store.hasUnsavedChanges).toBe(true)
    expect(store.isSaving).toBe(false)
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

  test('applyPreset pushes history, clears selection, marks schema dirty, and keeps the exported preset isolated', () => {
    const store = useDashboardDesignerStore()
    const history = useDashboardHistoryStore()
    const presetSnapshot = JSON.parse(JSON.stringify(aiOperationsPreset))

    store.addComponent(component)
    expect(store.selectedComponentId).toBe(component.id)

    store.applyPreset(aiOperationsPreset)

    expect(history.past).toHaveLength(2)
    expect(history.past.at(-1)?.components).toEqual([component])
    expect(store.selectedComponentId).toBeNull()
    expect(store.schema.components.map((presetComponent) => presetComponent.id)).toEqual(
      aiOperationsPreset.components.map((presetComponent) => presetComponent.id),
    )
    expect(store.hasUnsavedChanges).toBe(true)

    store.schema.components[0]!.props.text = 'Mutated in designer state'

    expect(aiOperationsPreset).toEqual(presetSnapshot)
  })

  test('applyPreset is ignored while the dashboard is loading or saving', () => {
    const store = useDashboardDesignerStore()

    store.isLoading = true
    store.applyPreset(aiOperationsPreset)
    expect(store.schema.components).toHaveLength(0)

    store.isLoading = false
    store.isSaving = true
    store.applyPreset(aiOperationsPreset)
    expect(store.schema.components).toHaveLength(0)
  })

  test('publish saves the current existing draft before publishing it', async () => {
    const store = useDashboardDesignerStore()
    const schema = createDefaultDashboardSchema()
    const updateSpy = vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(
      createRecord(schema, { id: 'dashboard-1', status: 'draft' }),
    )
    const saveSpy = vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(
      createRecord(schema, { id: 'dashboard-1', status: 'draft' }),
    )
    const publishedRecord = createRecord(schema, { id: 'dashboard-1', status: 'published' })
    const publishSpy = vi.spyOn(bigScreenApi, 'publish').mockResolvedValue(publishedRecord)

    store.replaceDashboardForLoad(createRecord(schema, { id: 'dashboard-1', status: 'draft' }))

    await store.publish()

    expect(updateSpy).toHaveBeenCalledWith('dashboard-1', {
      name: 'Command Center',
      expectedUpdatedAt: DEFAULT_UPDATED_AT,
    })
    expect(saveSpy).toHaveBeenCalledWith('dashboard-1', schema, DEFAULT_UPDATED_AT)
    expect(publishSpy).toHaveBeenCalledWith('dashboard-1')
    expect(store.dashboardStatus).toBe('published')
    expect(store.hasUnsavedChanges).toBe(false)
    expect(store.error).toBeNull()
    expect(store.isSaving).toBe(false)
    expect(store.activeSaveIntent).toBeNull()
  })

  test('publish saves dirty preset edits before publishing and keeps them in state', async () => {
    const store = useDashboardDesignerStore()
    const savedSchemas: DashboardSchema[] = []

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-1', status: 'draft' }))
    store.applyPreset(aiOperationsPreset)

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(
      createRecord(createDefaultDashboardSchema(), { id: 'dashboard-1', status: 'draft' }),
    )
    const saveSpy = vi.spyOn(bigScreenApi, 'saveDraft').mockImplementation(async (id, schema) => {
      savedSchemas.push(schema)
      return createRecord(schema, { id, status: 'draft' })
    })
    const publishSpy = vi.spyOn(bigScreenApi, 'publish').mockImplementation(async (id) =>
      createRecord(savedSchemas[0] ?? createDefaultDashboardSchema(), { id, status: 'published' }),
    )

    expect(store.hasUnsavedChanges).toBe(true)

    await store.publish()

    expect(saveSpy).toHaveBeenCalledWith(
      'dashboard-1',
      expect.objectContaining({ components: aiOperationsPreset.components }),
      DEFAULT_UPDATED_AT,
    )
    expect(publishSpy).toHaveBeenCalledWith('dashboard-1')
    expect(store.schema.components).toEqual(aiOperationsPreset.components)
    expect(store.dashboardStatus).toBe('published')
    expect(store.hasUnsavedChanges).toBe(false)
    expect(store.isSaving).toBe(false)
    expect(store.activeSaveIntent).toBeNull()
  })

  test('publish reports an error when the publish response omits its revision', async () => {
    const store = useDashboardDesignerStore()
    const schema = createDefaultDashboardSchema()
    store.replaceDashboardForLoad(createRecord(schema, { id: 'dashboard-1', status: 'draft' }))

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord(schema, { id: 'dashboard-1', status: 'draft' }))
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(schema, { id: 'dashboard-1', status: 'draft' }))
    vi.spyOn(bigScreenApi, 'publish').mockResolvedValue(
      withoutRevision(createRecord(schema, { id: 'dashboard-1', status: 'published' })),
    )

    await store.publish()

    expect(store.error).toBe(bigScreenText.common.errors.missingDashboardRevision)
    expect(store.dashboardStatus).toBe('draft')
    expect(store.isSaving).toBe(false)
    expect(store.activeSaveIntent).toBeNull()
  })

  test('publish creates a local draft before publishing the new dashboard id', async () => {
    const store = useDashboardDesignerStore()
    const reservationId = store.localDraftReservationId
    store.dashboardName = 'Local AI Ops'
    store.applyPreset(aiOperationsPreset)

    const createSpy = vi.spyOn(bigScreenApi, 'createDashboard').mockResolvedValue(
      createRecord(createDefaultDashboardSchema(), { id: 'dashboard-created', name: 'Local AI Ops' }),
    )
    vi.spyOn(bigScreenApi, 'saveDraft').mockImplementation(async (id, schema) =>
      createRecord(schema, { id, name: 'Local AI Ops', status: 'draft' }),
    )
    const publishSpy = vi.spyOn(bigScreenApi, 'publish').mockImplementation(async (id) =>
      createRecord(store.schema, { id, name: 'Local AI Ops', status: 'published' }),
    )

    await store.publish()

    expect(createSpy).toHaveBeenCalledWith({ name: 'Local AI Ops', clientReservationId: reservationId })
    expect(publishSpy).toHaveBeenCalledWith('dashboard-created')
    expect(store.dashboardId).toBe('dashboard-created')
    expect(store.dashboardStatus).toBe('published')
    expect(store.localDraftReservationId).not.toBe(reservationId)
    expect(store.isSaving).toBe(false)
  })

  test('publish reports errors without leaving saving state stuck', async () => {
    const store = useDashboardDesignerStore()
    const schema = createDefaultDashboardSchema()
    store.replaceDashboardForLoad(createRecord(schema, { id: 'dashboard-1' }))
    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord(schema, { id: 'dashboard-1' }))
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(schema, { id: 'dashboard-1' }))
    vi.spyOn(bigScreenApi, 'publish').mockRejectedValue(new Error('Publish failed'))

    await store.publish()

    expect(store.error).toBe('Publish failed')
    expect(store.isSaving).toBe(false)
    expect(store.activeSaveIntent).toBeNull()
  })

  test('ignores stale publish responses after the editor context changes', async () => {
    const store = useDashboardDesignerStore()
    const stalePublish = createDeferred<DashboardRecord>()
    const schema = createDefaultDashboardSchema()
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.replaceDashboardForLoad(createRecord(schema, { id: 'dashboard-a', name: 'Dashboard A' }))
    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(createRecord(schema, { id: 'dashboard-a', name: 'Dashboard A' }))
    vi.spyOn(bigScreenApi, 'saveDraft').mockResolvedValue(createRecord(schema, { id: 'dashboard-a', name: 'Dashboard A' }))
    vi.spyOn(bigScreenApi, 'publish').mockReturnValue(stalePublish.promise)

    const publishPromise = store.publish()
    await flushAsyncWork()
    expect(store.isSaving).toBe(true)

    store.replaceLocalDraft(createDefaultDashboardSchema(), 'Fresh local draft')
    store.addComponent(activeComponent)

    stalePublish.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', status: 'published' }))
    await publishPromise

    expect(store.dashboardId).toBeNull()
    expect(store.dashboardName).toBe('Fresh local draft')
    expect(store.schema.components).toEqual([activeComponent])
    expect(store.isSaving).toBe(false)
  })

  test('publish waits for pending same-dashboard draft writes before saving and publishing', async () => {
    const store = useDashboardDesignerStore()
    const staleDraftSave = createDeferred<DashboardRecord>()
    const oldComponent = { ...component, id: 'component-old', name: 'Old metric' }
    const activeComponent = { ...component, id: 'component-current', name: 'Current metric' }

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    store.addComponent(oldComponent)

    vi.spyOn(bigScreenApi, 'updateDashboard').mockResolvedValue(
      createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }),
    )
    const saveSpy = vi
      .spyOn(bigScreenApi, 'saveDraft')
      .mockReturnValueOnce(staleDraftSave.promise)
      .mockImplementationOnce(async (id, schema) => createRecord(schema, { id, name: 'Dashboard A' }))
    const publishSpy = vi
      .spyOn(bigScreenApi, 'publish')
      .mockImplementation(async (id) => createRecord(store.schema, { id, status: 'published' }))

    const staleSavePromise = store.saveDraft()
    await flushAsyncWork()
    expect(saveSpy).toHaveBeenCalledTimes(1)

    store.replaceDashboardForLoad(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A' }))
    store.addComponent(activeComponent)

    const publishPromise = store.publish()
    await flushAsyncWork()

    expect(saveSpy).toHaveBeenCalledTimes(1)
    expect(publishSpy).not.toHaveBeenCalled()

    staleDraftSave.resolve(createRecord(createDefaultDashboardSchema(), { id: 'dashboard-a', name: 'Dashboard A stale' }))
    await staleSavePromise
    await publishPromise

    expect(saveSpy).toHaveBeenCalledTimes(2)
    expect(saveSpy).toHaveBeenLastCalledWith(
      'dashboard-a',
      expect.objectContaining({ components: [activeComponent] }),
      DEFAULT_UPDATED_AT,
    )
    expect(publishSpy).toHaveBeenCalledWith('dashboard-a')
    expect(store.dashboardStatus).toBe('published')
    expect(store.schema.components).toEqual([activeComponent])
  })
})
