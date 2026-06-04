import { dashboardSchemaValidator, ok } from '@analytics/shared'
import { Prisma } from '@prisma/client'
import { Router, type Response } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { recordAudit } from '../audit/audit.js'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import {
  getDashboardPermission,
  hasEditPermission,
  hasPublishPermission,
  hasViewPermission,
} from './dashboard.permissions.js'
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
  clientReservationId: z.string().regex(/^local-draft-[A-Za-z0-9_-]{12,64}$/).optional(),
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

const dashboardIdParams = z.object({
  id: z.string().trim().min(1).max(128),
})

const versionParams = dashboardIdParams.extend({
  version: z.coerce.number().int().positive(),
})

const shareTokenParams = z.object({
  shareToken: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
})

export const dashboardRoutes = Router()

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function serializeDashboard(dashboard: {
  draftSchema: string
  publishedSchema: string | null
  [key: string]: unknown
}) {
  return {
    ...dashboard,
    draftSchema: parseSchema(dashboard.draftSchema),
    publishedSchema: dashboard.publishedSchema ? parseSchema(dashboard.publishedSchema) : null,
  }
}

function serializeRuntime(dashboard: { id: string; name: string; publishedSchema: string; publishedAt: Date | null }) {
  return {
    id: dashboard.id,
    name: dashboard.name,
    schema: parseSchema(dashboard.publishedSchema),
    publishedAt: dashboard.publishedAt,
  }
}

async function sendExistingReservation(res: Response, dashboardId: string) {
  const dashboard = await getDashboard(dashboardId)
  if (!dashboard) return null

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasEditPermission(permission)) {
    sendForbidden(res)
    return true
  }

  res.json(ok(dashboard))
  return true
}

dashboardRoutes.get('/big-screens', asyncHandler(async (_req, res) => {
  const dashboards = await prisma.dashboard.findMany({
    where: {
      workspaceId: DEFAULT_WORKSPACE_ID,
      status: { not: 'archived' },
      permissions: {
        some: { subjectType: 'user', subjectId: DEFAULT_ACTOR_ID },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  res.json(
    ok(
      dashboards.map((dashboard) => ({
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        status: dashboard.status,
        ownerId: dashboard.ownerId,
        createdAt: dashboard.createdAt,
        updatedAt: dashboard.updatedAt,
        publishedAt: dashboard.publishedAt,
      })),
    ),
  )
}))

dashboardRoutes.post('/big-screens', asyncHandler(async (req, res) => {
  const body = createDashboardBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')

  const reservationId = body.data.clientReservationId
  if (reservationId) {
    const handled = await sendExistingReservation(res, reservationId)
    if (handled) return
  }

  try {
    const dashboard = await createDashboard({ ...body.data, id: reservationId })
    res.status(201).json(ok(dashboard))
  } catch (error) {
    if (reservationId && isUniqueConstraintError(error)) {
      const handled = await sendExistingReservation(res, reservationId)
      if (handled) return
    }

    throw error
  }
}))

dashboardRoutes.get('/public/big-screens/:shareToken', asyncHandler(async (req, res) => {
  const params = shareTokenParams.safeParse(req.params)
  if (!params.success) return sendNotFound(res)

  const shareLink = await prisma.dashboardShareLink.findUnique({
    where: { token: params.data.shareToken },
    include: { dashboard: true },
  })
  if (!shareLink || !shareLink.isEnabled) return sendNotFound(res)
  if (shareLink.expiresAt && shareLink.expiresAt.getTime() <= Date.now()) return sendNotFound(res)

  const dashboard = shareLink.dashboard
  if (dashboard.status !== 'published' || !dashboard.publishedSchema) return sendNotFound(res)

  res.json(ok(serializeRuntime({ ...dashboard, publishedSchema: dashboard.publishedSchema })))
}))

dashboardRoutes.post('/big-screens/:id/copy', asyncHandler(async (req, res) => {
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: params.data.id } })
  if (!dashboard || dashboard.workspaceId !== DEFAULT_WORKSPACE_ID || dashboard.status === 'archived') return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasEditPermission(permission)) return sendForbidden(res)

  const copyId = nanoid()
  const copied = await prisma.$transaction(async (tx) => {
    const copiedDashboard = await tx.dashboard.create({
      data: {
        id: copyId,
        name: `Copy of ${dashboard.name}`.slice(0, 120),
        description: dashboard.description,
        ownerId: DEFAULT_ACTOR_ID,
        workspaceId: dashboard.workspaceId,
        status: 'draft',
        draftSchema: dashboard.draftSchema,
        publishedSchema: null,
        permissions: {
          create: { id: nanoid(), subjectType: 'user', subjectId: DEFAULT_ACTOR_ID, permission: 'owner' },
        },
      },
    })
    await recordAudit('dashboard.copied', copiedDashboard.id, DEFAULT_ACTOR_ID, { sourceId: dashboard.id }, tx)
    return copiedDashboard
  })

  res.status(201).json(ok(serializeDashboard(copied)))
}))

dashboardRoutes.delete('/big-screens/:id', asyncHandler(async (req, res) => {
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: params.data.id } })
  if (!dashboard || dashboard.workspaceId !== DEFAULT_WORKSPACE_ID) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasEditPermission(permission)) return sendForbidden(res)

  const archived = await prisma.$transaction(async (tx) => {
    const archivedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: { status: 'archived', publishedSchema: null, publishedAt: null },
    })
    await tx.dashboardShareLink.updateMany({ where: { dashboardId: dashboard.id }, data: { isEnabled: false } })
    await recordAudit('dashboard.archived', dashboard.id, DEFAULT_ACTOR_ID, { previousStatus: dashboard.status }, tx)
    return archivedDashboard
  })

  res.json(ok(serializeDashboard(archived)))
}))

dashboardRoutes.post('/big-screens/:id/unpublish', asyncHandler(async (req, res) => {
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: params.data.id } })
  if (!dashboard || dashboard.workspaceId !== DEFAULT_WORKSPACE_ID || dashboard.status === 'archived') return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasPublishPermission(permission)) return sendForbidden(res)

  const updated = await prisma.$transaction(async (tx) => {
    const unpublishedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: { status: 'draft', publishedSchema: null, publishedAt: null },
    })
    await tx.dashboardShareLink.updateMany({ where: { dashboardId: dashboard.id }, data: { isEnabled: false } })
    await recordAudit('dashboard.unpublished', dashboard.id, DEFAULT_ACTOR_ID, { previousStatus: dashboard.status }, tx)
    return unpublishedDashboard
  })

  res.json(ok(serializeDashboard(updated)))
}))

dashboardRoutes.get('/big-screens/:id/versions', asyncHandler(async (req, res) => {
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await prisma.dashboard.findUnique({
    where: { id: params.data.id },
    include: { versions: { orderBy: { version: 'desc' } } },
  })
  if (!dashboard || dashboard.workspaceId !== DEFAULT_WORKSPACE_ID || dashboard.status === 'archived') return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasViewPermission(permission)) return sendForbidden(res)

  res.json(
    ok(
      dashboard.versions.map((version) => ({
        id: version.id,
        dashboardId: version.dashboardId,
        version: version.version,
        publishNote: version.publishNote,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
      })),
    ),
  )
}))

dashboardRoutes.post('/big-screens/:id/versions/:version/rollback', asyncHandler(async (req, res) => {
  const params = versionParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard version is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: params.data.id } })
  if (!dashboard || dashboard.workspaceId !== DEFAULT_WORKSPACE_ID || dashboard.status === 'archived') return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasPublishPermission(permission)) return sendForbidden(res)

  const version = await prisma.dashboardVersion.findUnique({
    where: { dashboardId_version: { dashboardId: dashboard.id, version: params.data.version } },
  })
  if (!version) return sendNotFound(res, 'Dashboard version not found')

  const schema = parseSchema(version.schema)
  const publishedAt = new Date()
  const updated = await prisma.$transaction(async (tx) => {
    const rolledBackDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: {
        status: 'published',
        draftSchema: JSON.stringify(schema),
        publishedSchema: JSON.stringify(schema),
        publishedAt,
      },
    })
    await recordAudit('dashboard.version.rolled_back', dashboard.id, DEFAULT_ACTOR_ID, { version: version.version }, tx)
    return rolledBackDashboard
  })

  res.json(ok(serializeDashboard(updated)))
}))

dashboardRoutes.post('/big-screens/:id/share-links', asyncHandler(async (req, res) => {
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: params.data.id } })
  if (!dashboard || dashboard.workspaceId !== DEFAULT_WORKSPACE_ID || dashboard.status === 'archived') return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasPublishPermission(permission)) return sendForbidden(res)
  if (dashboard.status !== 'published' || !dashboard.publishedSchema) {
    return sendBadRequest(res, 'NOT_PUBLISHED', 'Dashboard is not published')
  }

  const share = await prisma.$transaction(async (tx) => {
    const shareLink = await tx.dashboardShareLink.create({
      data: {
        id: nanoid(),
        dashboardId: dashboard.id,
        token: nanoid(32),
        accessScope: 'public-runtime',
        expiresAt: null,
        isEnabled: true,
      },
    })
    await recordAudit('dashboard.share.created', dashboard.id, DEFAULT_ACTOR_ID, { shareLinkId: shareLink.id }, tx)
    return shareLink
  })

  res.status(201).json(
    ok({
      id: share.id,
      dashboardId: share.dashboardId,
      token: share.token,
      accessScope: share.accessScope,
      expiresAt: share.expiresAt,
      url: `/share/${share.token}`,
    }),
  )
}))

dashboardRoutes.get('/big-screens/:id', asyncHandler(async (req, res) => {
  const dashboard = await getDashboard(req.params.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasViewPermission(permission)) return sendForbidden(res)

  res.json(ok(dashboard))
}))

dashboardRoutes.patch('/big-screens/:id', asyncHandler(async (req, res) => {
  const body = updateMetadataBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasEditPermission(permission)) return sendForbidden(res)

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
      ...serializeDashboard(updated),
    }),
  )
}))

dashboardRoutes.patch('/big-screens/:id/draft', asyncHandler(async (req, res) => {
  const body = updateDraftBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'SCHEMA_INVALID', 'Draft schema is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasEditPermission(permission)) return sendForbidden(res)

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

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasPublishPermission(permission)) return sendForbidden(res)

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

  const permission = await getDashboardPermission(dashboard.id)
  if (!hasViewPermission(permission)) return sendForbidden(res)
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
