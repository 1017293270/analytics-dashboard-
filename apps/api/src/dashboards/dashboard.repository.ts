import { dashboardSchemaValidator, type DashboardSchema } from '@analytics/shared'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

export const DEFAULT_ACTOR_ID = 'demo-user'
export const DEFAULT_WORKSPACE_ID = 'demo-workspace'

export const defaultWorkbenchDashboards = [
  { id: 'dashboard-all', name: '全员工作台', description: '工作台配置演示态' },
  { id: 'dashboard-electro', name: '电教主任工作台', description: '工作台配置演示态' },
  { id: 'dashboard-moral', name: '德育主任工作台', description: '工作台配置演示态' },
  { id: 'dashboard-research', name: '教研主任工作台', description: '工作台配置演示态' },
] as const

const defaultWorkbenchDashboardIds: ReadonlySet<string> = new Set(defaultWorkbenchDashboards.map((dashboard) => dashboard.id))

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

export function isDefaultWorkbenchDashboardId(id: string) {
  return defaultWorkbenchDashboardIds.has(id)
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

export async function createDashboard(input: { name: string; description?: string; id?: string }) {
  const schema = createDefaultSchema()
  const dashboard = await prisma.dashboard.create({
    data: {
      id: input.id ?? nanoid(),
      name: input.name,
      description: input.description ?? null,
      ownerId: DEFAULT_ACTOR_ID,
      workspaceId: DEFAULT_WORKSPACE_ID,
      status: 'draft',
      draftSchema: JSON.stringify(schema),
      permissions: {
        create: { id: nanoid(), subjectType: 'user', subjectId: DEFAULT_ACTOR_ID, permission: 'owner' },
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

export async function ensureDefaultWorkbenchDashboards() {
  const existingDashboards = await prisma.dashboard.findMany({
    where: { id: { in: [...defaultWorkbenchDashboardIds] } },
    select: { id: true, workspaceId: true, status: true },
  })
  const existingById = new Map(existingDashboards.map((dashboard) => [dashboard.id, dashboard]))
  const schema = JSON.stringify(createDefaultSchema())

  for (const preset of defaultWorkbenchDashboards) {
    const existingDashboard = existingById.get(preset.id)

    if (!existingDashboard) {
      await prisma.dashboard.create({
        data: {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          ownerId: DEFAULT_ACTOR_ID,
          workspaceId: DEFAULT_WORKSPACE_ID,
          status: 'draft',
          draftSchema: schema,
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
          draftSchema: schema,
          publishedSchema: null,
          publishedAt: null,
        },
      })
    }

    await ensureDefaultDashboardPermission(preset.id)
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
