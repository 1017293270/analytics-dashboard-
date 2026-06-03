import { canEdit, canPublish, dashboardPermissionValidator, dashboardSchemaValidator, ok } from '@analytics/shared'
import { Router } from 'express'
import { z } from 'zod'
import { recordAudit } from '../audit/audit.js'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import {
  createDashboard,
  DEFAULT_ACTOR_ID,
  DEFAULT_WORKSPACE_ID,
  getDashboard,
  parseSchema,
} from './dashboard.repository.js'

const createDashboardBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
})

const updateDraftBody = z.object({
  draftSchema: z.unknown(),
})

const updateMetadataBody = z.object({
  name: z.string().trim().min(1).max(120),
})

const publishBody = z.object({
  publishNote: z.string().trim().max(500).optional(),
})

export const dashboardRoutes = Router()

async function getPermission(dashboardId: string, actorId = DEFAULT_ACTOR_ID) {
  const permission = await prisma.dashboardPermission.findFirst({
    where: { dashboardId, subjectType: 'user', subjectId: actorId },
  })

  if (!permission) return null
  return dashboardPermissionValidator.parse(permission.permission)
}

dashboardRoutes.get('/big-screens', asyncHandler(async (_req, res) => {
  const dashboards = await prisma.dashboard.findMany({
    where: { workspaceId: DEFAULT_WORKSPACE_ID },
    orderBy: { updatedAt: 'desc' },
  })

  res.json(
    ok(
      dashboards.map((dashboard) => ({
        ...dashboard,
        draftSchema: parseSchema(dashboard.draftSchema),
        publishedSchema: dashboard.publishedSchema ? parseSchema(dashboard.publishedSchema) : null,
      })),
    ),
  )
}))

dashboardRoutes.post('/big-screens', asyncHandler(async (req, res) => {
  const body = createDashboardBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')

  const dashboard = await createDashboard(body.data)
  res.status(201).json(ok(dashboard))
}))

dashboardRoutes.get('/big-screens/:id', asyncHandler(async (req, res) => {
  const dashboard = await getDashboard(req.params.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getPermission(dashboard.id)
  if (!permission) return sendForbidden(res)

  res.json(ok(dashboard))
}))

dashboardRoutes.patch('/big-screens/:id', asyncHandler(async (req, res) => {
  const body = updateMetadataBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!dashboard) return sendNotFound(res)

  const permission = await getPermission(dashboard.id)
  if (!permission || !canEdit(permission)) return sendForbidden(res)

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: { name: body.data.name },
    })
    await recordAudit('dashboard.metadata.updated', dashboard.id, DEFAULT_ACTOR_ID, { name: body.data.name }, tx)
    return updatedDashboard
  })

  res.json(
    ok({
      ...updated,
      draftSchema: parseSchema(updated.draftSchema),
      publishedSchema: updated.publishedSchema ? parseSchema(updated.publishedSchema) : null,
    }),
  )
}))

dashboardRoutes.patch('/big-screens/:id/draft', asyncHandler(async (req, res) => {
  const body = updateDraftBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'SCHEMA_INVALID', 'Draft schema is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!dashboard) return sendNotFound(res)

  const permission = await getPermission(dashboard.id)
  if (!permission || !canEdit(permission)) return sendForbidden(res)

  const draftSchema = dashboardSchemaValidator.safeParse(body.data.draftSchema)
  if (!draftSchema.success) return sendBadRequest(res, 'SCHEMA_INVALID', 'Draft schema is invalid')

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: { draftSchema: JSON.stringify(draftSchema.data), status: 'draft' },
    })
    await recordAudit('dashboard.draft.updated', dashboard.id, DEFAULT_ACTOR_ID, { name: dashboard.name }, tx)
    return updatedDashboard
  })

  res.json(
    ok({
      ...updated,
      draftSchema: draftSchema.data,
      publishedSchema: updated.publishedSchema ? parseSchema(updated.publishedSchema) : null,
    }),
  )
}))

dashboardRoutes.post('/big-screens/:id/publish', asyncHandler(async (req, res) => {
  const body = publishBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'PUBLISH_INVALID', 'Publish request is invalid')

  const dashboard = await prisma.dashboard.findUnique({
    where: { id: req.params.id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  })
  if (!dashboard) return sendNotFound(res)

  const permission = await getPermission(dashboard.id)
  if (!permission || !canPublish(permission)) return sendForbidden(res)

  const draftSchema = parseSchema(dashboard.draftSchema)
  const nextVersion = (dashboard.versions[0]?.version ?? 0) + 1
  const publishedAt = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    const updatedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: {
        status: 'published',
        publishedSchema: JSON.stringify(draftSchema),
        publishedAt,
        versions: {
          create: {
            id: nanoIdForVersion(dashboard.id, nextVersion),
            version: nextVersion,
            schema: JSON.stringify(draftSchema),
            publishNote: body.data.publishNote ?? null,
            createdBy: DEFAULT_ACTOR_ID,
          },
        },
      },
    })
    await recordAudit('dashboard.published', dashboard.id, DEFAULT_ACTOR_ID, { version: nextVersion }, tx)
    return updatedDashboard
  })

  res.json(
    ok({
      ...updated,
      draftSchema,
      publishedSchema: draftSchema,
    }),
  )
}))

dashboardRoutes.get('/big-screens/:id/runtime', asyncHandler(async (req, res) => {
  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!dashboard) return sendNotFound(res)

  const permission = await getPermission(dashboard.id)
  if (!permission) return sendForbidden(res)
  if (!dashboard.publishedSchema) return sendBadRequest(res, 'NOT_PUBLISHED', 'Dashboard is not published')

  res.json(
    ok({
      id: dashboard.id,
      name: dashboard.name,
      schema: parseSchema(dashboard.publishedSchema),
      publishedAt: dashboard.publishedAt,
    }),
  )
}))

function nanoIdForVersion(dashboardId: string, version: number) {
  return `${dashboardId}-${version}`
}
