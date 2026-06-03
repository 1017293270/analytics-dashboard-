import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { defineStore } from 'pinia'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardHistoryStore } from './useDashboardHistoryStore'

type ComponentPatch = Partial<Omit<DashboardComponent, 'layout' | 'props' | 'style'>> & {
  layout?: Partial<DashboardComponent['layout']>
  props?: Record<string, unknown>
  style?: Record<string, unknown>
}

type DesignerState = {
  dashboardId: string | null
  dashboardName: string
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

function hasComponent(schema: DashboardSchema, componentId: string | null) {
  return componentId !== null && schema.components.some((component) => component.id === componentId)
}

export const useDashboardDesignerStore = defineStore('dashboard-designer', {
  state: (): DesignerState => ({
    dashboardId: null,
    dashboardName: DEFAULT_DASHBOARD_NAME,
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
  },
  actions: {
    applyDashboard(record: DashboardRecord) {
      const history = useDashboardHistoryStore()
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.schema = structuredClone(record.draftSchema)
      this.selectedComponentId = null
      this.error = null
      history.past = []
      history.future = []
    },
    async createDashboard(input: { name: string; description?: string } = { name: DEFAULT_DASHBOARD_NAME }) {
      this.isLoading = true
      this.error = null

      try {
        const record = await bigScreenApi.createDashboard(input)
        this.applyDashboard(record)
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
        this.applyDashboard(record)
      } catch (error) {
        this.error = getErrorMessage(error)
      } finally {
        this.isLoading = false
      }
    },
    patchSchema(mutator: (draft: DashboardSchema) => void) {
      const history = useDashboardHistoryStore()
      const previous = structuredClone(this.schema)
      const next = structuredClone(this.schema)

      mutator(next)

      history.push(previous)
      this.schema = next
      if (!hasComponent(this.schema, this.selectedComponentId)) {
        this.selectedComponentId = null
      }
    },
    addComponent(component: DashboardComponent) {
      this.patchSchema((draft) => {
        draft.components = [...draft.components, structuredClone(component)]
      })
      this.selectedComponentId = component.id
    },
    updateComponent(componentId: string, patch: ComponentPatch) {
      this.patchSchema((draft) => {
        draft.components = draft.components.map((component) => {
          if (component.id !== componentId) return component
          return {
            ...component,
            ...patch,
            layout: patch.layout ? { ...component.layout, ...patch.layout } : component.layout,
            props: patch.props ? { ...component.props, ...patch.props } : component.props,
            style: patch.style ? { ...component.style, ...patch.style } : component.style,
          }
        })
      })
    },
    removeSelectedComponent() {
      const componentId = this.selectedComponentId
      if (!componentId) return

      this.patchSchema((draft) => {
        draft.components = draft.components.filter((component) => component.id !== componentId)
      })
      this.selectedComponentId = null
    },
    async saveDraft() {
      if (!this.dashboardId) {
        this.error = 'Create or load a dashboard before saving'
        return
      }

      this.isSaving = true
      this.error = null

      try {
        const record = await bigScreenApi.saveDraft(this.dashboardId, this.schema)
        this.applyDashboard(record)
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
