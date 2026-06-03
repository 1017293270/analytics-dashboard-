import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { defineStore } from 'pinia'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardHistoryStore } from './useDashboardHistoryStore'

type ComponentPatch = Partial<Omit<DashboardComponent, 'layout' | 'props' | 'style'>> & {
  layout?: Partial<DashboardComponent['layout']>
}

type DesignerState = {
  dashboardId: string | null
  dashboardName: string
  dashboardStatus: DashboardRecord['status'] | null
  schema: DashboardSchema
  selectedComponentId: string | null
  zoom: number
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const DEFAULT_DASHBOARD_NAME = 'Untitled Dashboard'

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
    dashboardStatus: null,
    schema: createDefaultDashboardSchema(),
    selectedComponentId: null,
    zoom: 1,
    isLoading: false,
    isSaving: false,
    error: null,
  }),
  getters: {
    selectedComponent(state): DashboardComponent | null {
      return state.schema.components.find((component) => component.id === state.selectedComponentId) ?? null
    },
    selectedComponentLocked(state): boolean {
      return isComponentLocked(state.schema, state.selectedComponentId)
    },
  },
  actions: {
    replaceDashboardForLoad(record: DashboardRecord) {
      const history = useDashboardHistoryStore()
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.dashboardStatus = record.status
      this.schema = cloneSchema(record.draftSchema)
      this.selectedComponentId = null
      this.error = null
      history.past = []
      history.future = []
    },
    applySavedDashboard(record: DashboardRecord) {
      const selectedComponentId = this.selectedComponentId
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.dashboardStatus = record.status
      this.schema = cloneSchema(record.draftSchema)
      this.selectedComponentId = hasComponent(this.schema, selectedComponentId) ? selectedComponentId : null
      this.error = null
    },
    async createDashboard(input: { name: string; description?: string } = { name: DEFAULT_DASHBOARD_NAME }) {
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
    addComponent(component: DashboardComponent) {
      this.patchSchema((draft) => {
        draft.components = [...draft.components, JSON.parse(JSON.stringify(component)) as DashboardComponent]
      })
      this.selectedComponentId = component.id
    },
    updateComponent(componentId: string, patch: ComponentPatch) {
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
      const componentId = this.selectedComponentId
      if (!componentId) return
      if (isComponentLocked(this.schema, componentId)) return

      this.patchSchema((draft) => {
        draft.components = draft.components.filter((component) => component.id !== componentId)
      })
      this.selectedComponentId = null
    },
    async saveDraft() {
      this.isSaving = true
      this.error = null

      try {
        const schema = cloneSchema(this.schema)
        const name = this.dashboardName.trim() || DEFAULT_DASHBOARD_NAME
        const dashboardId = this.dashboardId

        if (!dashboardId) {
          const created = await bigScreenApi.createDashboard({ name })
          const saved = await bigScreenApi.saveDraft(created.id, schema)
          this.applySavedDashboard(saved)
          return
        }

        await bigScreenApi.updateDashboard(dashboardId, { name })
        const record = await bigScreenApi.saveDraft(dashboardId, schema)
        this.applySavedDashboard(record)
      } catch (error) {
        this.error = getErrorMessage(error)
      } finally {
        this.isSaving = false
      }
    },
    undo() {
      const history = useDashboardHistoryStore()
      const previous = history.undo(this.schema)
      if (!previous) return
      this.schema = previous
      if (!hasComponent(this.schema, this.selectedComponentId)) {
        this.selectedComponentId = null
      }
    },
    redo() {
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
