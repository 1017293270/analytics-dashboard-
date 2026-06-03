import { dashboardSchemaValidator, type DashboardSchema } from '@analytics/shared'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

export const DEFAULT_ACTOR_ID = 'demo-user'
export const DEFAULT_WORKSPACE_ID = 'demo-workspace'

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

export function parseSchema(value: string): DashboardSchema {
  return dashboardSchemaValidator.parse(JSON.parse(value))
}

export async function createDashboard(input: { name: string; description?: string }) {
  const schema = createDefaultSchema()
  const dashboard = await prisma.dashboard.create({
    data: {
      id: nanoid(),
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

export async function getDashboard(id: string) {
  const dashboard = await prisma.dashboard.findUnique({ where: { id } })
  if (!dashboard) return null
  return {
    ...dashboard,
    draftSchema: parseSchema(dashboard.draftSchema),
    publishedSchema: dashboard.publishedSchema ? parseSchema(dashboard.publishedSchema) : null,
  }
}
