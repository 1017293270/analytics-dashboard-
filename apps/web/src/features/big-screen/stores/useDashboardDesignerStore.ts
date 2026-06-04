import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardHistoryStore } from './useDashboardHistoryStore'

type ComponentPatch = Partial<Omit<DashboardComponent, 'layout' | 'props' | 'style'>> & {
  layout?: Partial<DashboardComponent['layout']>
}

type SaveIntent = 'draft' | 'publish'

type DraftSaveResult = {
  saved: boolean
  dashboardId: string | null
  saveOperationVersion: number
  editorContextVersion: number
}

type DesignerState = {
  dashboardId: string | null
  dashboardName: string
  savedDashboardName: string
  dashboardStatus: DashboardRecord['status'] | null
  schema: DashboardSchema
  savedSchemaSignature: string
  selectedComponentId: string | null
  zoom: number
  isLoading: boolean
  isSaving: boolean
  editorContextVersion: number
  saveOperationVersion: number
  activeSaveOperationVersion: number | null
  activeSaveIntent: SaveIntent | null
  localDraftReservationId: string
  error: string | null
}

const DEFAULT_DASHBOARD_NAME = 'Untitled Dashboard'
const pendingDraftWritesByTarget = new Map<string, Promise<void>>()

function createLocalDraftReservationId() {
  return `local-draft-${nanoid()}`
}

function createDraftWriteBarrier(targetId: string) {
  const previousWrite = pendingDraftWritesByTarget.get(targetId) ?? null
  let releaseCurrentWrite!: () => void
  const currentWrite = new Promise<void>((resolve) => {
    releaseCurrentWrite = resolve
  })
  const queuedWrite = (previousWrite ?? Promise.resolve()).catch(() => undefined).then(() => currentWrite)

  pendingDraftWritesByTarget.set(targetId, queuedWrite)

  return {
    previousWrite,
    release() {
      releaseCurrentWrite()
      if (pendingDraftWritesByTarget.get(targetId) === queuedWrite) {
        pendingDraftWritesByTarget.delete(targetId)
      }
    },
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function cloneSchema(schema: DashboardSchema): DashboardSchema {
  return JSON.parse(JSON.stringify(schema)) as DashboardSchema
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nestedValue: unknown) => {
    if (nestedValue === null || Array.isArray(nestedValue) || typeof nestedValue !== 'object') {
      return nestedValue
    }

    return Object.keys(nestedValue)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = (nestedValue as Record<string, unknown>)[key]
        return sorted
      }, {})
  })
}

function hasComponent(schema: DashboardSchema, componentId: string | null) {
  return componentId !== null && schema.components.some((component) => component.id === componentId)
}

function getComponent(schema: DashboardSchema, componentId: string | null) {
  if (!componentId) return null

  return schema.components.find((component) => component.id === componentId) ?? null
}

function isComponentLocked(schema: DashboardSchema, componentId: string | null) {
  return getComponent(schema, componentId)?.layout.locked === true
}

function isLockOnlyPatch(patch: ComponentPatch) {
  const patchKeys = Object.keys(patch)
  const layoutKeys = patch.layout ? Object.keys(patch.layout) : []

  return patchKeys.length === 1 && patchKeys[0] === 'layout' && layoutKeys.length === 1 && layoutKeys[0] === 'locked'
}

export const useDashboardDesignerStore = defineStore('dashboard-designer', {
  state: (): DesignerState => ({
    dashboardId: null,
    dashboardName: DEFAULT_DASHBOARD_NAME,
    savedDashboardName: DEFAULT_DASHBOARD_NAME,
    dashboardStatus: null,
    schema: createDefaultDashboardSchema(),
    savedSchemaSignature: stableStringify(createDefaultDashboardSchema()),
    selectedComponentId: null,
    zoom: 1,
    isLoading: false,
    isSaving: false,
    editorContextVersion: 0,
    saveOperationVersion: 0,
    activeSaveOperationVersion: null,
    activeSaveIntent: null,
    localDraftReservationId: createLocalDraftReservationId(),
    error: null,
  }),
  getters: {
    selectedComponent(state): DashboardComponent | null {
      return state.schema.components.find((component) => component.id === state.selectedComponentId) ?? null
    },
    selectedComponentLocked(state): boolean {
      return isComponentLocked(state.schema, state.selectedComponentId)
    },
    isDashboardNameDirty(state): boolean {
      return state.dashboardName.trim() !== state.savedDashboardName
    },
    isSchemaDirty(state): boolean {
      return stableStringify(state.schema) !== state.savedSchemaSignature
    },
    hasUnsavedChanges(): boolean {
      return this.isDashboardNameDirty || this.isSchemaDirty
    },
  },
  actions: {
    invalidateInFlightSave() {
      this.editorContextVersion += 1
      this.activeSaveOperationVersion = null
      this.activeSaveIntent = null
      this.isSaving = false
    },
    replaceLocalDraft(schema: DashboardSchema = createDefaultDashboardSchema(), name = DEFAULT_DASHBOARD_NAME) {
      this.invalidateInFlightSave()
      this.dashboardId = null
      this.dashboardName = name
      this.savedDashboardName = name
      this.dashboardStatus = null
      this.schema = cloneSchema(schema)
      this.savedSchemaSignature = stableStringify(this.schema)
      this.selectedComponentId = null
      this.error = null
    },
    replaceDashboardForLoad(record: DashboardRecord) {
      const history = useDashboardHistoryStore()
      this.invalidateInFlightSave()
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.savedDashboardName = record.name
      this.dashboardStatus = record.status
      this.schema = cloneSchema(record.draftSchema)
      this.savedSchemaSignature = stableStringify(this.schema)
      this.selectedComponentId = null
      this.error = null
      history.past = []
      history.future = []
    },
    applySavedDashboard(record: DashboardRecord) {
      const selectedComponentId = this.selectedComponentId
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.savedDashboardName = record.name
      this.dashboardStatus = record.status
      this.schema = cloneSchema(record.draftSchema)
      this.savedSchemaSignature = stableStringify(this.schema)
      this.selectedComponentId = hasComponent(this.schema, selectedComponentId) ? selectedComponentId : null
      this.error = null
    },
    applyCreatedDashboardIdentity(record: DashboardRecord) {
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.savedDashboardName = record.name
      this.dashboardStatus = record.status
      this.error = null
    },
    rotateLocalDraftReservation() {
      this.localDraftReservationId = createLocalDraftReservationId()
    },
    setDashboardName(name: string) {
      if (this.isSaving) return

      this.dashboardName = name
    },
    async createDashboard(input: { name: string; description?: string } = { name: DEFAULT_DASHBOARD_NAME }) {
      this.invalidateInFlightSave()
      this.isLoading = true
      this.error = null

      try {
        const record = await bigScreenApi.createDashboard(input)
        this.replaceDashboardForLoad(record)
      } catch (error) {
        this.error = getErrorMessage(error)
      } finally {
        this.isLoading = false
      }
    },
    async loadDashboard(id: string) {
      this.invalidateInFlightSave()
      this.isLoading = true
      this.error = null

      try {
        const record = await bigScreenApi.getDashboard(id)
        this.replaceDashboardForLoad(record)
      } catch (error) {
        this.error = getErrorMessage(error)
      } finally {
        this.isLoading = false
      }
    },
    patchSchema(mutator: (draft: DashboardSchema) => void) {
      if (this.isSaving) return

      const history = useDashboardHistoryStore()
      const previous = cloneSchema(this.schema)
      const next = cloneSchema(this.schema)

      mutator(next)

      if (stableStringify(previous) === stableStringify(next)) {
        return
      }

      history.push(previous)
      this.schema = next
      if (!hasComponent(this.schema, this.selectedComponentId)) {
        this.selectedComponentId = null
      }
    },
    applyPreset(schema: DashboardSchema) {
      if (this.isLoading || this.isSaving) return

      const history = useDashboardHistoryStore()
      history.push(this.schema)
      this.schema = cloneSchema(schema)
      this.selectedComponentId = null
      this.error = null
    },
    addComponent(component: DashboardComponent) {
      if (this.isSaving) return

      this.patchSchema((draft) => {
        draft.components = [...draft.components, JSON.parse(JSON.stringify(component)) as DashboardComponent]
      })
      this.selectedComponentId = component.id
    },
    updateComponent(componentId: string, patch: ComponentPatch) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId) && !isLockOnlyPatch(patch)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) => {
          if (component.id !== componentId) return component
          return {
            ...component,
            ...patch,
            layout: patch.layout ? { ...component.layout, ...patch.layout } : component.layout,
          }
        })
      })
    },
    patchComponentProps(componentId: string, propsPatch: Record<string, unknown>) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) =>
          component.id === componentId ? { ...component, props: { ...component.props, ...propsPatch } } : component,
        )
      })
    },
    replaceComponentProps(componentId: string, props: Record<string, unknown>) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) =>
          component.id === componentId ? { ...component, props: { ...props } } : component,
        )
      })
    },
    patchComponentStyle(componentId: string, stylePatch: Record<string, unknown>) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) =>
          component.id === componentId ? { ...component, style: { ...component.style, ...stylePatch } } : component,
        )
      })
    },
    replaceComponentStyle(componentId: string, style: Record<string, unknown>) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) =>
          component.id === componentId ? { ...component, style: { ...style } } : component,
        )
      })
    },
    unsetComponentProp(componentId: string, key: string) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) => {
          if (component.id !== componentId) return component
          const { [key]: _removed, ...props } = component.props
          return { ...component, props }
        })
      })
    },
    unsetComponentStyle(componentId: string, key: string) {
      if (this.isSaving) return
      if (isComponentLocked(this.schema, componentId)) {
        return
      }

      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) => {
          if (component.id !== componentId) return component
          const { [key]: _removed, ...style } = component.style
          return { ...component, style }
        })
      })
    },
    removeSelectedComponent() {
      if (this.isSaving) return

      const componentId = this.selectedComponentId
      if (!componentId) return
      if (isComponentLocked(this.schema, componentId)) return

      this.patchSchema((draft) => {
        draft.components = draft.components.filter((component) => component.id !== componentId)
      })
      this.selectedComponentId = null
    },
    async saveCurrentDraft(
      saveIntent: SaveIntent,
      options: { keepSavingOnSuccess?: boolean } = {},
    ): Promise<DraftSaveResult> {
      if (this.isSaving) {
        return {
          saved: false,
          dashboardId: this.dashboardId,
          saveOperationVersion: this.saveOperationVersion,
          editorContextVersion: this.editorContextVersion,
        }
      }

      let savedDashboardId: string | null = null
      let didSave = false
      const saveOperationVersion = this.saveOperationVersion + 1
      const editorContextVersion = this.editorContextVersion
      const targetDashboardId = this.dashboardId ?? this.localDraftReservationId
      const draftWriteBarrier = createDraftWriteBarrier(targetDashboardId)
      const isCurrentSaveOperation = () =>
        this.activeSaveOperationVersion === saveOperationVersion && this.editorContextVersion === editorContextVersion
      const createFailedSaveResult = (): DraftSaveResult => ({
        saved: false,
        dashboardId: savedDashboardId,
        saveOperationVersion,
        editorContextVersion,
      })

      this.saveOperationVersion = saveOperationVersion
      this.activeSaveOperationVersion = saveOperationVersion
      this.activeSaveIntent = saveIntent
      this.isSaving = true
      this.error = null

      try {
        const schema = cloneSchema(this.schema)
        const name = this.dashboardName.trim() || DEFAULT_DASHBOARD_NAME
        const dashboardId = this.dashboardId

        if (draftWriteBarrier.previousWrite) {
          await draftWriteBarrier.previousWrite
          if (!isCurrentSaveOperation()) return createFailedSaveResult()
        }

        if (!dashboardId) {
          const created = await bigScreenApi.createDashboard({ name, clientReservationId: targetDashboardId })
          if (!isCurrentSaveOperation()) return createFailedSaveResult()

          const dashboard = created.name === name ? created : await bigScreenApi.updateDashboard(created.id, { name })
          if (!isCurrentSaveOperation()) return createFailedSaveResult()

          this.applyCreatedDashboardIdentity(dashboard)
          const saved = await bigScreenApi.saveDraft(dashboard.id, schema)
          if (!isCurrentSaveOperation()) return createFailedSaveResult()

          this.applySavedDashboard(saved)
          this.rotateLocalDraftReservation()
          savedDashboardId = saved.id
          didSave = true
          return {
            saved: true,
            dashboardId: savedDashboardId,
            saveOperationVersion,
            editorContextVersion,
          }
        }

        const shouldRotateReservationAfterSave = dashboardId === this.localDraftReservationId
        await bigScreenApi.updateDashboard(dashboardId, { name })
        if (!isCurrentSaveOperation()) return createFailedSaveResult()

        const record = await bigScreenApi.saveDraft(dashboardId, schema)
        if (!isCurrentSaveOperation()) return createFailedSaveResult()

        this.applySavedDashboard(record)
        if (shouldRotateReservationAfterSave) {
          this.rotateLocalDraftReservation()
        }
        savedDashboardId = record.id
        didSave = true
        return {
          saved: true,
          dashboardId: savedDashboardId,
          saveOperationVersion,
          editorContextVersion,
        }
      } catch (error) {
        if (isCurrentSaveOperation()) {
          this.error = getErrorMessage(error)
        }
      } finally {
        draftWriteBarrier.release()
        if (isCurrentSaveOperation()) {
          if (!options.keepSavingOnSuccess || !didSave) {
            this.activeSaveOperationVersion = null
            this.activeSaveIntent = null
            this.isSaving = false
          }
        }
      }

      return createFailedSaveResult()
    },
    async saveDraft() {
      await this.saveCurrentDraft('draft')
    },
    async publish() {
      if (this.isLoading || this.isSaving) return

      const saveResult = await this.saveCurrentDraft('publish', { keepSavingOnSuccess: true })
      const dashboardId = saveResult.dashboardId
      const isCurrentPublishOperation = () =>
        this.activeSaveOperationVersion === saveResult.saveOperationVersion &&
        this.editorContextVersion === saveResult.editorContextVersion &&
        this.dashboardId === dashboardId

      if (!saveResult.saved || !dashboardId || !isCurrentPublishOperation()) return

      try {
        const record = await bigScreenApi.publish(dashboardId)
        if (!isCurrentPublishOperation()) return

        this.applySavedDashboard(record)
      } catch (error) {
        if (isCurrentPublishOperation()) {
          this.error = getErrorMessage(error)
        }
      } finally {
        if (isCurrentPublishOperation()) {
          this.activeSaveOperationVersion = null
          this.activeSaveIntent = null
          this.isSaving = false
        }
      }
    },
    undo() {
      if (this.isSaving) return

      const history = useDashboardHistoryStore()
      const previous = history.undo(this.schema)
      if (!previous) return
      this.schema = previous
      if (!hasComponent(this.schema, this.selectedComponentId)) {
        this.selectedComponentId = null
      }
    },
    redo() {
      if (this.isSaving) return

      const history = useDashboardHistoryStore()
      const next = history.redo(this.schema)
      if (!next) return
      this.schema = next
      if (!hasComponent(this.schema, this.selectedComponentId)) {
        this.selectedComponentId = null
      }
    },
  },
})
