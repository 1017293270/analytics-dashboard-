import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { clampLayout } from '../designer/designerLayout'

const TARGET_CANVAS = { width: 2560, height: 1440 }
const DEFAULT_WORKBENCH_IDS = [
  'dashboard-all',
  'dashboard-electro',
  'dashboard-moral',
  'dashboard-research',
]

const DEFAULT_WORKBENCH_COMPONENT_IDS: Record<string, { metrics: string[]; charts: string[]; table: string }> = {
  'dashboard-all': {
    metrics: ['all-device-online-rate', 'all-today-alarms', 'all-app-launches', 'all-active-rooms'],
    charts: ['all-usage-trend', 'all-platform-usage', 'all-class-rank'],
    table: 'all-application-table',
  },
  'dashboard-electro': {
    metrics: ['electro-online-devices', 'electro-unresolved-alarms', 'electro-repair-rate', 'electro-active-rooms'],
    charts: ['electro-online-trend', 'electro-type-status', 'electro-repair-funnel'],
    table: 'electro-repair-table',
  },
  'dashboard-moral': {
    metrics: ['moral-growth-index', 'moral-coverage', 'moral-activity-count', 'moral-today-alarms'],
    charts: ['moral-activity-trend', 'moral-growth-profile', 'moral-class-rank'],
    table: 'moral-class-table',
  },
  'dashboard-research': {
    metrics: ['research-teacher-index', 'research-task-count', 'research-activity-count', 'research-app-launches'],
    charts: ['research-task-trend', 'research-capability', 'research-activity-mix'],
    table: 'research-task-table',
  },
}

const METRIC_LAYOUTS: Array<Partial<DashboardComponent['layout']>> = [
  { x: 64, y: 220, width: 560, height: 190 },
  { x: 672, y: 220, width: 560, height: 190 },
  { x: 1280, y: 220, width: 560, height: 190 },
  { x: 1888, y: 220, width: 560, height: 190 },
]

const CHART_LAYOUTS: Array<Partial<DashboardComponent['layout']>> = [
  { x: 64, y: 460, width: 1160, height: 430 },
  { x: 1280, y: 460, width: 1216, height: 430 },
  { x: 64, y: 940, width: 760, height: 360 },
]

const TABLE_LAYOUT: Partial<DashboardComponent['layout']> = { x: 880, y: 940, width: 1616, height: 360 }

type SlotKind = 'metric' | 'chart' | 'table'

const SLOT_SUFFIX_BY_KIND: Record<SlotKind, string> = {
  metric: 'card',
  chart: 'chart',
  table: 'table',
}

function getDefaultWorkbenchId(dashboardId: string | null | undefined) {
  return DEFAULT_WORKBENCH_IDS.find((id) => id === dashboardId) ?? null
}

function matchesSlotId(componentId: string, slotId: string, kind: SlotKind) {
  return componentId === slotId || componentId === `${slotId}-${SLOT_SUFFIX_BY_KIND[kind]}`
}

function withLayout(
  component: DashboardComponent,
  layoutPatch: Partial<DashboardComponent['layout']>,
  canvas: DashboardSchema['canvas'],
): DashboardComponent {
  return {
    ...component,
    layout: clampLayout({ ...component.layout, ...layoutPatch }, canvas),
  }
}

export function applyEducationWorkbench2kLayout(
  components: DashboardComponent[],
  canvas: DashboardSchema['canvas'],
  dashboardId?: string | null,
): DashboardComponent[] | null {
  if (canvas.width !== TARGET_CANVAS.width || canvas.height !== TARGET_CANVAS.height) return null

  const workbenchId = getDefaultWorkbenchId(dashboardId)
  if (!workbenchId) return null

  const componentSlots = DEFAULT_WORKBENCH_COMPONENT_IDS[workbenchId]

  return components.map((component) => {
    if (component.id === `${workbenchId}-title`) {
      return withLayout(component, { x: 64, y: 48, width: 1500, height: 88 }, canvas)
    }

    if (component.id === `${workbenchId}-subtitle`) {
      return withLayout(component, { x: 68, y: 132, width: 1600, height: 44 }, canvas)
    }

    if (component.id === `${workbenchId}-bottom-rule`) {
      return withLayout(component, { x: 64, y: 1376, width: 2432, height: 32 }, canvas)
    }

    const metricIndex = componentSlots.metrics.findIndex((slotId) => matchesSlotId(component.id, slotId, 'metric'))
    if (metricIndex >= 0 && metricIndex < METRIC_LAYOUTS.length) {
      return withLayout(component, METRIC_LAYOUTS[metricIndex], canvas)
    }

    const chartIndex = componentSlots.charts.findIndex((slotId) => matchesSlotId(component.id, slotId, 'chart'))
    if (chartIndex >= 0 && chartIndex < CHART_LAYOUTS.length) {
      return withLayout(component, CHART_LAYOUTS[chartIndex], canvas)
    }

    if (matchesSlotId(component.id, componentSlots.table, 'table')) {
      return withLayout(component, TABLE_LAYOUT, canvas)
    }

    return component
  })
}

export function normalizeEducationWorkbench2kSchema(
  schema: DashboardSchema,
  dashboardId?: string | null,
): DashboardSchema {
  const components = applyEducationWorkbench2kLayout(schema.components, schema.canvas, dashboardId)
  if (!components) return schema

  return {
    ...schema,
    components,
  }
}
