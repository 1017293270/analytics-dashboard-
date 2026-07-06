import { dashboardSchemaValidator, type ComponentType, type DashboardComponent, type DashboardSchema, type DataBinding } from '@analytics/shared'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

export const DEFAULT_ACTOR_ID = 'demo-user'
export const DEFAULT_WORKSPACE_ID = 'demo-workspace'

export const defaultWorkbenchDashboards = [
  { id: 'dashboard-all', name: '全员工作台', description: '工作台配置演示态', roleCode: 'all-staff' },
  {
    id: 'dashboard-electro',
    name: '电教主任工作台',
    description: '工作台配置演示态',
    roleCode: 'electro-education-director',
  },
  {
    id: 'dashboard-moral',
    name: '德育主任工作台',
    description: '工作台配置演示态',
    roleCode: 'moral-education-director',
  },
  {
    id: 'dashboard-research',
    name: '教研主任工作台',
    description: '工作台配置演示态',
    roleCode: 'teaching-research-director',
  },
] as const

const defaultWorkbenchDashboardIds: ReadonlySet<string> = new Set(defaultWorkbenchDashboards.map((dashboard) => dashboard.id))
const defaultWorkbenchVisibleRolesById: ReadonlyMap<string, string[]> = new Map(
  defaultWorkbenchDashboards.map((dashboard) => [dashboard.id, [dashboard.roleCode]]),
)

type ChartType = Extract<ComponentType, 'line-chart' | 'area-chart' | 'bar-chart' | 'pie-chart' | 'radar-chart' | 'funnel-chart'>
type ComponentLayout = DashboardComponent['layout']
type ComponentStyle = DashboardComponent['style']

type MetricSpec = {
  id: string
  title: string
  metric: string
  suffix?: string
  precision?: number
  accentColor: string
}

type ChartSpec = {
  id: string
  type: ChartType
  title: string
  metric: string
  dimensions: 'date' | 'category'
  variant: string
  layout: ComponentLayout
  accentColor: string
}

type WorkbenchSchemaConfig = {
  title: string
  subtitle: string
  roleLabel: string
  metrics: MetricSpec[]
  charts: ChartSpec[]
  table: {
    id: string
    title: string
    metric: string
    layout: ComponentLayout
  }
}

const EDUCATION_THEME_COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#a78bfa', '#f43f5e']
const PANEL_STYLE: ComponentStyle = {
  backgroundColor: 'rgba(6, 30, 24, 0.9)',
  fontColor: '#dcfce7',
  borderColor: 'rgba(16, 185, 129, 0.28)',
}

function visibleLayout(layout: Omit<ComponentLayout, 'visible'>): ComponentLayout {
  return { ...layout, visible: true }
}


function mockBinding(id: string, query: DataBinding['query'], refreshSeconds = 30): DataBinding {
  return { id, sourceType: 'mock', query, refreshSeconds }
}

function textComponent(
  id: string,
  name: string,
  text: string,
  layout: ComponentLayout,
  style: ComponentStyle,
): DashboardComponent {
  return {
    id,
    type: 'text',
    name,
    layout,
    props: { text },
    style: { backgroundColor: 'transparent', ...style },
  }
}

function metricComponent(spec: MetricSpec, layout: ComponentLayout): DashboardComponent {
  return {
    id: `${spec.id}-card`,
    type: 'metric-card',
    name: spec.title,
    layout,
    props: {
      title: spec.title,
      valuePrefix: '',
      valueSuffix: spec.suffix ?? '',
      precision: spec.precision ?? 0,
    },
    style: {
      ...PANEL_STYLE,
      backgroundColor: 'rgba(4, 47, 46, 0.9)',
      accentColor: spec.accentColor,
    },
    dataBindingId: spec.id,
  }
}

function chartComponent(spec: ChartSpec): DashboardComponent {
  return {
    id: `${spec.id}-chart`,
    type: spec.type,
    name: spec.title,
    layout: spec.layout,
    props: {
      title: spec.title,
      chartType: spec.type.replace('-chart', ''),
      variant: spec.variant,
    },
    style: {
      ...PANEL_STYLE,
      accentColor: spec.accentColor,
      seriesColors: EDUCATION_THEME_COLORS,
    },
    dataBindingId: spec.id,
  }
}

function tableComponent(config: WorkbenchSchemaConfig['table']): DashboardComponent {
  return {
    id: `${config.id}-table`,
    type: 'table',
    name: config.title,
    layout: config.layout,
    props: { title: config.title },
    style: {
      ...PANEL_STYLE,
      backgroundColor: 'rgba(8, 37, 32, 0.92)',
      accentColor: '#38bdf8',
    },
    dataBindingId: config.id,
  }
}

function decorationComponent(id: string, layout: ComponentLayout): DashboardComponent {
  return {
    id,
    type: 'decoration',
    name: '演示边框',
    layout,
    props: { variant: 'frame' },
    style: {
      backgroundColor: 'rgba(16, 185, 129, 0.06)',
      borderColor: 'rgba(16, 185, 129, 0.42)',
      accentColor: '#10b981',
    },
  }
}

const metricLayouts: ComponentLayout[] = [
  visibleLayout({ x: 48, y: 160, width: 330, height: 164, zIndex: 10 }),
  visibleLayout({ x: 398, y: 160, width: 330, height: 164, zIndex: 11 }),
  visibleLayout({ x: 748, y: 160, width: 330, height: 164, zIndex: 12 }),
  visibleLayout({ x: 1098, y: 160, width: 330, height: 164, zIndex: 13 }),
]

const baseChartLayouts = {
  mainTrend: visibleLayout({ x: 48, y: 360, width: 840, height: 360, zIndex: 20 }),
  sideCategory: visibleLayout({ x: 928, y: 360, width: 430, height: 360, zIndex: 21 }),
  bottomChart: visibleLayout({ x: 48, y: 750, width: 560, height: 260, zIndex: 22 }),
  table: visibleLayout({ x: 648, y: 750, width: 710, height: 260, zIndex: 23 }),
  rightTable: visibleLayout({ x: 1438, y: 160, width: 430, height: 850, zIndex: 24 }),
}

const educationWorkbenchConfigs: Record<string, WorkbenchSchemaConfig> = {
  'dashboard-all': {
    title: '未来实验学校数据总览',
    subtitle: '设备、告警、应用与课堂活动运行态 · 演示数据 2026-07-09',
    roleLabel: '全员工作台',
    metrics: [
      { id: 'all-device-online-rate', title: '设备在线率', metric: 'school_device_online_rate', suffix: '%', precision: 1, accentColor: '#10b981' },
      { id: 'all-today-alarms', title: '今日告警', metric: 'school_today_alarms', suffix: '条', accentColor: '#f59e0b' },
      { id: 'all-app-launches', title: '应用启动', metric: 'application_launches_today', suffix: '次', accentColor: '#38bdf8' },
      { id: 'all-active-rooms', title: '互动课堂', metric: 'blackboard_active_rooms', suffix: '间', accentColor: '#a78bfa' },
    ],
    charts: [
      { id: 'all-usage-trend', type: 'area-chart', title: '应用使用趋势', metric: 'application_usage_trend', dimensions: 'date', variant: 'area-soft', layout: baseChartLayouts.mainTrend, accentColor: '#10b981' },
      { id: 'all-platform-usage', type: 'pie-chart', title: '应用类型占比', metric: 'application_platform_usage', dimensions: 'category', variant: 'pie-donut', layout: baseChartLayouts.sideCategory, accentColor: '#38bdf8' },
      { id: 'all-class-rank', type: 'bar-chart', title: '班级活动排行', metric: 'class_activity_rank', dimensions: 'category', variant: 'bar-horizontal', layout: baseChartLayouts.bottomChart, accentColor: '#f59e0b' },
    ],
    table: { id: 'all-application-table', title: '应用使用明细', metric: 'application_usage_detail', layout: baseChartLayouts.table },
  },
  'dashboard-electro': {
    title: '电教主任设备运维工作台',
    subtitle: '一体机、智慧黑板、录播与告警处置状态 · 演示数据 2026-07-09',
    roleLabel: '电教主任工作台',
    metrics: [
      { id: 'electro-online-devices', title: '在线设备', metric: 'school_online_devices', suffix: '台', accentColor: '#10b981' },
      { id: 'electro-unresolved-alarms', title: '未处理告警', metric: 'school_unresolved_alarms', suffix: '条', accentColor: '#f43f5e' },
      { id: 'electro-repair-rate', title: '维修完成率', metric: 'repair_completion_rate', suffix: '%', precision: 1, accentColor: '#38bdf8' },
      { id: 'electro-active-rooms', title: '互动课堂', metric: 'blackboard_active_rooms', suffix: '间', accentColor: '#a78bfa' },
    ],
    charts: [
      { id: 'electro-online-trend', type: 'line-chart', title: '设备在线趋势', metric: 'device_online_trend', dimensions: 'date', variant: 'line-smooth', layout: baseChartLayouts.mainTrend, accentColor: '#10b981' },
      { id: 'electro-type-status', type: 'bar-chart', title: '设备类型分布', metric: 'device_type_status', dimensions: 'category', variant: 'bar-vertical', layout: baseChartLayouts.sideCategory, accentColor: '#38bdf8' },
      { id: 'electro-repair-funnel', type: 'funnel-chart', title: '维修处置漏斗', metric: 'repair_process_funnel', dimensions: 'category', variant: 'funnel-pipeline', layout: baseChartLayouts.bottomChart, accentColor: '#f59e0b' },
    ],
    table: { id: 'electro-repair-table', title: '设备维修工单', metric: 'device_repair_orders', layout: baseChartLayouts.table },
  },
  'dashboard-moral': {
    title: '德育主任学生成长工作台',
    subtitle: '学生成长、德育活动、班级参与与事件跟进 · 演示数据 2026-07-09',
    roleLabel: '德育主任工作台',
    metrics: [
      { id: 'moral-growth-index', title: '学生成长指数', metric: 'student_growth_index', precision: 1, accentColor: '#10b981' },
      { id: 'moral-coverage', title: '活动覆盖率', metric: 'moral_activity_coverage', suffix: '%', precision: 1, accentColor: '#38bdf8' },
      { id: 'moral-activity-count', title: '课堂活动数', metric: 'teaching_activity_count', suffix: '场', accentColor: '#f59e0b' },
      { id: 'moral-today-alarms', title: '待关注事件', metric: 'school_unresolved_alarms', suffix: '条', accentColor: '#f43f5e' },
    ],
    charts: [
      { id: 'moral-activity-trend', type: 'area-chart', title: '学生参与趋势', metric: 'student_activity_trend', dimensions: 'date', variant: 'area-soft', layout: baseChartLayouts.mainTrend, accentColor: '#10b981' },
      { id: 'moral-growth-profile', type: 'radar-chart', title: '学生成长画像', metric: 'student_growth_profile', dimensions: 'category', variant: 'radar-filled', layout: baseChartLayouts.sideCategory, accentColor: '#a78bfa' },
      { id: 'moral-class-rank', type: 'bar-chart', title: '班级活动排行', metric: 'class_activity_rank', dimensions: 'category', variant: 'bar-horizontal', layout: baseChartLayouts.bottomChart, accentColor: '#f59e0b' },
    ],
    table: { id: 'moral-class-table', title: '德育活动明细', metric: 'class_activity_detail', layout: baseChartLayouts.table },
  },
  'dashboard-research': {
    title: '教研主任教师发展工作台',
    subtitle: '教师发展、教研任务、课堂活动与资源建设 · 演示数据 2026-07-09',
    roleLabel: '教研主任工作台',
    metrics: [
      { id: 'research-teacher-index', title: '教师发展指数', metric: 'teacher_development_index', precision: 1, accentColor: '#10b981' },
      { id: 'research-task-count', title: '教研任务', metric: 'teacher_research_task_count', suffix: '项', accentColor: '#38bdf8' },
      { id: 'research-activity-count', title: '课堂活动数', metric: 'teaching_activity_count', suffix: '场', accentColor: '#f59e0b' },
      { id: 'research-app-launches', title: '资源应用启动', metric: 'application_launches_today', suffix: '次', accentColor: '#a78bfa' },
    ],
    charts: [
      { id: 'research-task-trend', type: 'line-chart', title: '教研任务趋势', metric: 'teacher_research_trend', dimensions: 'date', variant: 'line-smooth', layout: baseChartLayouts.mainTrend, accentColor: '#10b981' },
      { id: 'research-capability', type: 'radar-chart', title: '教师能力画像', metric: 'teacher_capability_profile', dimensions: 'category', variant: 'radar-filled', layout: baseChartLayouts.sideCategory, accentColor: '#a78bfa' },
      { id: 'research-activity-mix', type: 'pie-chart', title: '课堂活动类型', metric: 'teaching_activity_type_mix', dimensions: 'category', variant: 'pie-rose', layout: baseChartLayouts.bottomChart, accentColor: '#f59e0b' },
    ],
    table: { id: 'research-task-table', title: '教研任务明细', metric: 'teacher_research_task_detail', layout: baseChartLayouts.table },
  },
}

export type WorkbenchAvailability = 'enabled' | 'disabled'

export type SerializedWorkbenchSetting = {
  dashboardId: string
  visibleRoles: string[]
  availability: WorkbenchAvailability
  createdAt?: Date
  updatedAt?: Date
}

export function createDefaultSchema(): DashboardSchema {
  return {
    version: '1.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: { type: 'color', value: '#0b1220' },
      scaleMode: 'fit-screen',
    },
    theme: {
      name: 'Command Center',
      colors: ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'],
      fontFamily: 'Inter',
    },
    components: [],
    dataBindings: {},
    refresh: { mode: 'manual' },
  }
}

export function shouldUpgradeDefaultWorkbenchSchema(schema: DashboardSchema): boolean {
  return JSON.stringify(schema) === JSON.stringify(createDefaultSchema())
}

export function createEducationWorkbenchSchema(id: string): DashboardSchema {
  const config = educationWorkbenchConfigs[id] ?? educationWorkbenchConfigs['dashboard-all']
  const dataBindings: DashboardSchema['dataBindings'] = {}

  for (const metric of config.metrics) {
    dataBindings[metric.id] = mockBinding(metric.id, { metrics: [metric.metric] })
  }

  for (const chart of config.charts) {
    dataBindings[chart.id] = mockBinding(chart.id, { dimensions: [chart.dimensions], metrics: [chart.metric] }, 45)
  }

  dataBindings[config.table.id] = mockBinding(
    config.table.id,
    { dimensions: ['table'], metrics: [config.table.metric], limit: 8 },
    45,
  )

  const components: DashboardComponent[] = [
    textComponent(
      `${id}-title`,
      '工作台标题',
      config.title,
      visibleLayout({ x: 48, y: 32, width: 920, height: 72, zIndex: 1, locked: true }),
      { fontColor: '#f0fdf4', fontSize: 42, fontWeight: 800 },
    ),
    textComponent(
      `${id}-subtitle`,
      '工作台说明',
      config.subtitle,
      visibleLayout({ x: 52, y: 100, width: 1040, height: 40, zIndex: 2, locked: true }),
      { fontColor: '#a7f3d0', fontSize: 18, fontWeight: 600 },
    ),

    ...config.metrics.map((metric, index) => metricComponent(metric, metricLayouts[index])),
    ...config.charts.map(chartComponent),
    tableComponent(config.table),
    decorationComponent(`${id}-bottom-rule`, visibleLayout({ x: 48, y: 1028, width: 1820, height: 28, zIndex: 30, locked: true })),
  ]

  return {
    version: '1.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: { type: 'color', value: '#061812' },
      scaleMode: 'fit-screen',
    },
    theme: {
      name: `${config.roleLabel} · 智慧教育`,
      colors: EDUCATION_THEME_COLORS,
      fontFamily: 'Inter',
    },
    refresh: { mode: 'interval', intervalSeconds: 30 },
    dataBindings,
    components,
  }
}

function isDefaultWorkbenchRoleBadge(component: DashboardComponent, dashboardId: string) {
  return component.id === `${dashboardId}-role-chip` && component.type === 'text'
}

export function normalizeDefaultWorkbenchRoleBadge(schema: DashboardSchema, dashboardId: string): DashboardSchema | null {
  if (!isDefaultWorkbenchDashboardId(dashboardId)) return null

  const components = schema.components.filter((component) => !isDefaultWorkbenchRoleBadge(component, dashboardId))

  return components.length === schema.components.length ? null : { ...schema, components }
}

export function isDefaultWorkbenchDashboardId(id: string) {
  return defaultWorkbenchDashboardIds.has(id)
}

export function getDefaultWorkbenchVisibleRoles(id: string) {
  return defaultWorkbenchVisibleRolesById.get(id) ?? []
}

export function parseWorkbenchVisibleRoles(value: string | null | undefined): string[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
  } catch {
    return []
  }
}

export function serializeWorkbenchSetting(
  setting: {
    dashboardId: string
    visibleRoles: string
    availability: string
    createdAt?: Date
    updatedAt?: Date
  } | null,
  fallback: { dashboardId: string; visibleRoles?: string[] } = { dashboardId: '', visibleRoles: [] },
): SerializedWorkbenchSetting {
  const visibleRoles = parseWorkbenchVisibleRoles(setting?.visibleRoles)

  return {
    dashboardId: setting?.dashboardId ?? fallback.dashboardId,
    visibleRoles: visibleRoles.length > 0 ? visibleRoles : [...(fallback.visibleRoles ?? [])],
    availability: setting?.availability === 'disabled' ? 'disabled' : 'enabled',
    createdAt: setting?.createdAt,
    updatedAt: setting?.updatedAt,
  }
}

export class StoredSchemaError extends Error {
  constructor() {
    super('Stored dashboard schema is invalid')
    this.name = 'StoredSchemaError'
  }
}

export function parseSchema(value: string): DashboardSchema {
  try {
    const parsedJson: unknown = JSON.parse(value)
    const schema = dashboardSchemaValidator.safeParse(parsedJson)
    if (!schema.success) throw new StoredSchemaError()
    return schema.data
  } catch (error) {
    if (error instanceof StoredSchemaError) throw error
    throw new StoredSchemaError()
  }
}

export async function createDashboard(input: { name: string; description?: string; id?: string; actorId: string }) {
  const schema = createDefaultSchema()
  const dashboard = await prisma.dashboard.create({
    data: {
      id: input.id ?? nanoid(),
      name: input.name,
      description: input.description ?? null,
      ownerId: input.actorId,
      workspaceId: DEFAULT_WORKSPACE_ID,
      status: 'draft',
      draftSchema: JSON.stringify(schema),
      permissions: {
        create: { id: nanoid(), subjectType: 'user', subjectId: input.actorId, permission: 'owner' },
      },
    },
  })

  return { ...dashboard, draftSchema: schema, publishedSchema: null }
}

async function ensureDefaultDashboardPermission(dashboardId: string) {
  const existingPermission = await prisma.dashboardPermission.findFirst({
    where: {
      dashboardId,
      subjectType: 'user',
      subjectId: DEFAULT_ACTOR_ID,
      permission: 'owner',
    },
  })

  if (existingPermission) return

  await prisma.dashboardPermission.upsert({
    where: { id: `permission-${dashboardId}-owner` },
    update: {
      dashboardId,
      subjectType: 'user',
      subjectId: DEFAULT_ACTOR_ID,
      permission: 'owner',
    },
    create: {
      id: `permission-${dashboardId}-owner`,
      dashboardId,
      subjectType: 'user',
      subjectId: DEFAULT_ACTOR_ID,
      permission: 'owner',
    },
  })
}

async function ensureDefaultDashboardRolePermission(dashboardId: string, roleCode: string) {
  await prisma.dashboardPermission.upsert({
    where: { id: `permission-${dashboardId}-role-${roleCode}` },
    update: {
      dashboardId,
      subjectType: 'role',
      subjectId: roleCode,
      permission: 'view',
    },
    create: {
      id: `permission-${dashboardId}-role-${roleCode}`,
      dashboardId,
      subjectType: 'role',
      subjectId: roleCode,
      permission: 'view',
    },
  })
}

async function ensureDefaultWorkbenchSetting(dashboardId: string, roleCode: string) {
  await prisma.workbenchSetting.upsert({
    where: { dashboardId },
    update: {},
    create: {
      dashboardId,
      visibleRoles: JSON.stringify([roleCode]),
      availability: 'enabled',
    },
  })
}

export async function ensureDefaultWorkbenchDashboards() {
  const existingDashboards = await prisma.dashboard.findMany({
    where: { id: { in: [...defaultWorkbenchDashboardIds] } },
    select: { id: true, workspaceId: true, status: true, draftSchema: true, publishedSchema: true },
  })
  const existingById = new Map(existingDashboards.map((dashboard) => [dashboard.id, dashboard]))

  for (const preset of defaultWorkbenchDashboards) {
    const existingDashboard = existingById.get(preset.id)
    const educationSchema = JSON.stringify(createEducationWorkbenchSchema(preset.id))

    if (!existingDashboard) {
      await prisma.dashboard.create({
        data: {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          ownerId: DEFAULT_ACTOR_ID,
          workspaceId: DEFAULT_WORKSPACE_ID,
          status: 'draft',
          draftSchema: educationSchema,
        },
      })
    } else if (existingDashboard.workspaceId !== DEFAULT_WORKSPACE_ID || existingDashboard.status === 'archived') {
      await prisma.dashboard.update({
        where: { id: preset.id },
        data: {
          name: preset.name,
          description: preset.description,
          ownerId: DEFAULT_ACTOR_ID,
          workspaceId: DEFAULT_WORKSPACE_ID,
          status: 'draft',
          draftSchema: educationSchema,
          publishedSchema: null,
          publishedAt: null,
        },
      })
    } else {
      const existingDraftSchema = parseSchema(existingDashboard.draftSchema)
      const normalizedDraftSchema = normalizeDefaultWorkbenchRoleBadge(existingDraftSchema, preset.id)
      const existingPublishedSchema = existingDashboard.publishedSchema
        ? parseSchema(existingDashboard.publishedSchema)
        : null
      const normalizedPublishedSchema = existingPublishedSchema
        ? normalizeDefaultWorkbenchRoleBadge(existingPublishedSchema, preset.id)
        : null

      if (normalizedDraftSchema || normalizedPublishedSchema) {
        await prisma.dashboard.update({
          where: { id: preset.id },
          data: {
            draftSchema: JSON.stringify(normalizedDraftSchema ?? existingDraftSchema),
            publishedSchema: existingPublishedSchema
              ? JSON.stringify(normalizedPublishedSchema ?? existingPublishedSchema)
              : null,
          },
        })
      } else if (shouldUpgradeDefaultWorkbenchSchema(existingDraftSchema)) {
        await prisma.dashboard.update({
          where: { id: preset.id },
          data: existingDashboard.status === 'published'
            ? {
                draftSchema: educationSchema,
                publishedSchema: educationSchema,
              }
            : {
                status: 'draft',
                draftSchema: educationSchema,
                publishedSchema: null,
                publishedAt: null,
              },
        })
      }
    }

    await ensureDefaultDashboardPermission(preset.id)
    await ensureDefaultDashboardRolePermission(preset.id, preset.roleCode)
    await ensureDefaultWorkbenchSetting(preset.id, preset.roleCode)
  }
}

export async function getDashboard(id: string) {
  const dashboard = await prisma.dashboard.findUnique({ where: { id } })
  if (!dashboard) return null
  return {
    ...dashboard,
    draftSchema: parseSchema(dashboard.draftSchema),
    publishedSchema: dashboard.publishedSchema ? parseSchema(dashboard.publishedSchema) : null,
  }
}
