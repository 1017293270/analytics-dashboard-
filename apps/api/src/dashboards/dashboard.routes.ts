import { dashboardSchemaValidator, ok } from '@analytics/shared'
import { Prisma } from '@prisma/client'
import { Router, type Request, type Response } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { recordAudit } from '../audit/audit.js'
import { requireAuth } from '../auth/session.js'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendConflict, sendForbidden, sendNotFound } from '../errors.js'
import {
  type DashboardActor,
  getDashboardPermission,
  getDashboardPermissionSubjects,
  hasEditPermission,
  hasPublishPermission,
  hasViewPermission,
} from './dashboard.permissions.js'
import {
  createDashboard,
  DEFAULT_WORKSPACE_ID,
  ensureDefaultWorkbenchDashboards,
  getDefaultWorkbenchVisibleRoles,
  isDefaultWorkbenchDashboardId,
  parseSchema,
  serializeWorkbenchSetting,
} from './dashboard.repository.js'

const createDashboardBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
  clientReservationId: z.string().regex(/^local-draft-[A-Za-z0-9_-]{12,64}$/).optional(),
})

const updateDraftBody = z.object({
  draftSchema: z.unknown(),
  expectedUpdatedAt: z.string().trim().min(1),
})

const updateMetadataBody = z.object({
  name: z.string().trim().min(1).max(120),
  expectedUpdatedAt: z.string().trim().min(1),
})

const publishBody = z.object({
  publishNote: z.string().trim().max(500).optional(),
})

const updateWorkbenchSettingsBody = z.object({
  visibleRoles: z.array(z.string().trim().min(1)).min(1),
  availability: z.enum(['enabled', 'disabled']),
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
const VALID_DASHBOARD_PERMISSIONS = ['view', 'edit', 'owner']

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

function isActiveDashboard<T extends { workspaceId: string; status: string }>(dashboard: T | null): dashboard is T {
  return Boolean(dashboard && dashboard.workspaceId === DEFAULT_WORKSPACE_ID && dashboard.status !== 'archived')
}

function getRequestDashboardActor(req: Request): DashboardActor {
  const user = req.auth?.user
  if (!user) {
    throw new Error('Authenticated dashboard route reached without a user')
  }

  const roleCodes = user.roles.map((role) => role.code)
  return {
    actorId: user.id,
    roleCodes,
    isSystemAdmin: roleCodes.includes('system-admin'),
  }
}

async function findActiveDashboard(id: string) {
  if (isDefaultWorkbenchDashboardId(id)) {
    await ensureDefaultWorkbenchDashboards()
  }

  const dashboard = await prisma.dashboard.findUnique({ where: { id } })

  return isActiveDashboard(dashboard) ? dashboard : null
}

function parseExpectedRevision(expectedUpdatedAt: string): Date | null {
  const expectedTime = new Date(expectedUpdatedAt).getTime()
  return Number.isFinite(expectedTime) ? new Date(expectedTime) : null
}

function sendDashboardConflict(res: Response) {
  return sendConflict(res, 'DASHBOARD_CONFLICT', 'Dashboard changed. Reload before saving.')
}

async function normalizeVisibleRoles(values: string[]) {
  const roles = await prisma.role.findMany()
  const rolesByCode = new Map(roles.map((role) => [role.code, role]))
  const rolesByName = new Map(roles.map((role) => [role.name, role]))
  const visibleRoles: string[] = []
  const seenRoleCodes = new Set<string>()

  for (const value of values) {
    const role = rolesByCode.get(value) ?? rolesByName.get(value)
    if (!role) return null
    if (seenRoleCodes.has(role.code)) continue

    visibleRoles.push(role.code)
    seenRoleCodes.add(role.code)
  }

  return visibleRoles
}

async function syncRoleViewPermissions(tx: Prisma.TransactionClient, dashboardId: string, visibleRoles: string[]) {
  await tx.dashboardPermission.deleteMany({
    where: { dashboardId, subjectType: 'role' },
  })

  await tx.dashboardPermission.createMany({
    data: visibleRoles.map((roleCode) => ({
      id: `permission-${dashboardId}-role-${roleCode}`,
      dashboardId,
      subjectType: 'role',
      subjectId: roleCode,
      permission: 'view',
    })),
  })
}

async function sendExistingReservation(res: Response, dashboardId: string, actor: DashboardActor) {
  const dashboard = await prisma.dashboard.findUnique({ where: { id: dashboardId } })
  if (!dashboard) return null
  if (!isActiveDashboard(dashboard)) {
    sendNotFound(res)
    return true
  }

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasEditPermission(permission)) {
    sendForbidden(res)
    return true
  }

  res.json(ok(serializeDashboard(dashboard)))
  return true
}

dashboardRoutes.get('/public/big-screens/:shareToken', asyncHandler(async (req, res) => {
  const params = shareTokenParams.safeParse(req.params)
  if (!params.success) return sendNotFound(res)

  const shareLink = await prisma.dashboardShareLink.findUnique({
    where: { token: params.data.shareToken },
    include: { dashboard: true },
  })
  if (!shareLink || !shareLink.isEnabled) return sendNotFound(res)
  if (shareLink.accessScope !== 'public-runtime') return sendNotFound(res)
  if (shareLink.expiresAt && shareLink.expiresAt.getTime() <= Date.now()) return sendNotFound(res)

  let dashboard = shareLink.dashboard
  if (isDefaultWorkbenchDashboardId(dashboard.id)) {
    await ensureDefaultWorkbenchDashboards()
    const normalizedDashboard = await prisma.dashboard.findUnique({ where: { id: dashboard.id } })
    if (!normalizedDashboard) return sendNotFound(res)
    dashboard = normalizedDashboard
  }

  if (!isActiveDashboard(dashboard) || dashboard.status !== 'published' || !dashboard.publishedSchema) {
    return sendNotFound(res)
  }

  res.json(ok(serializeRuntime({ ...dashboard, publishedSchema: dashboard.publishedSchema })))
}))

dashboardRoutes.use(requireAuth)

dashboardRoutes.get('/big-screens', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  await ensureDefaultWorkbenchDashboards()

  const where: Prisma.DashboardWhereInput = {
    workspaceId: DEFAULT_WORKSPACE_ID,
    status: { not: 'archived' },
  }

  if (!actor.isSystemAdmin) {
    where.permissions = {
      some: {
        OR: getDashboardPermissionSubjects(actor),
        permission: { in: VALID_DASHBOARD_PERMISSIONS },
      },
    }
  }

  const dashboards = await prisma.dashboard.findMany({
    where,
    include: { workbenchSetting: true },
    orderBy: { updatedAt: 'desc' },
  })

  res.json(
    ok(
      dashboards
        .filter((dashboard) => {
          if (actor.isSystemAdmin) return true

          const setting = serializeWorkbenchSetting(dashboard.workbenchSetting, {
            dashboardId: dashboard.id,
            visibleRoles: getDefaultWorkbenchVisibleRoles(dashboard.id),
          })

          return setting.availability === 'enabled'
        })
        .map((dashboard) => {
          const setting = serializeWorkbenchSetting(dashboard.workbenchSetting, {
            dashboardId: dashboard.id,
            visibleRoles: getDefaultWorkbenchVisibleRoles(dashboard.id),
          })

          return {
            id: dashboard.id,
            name: dashboard.name,
            description: dashboard.description,
            status: dashboard.status,
            ownerId: dashboard.ownerId,
            createdAt: dashboard.createdAt,
            updatedAt: dashboard.updatedAt,
            publishedAt: dashboard.publishedAt,
            visibleRoles: setting.visibleRoles,
            availability: setting.availability,
          }
        }),
    ),
  )
}))

dashboardRoutes.patch('/big-screens/:id/workbench-settings', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')
  if (!actor.isSystemAdmin) return sendForbidden(res)

  const body = updateWorkbenchSettingsBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Workbench settings are invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const visibleRoles = await normalizeVisibleRoles(body.data.visibleRoles)
  if (!visibleRoles || visibleRoles.length === 0) {
    return sendBadRequest(res, 'REQUEST_INVALID', 'Workbench settings are invalid')
  }

  const updated = await prisma.$transaction(async (tx) => {
    const setting = await tx.workbenchSetting.upsert({
      where: { dashboardId: dashboard.id },
      update: {
        visibleRoles: JSON.stringify(visibleRoles),
        availability: body.data.availability,
      },
      create: {
        dashboardId: dashboard.id,
        visibleRoles: JSON.stringify(visibleRoles),
        availability: body.data.availability,
      },
    })

    await syncRoleViewPermissions(tx, dashboard.id, visibleRoles)
    await recordAudit(
      'dashboard.workbench_settings.updated',
      dashboard.id,
      actor.actorId,
      { visibleRoles, availability: body.data.availability },
      tx,
    )

    return setting
  })

  res.json(ok(serializeWorkbenchSetting(updated, { dashboardId: dashboard.id })))
}))

dashboardRoutes.post('/big-screens', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const body = createDashboardBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')

  const reservationId = body.data.clientReservationId
  if (reservationId) {
    const handled = await sendExistingReservation(res, reservationId, actor)
    if (handled) return
  }

  try {
    const dashboard = await createDashboard({ ...body.data, id: reservationId, actorId: actor.actorId })
    res.status(201).json(ok(dashboard))
  } catch (error) {
    if (reservationId && isUniqueConstraintError(error)) {
      const handled = await sendExistingReservation(res, reservationId, actor)
      if (handled) return
    }

    throw error
  }
}))

dashboardRoutes.post('/big-screens/:id/copy', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasEditPermission(permission)) return sendForbidden(res)

  const copyId = nanoid()
  const copied = await prisma.$transaction(async (tx) => {
    const copiedDashboard = await tx.dashboard.create({
      data: {
        id: copyId,
        name: `Copy of ${dashboard.name}`.slice(0, 120),
        description: dashboard.description,
        ownerId: actor.actorId,
        workspaceId: dashboard.workspaceId,
        status: 'draft',
        draftSchema: dashboard.draftSchema,
        publishedSchema: null,
        permissions: {
          create: { id: nanoid(), subjectType: 'user', subjectId: actor.actorId, permission: 'owner' },
        },
      },
    })
    await recordAudit('dashboard.copied', copiedDashboard.id, actor.actorId, { sourceId: dashboard.id }, tx)
    return copiedDashboard
  })

  res.status(201).json(ok(serializeDashboard(copied)))
}))

dashboardRoutes.delete('/big-screens/:id', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasEditPermission(permission)) return sendForbidden(res)

  const archived = await prisma.$transaction(async (tx) => {
    const archivedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: { status: 'archived', publishedSchema: null, publishedAt: null },
    })
    await tx.dashboardShareLink.updateMany({ where: { dashboardId: dashboard.id }, data: { isEnabled: false } })
    await recordAudit('dashboard.archived', dashboard.id, actor.actorId, { previousStatus: dashboard.status }, tx)
    return archivedDashboard
  })

  res.json(ok(serializeDashboard(archived)))
}))

dashboardRoutes.post('/big-screens/:id/unpublish', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasPublishPermission(permission)) return sendForbidden(res)

  const updated = await prisma.$transaction(async (tx) => {
    const unpublishedDashboard = await tx.dashboard.update({
      where: { id: dashboard.id },
      data: { status: 'draft', publishedSchema: null, publishedAt: null },
    })
    await tx.dashboardShareLink.updateMany({ where: { dashboardId: dashboard.id }, data: { isEnabled: false } })
    await recordAudit('dashboard.unpublished', dashboard.id, actor.actorId, { previousStatus: dashboard.status }, tx)
    return unpublishedDashboard
  })

  res.json(ok(serializeDashboard(updated)))
}))

dashboardRoutes.get('/big-screens/:id/versions', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await prisma.dashboard.findUnique({
    where: { id: params.data.id },
    include: { versions: { orderBy: { version: 'desc' } } },
  })
  if (!isActiveDashboard(dashboard)) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
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
  const actor = getRequestDashboardActor(req)
  const params = versionParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard version is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
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
    await recordAudit('dashboard.version.rolled_back', dashboard.id, actor.actorId, { version: version.version }, tx)
    return rolledBackDashboard
  })

  res.json(ok(serializeDashboard(updated)))
}))

dashboardRoutes.post('/big-screens/:id/share-links', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
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
    await recordAudit('dashboard.share.created', dashboard.id, actor.actorId, { shareLinkId: shareLink.id }, tx)
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
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasViewPermission(permission)) return sendForbidden(res)

  res.json(ok(serializeDashboard(dashboard)))
}))

dashboardRoutes.patch('/big-screens/:id', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const body = updateMetadataBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasEditPermission(permission)) return sendForbidden(res)
  const expectedRevision = parseExpectedRevision(body.data.expectedUpdatedAt)
  if (!expectedRevision) return sendDashboardConflict(res)

  const updated = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.dashboard.updateMany({
      where: {
        id: dashboard.id,
        workspaceId: DEFAULT_WORKSPACE_ID,
        status: { not: 'archived' },
        updatedAt: expectedRevision,
      },
      data: { name: body.data.name },
    })
    if (updateResult.count !== 1) return null
    const updatedDashboard = await tx.dashboard.findUniqueOrThrow({ where: { id: dashboard.id } })
    await recordAudit('dashboard.metadata.updated', dashboard.id, actor.actorId, { name: body.data.name }, tx)
    return updatedDashboard
  })
  if (!updated) return sendDashboardConflict(res)

  res.json(
    ok({
      ...updated,
      ...serializeDashboard(updated),
    }),
  )
}))

dashboardRoutes.patch('/big-screens/:id/draft', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const body = updateDraftBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'SCHEMA_INVALID', 'Draft schema is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasEditPermission(permission)) return sendForbidden(res)
  const expectedRevision = parseExpectedRevision(body.data.expectedUpdatedAt)
  if (!expectedRevision) return sendDashboardConflict(res)

  const draftSchema = dashboardSchemaValidator.safeParse(body.data.draftSchema)
  if (!draftSchema.success) return sendBadRequest(res, 'SCHEMA_INVALID', 'Draft schema is invalid')

  const updated = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.dashboard.updateMany({
      where: {
        id: dashboard.id,
        workspaceId: DEFAULT_WORKSPACE_ID,
        status: { not: 'archived' },
        updatedAt: expectedRevision,
      },
      data: { draftSchema: JSON.stringify(draftSchema.data), status: 'draft' },
    })
    if (updateResult.count !== 1) return null
    const updatedDashboard = await tx.dashboard.findUniqueOrThrow({ where: { id: dashboard.id } })
    await recordAudit('dashboard.draft.updated', dashboard.id, actor.actorId, { name: dashboard.name }, tx)
    return updatedDashboard
  })
  if (!updated) return sendDashboardConflict(res)

  res.json(
    ok({
      ...updated,
      draftSchema: draftSchema.data,
      publishedSchema: updated.publishedSchema ? parseSchema(updated.publishedSchema) : null,
    }),
  )
}))

dashboardRoutes.post('/big-screens/:id/publish', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const body = publishBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'PUBLISH_INVALID', 'Publish request is invalid')

  const dashboard = await prisma.dashboard.findUnique({ where: { id: params.data.id } })
  if (!isActiveDashboard(dashboard)) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
  if (!hasPublishPermission(permission)) return sendForbidden(res)

  const draftSchema = parseSchema(dashboard.draftSchema)
  const publishedAt = new Date()

  let updated
  try {
    updated = await prisma.$transaction(async (tx) => {
      const latestVersion = await tx.dashboardVersion.findFirst({
        where: { dashboardId: dashboard.id },
        orderBy: { version: 'desc' },
      })
      const nextVersion = (latestVersion?.version ?? 0) + 1
      const updatedDashboard = await tx.dashboard.update({
        where: { id: dashboard.id },
        data: {
          status: 'published',
          publishedSchema: JSON.stringify(draftSchema),
          publishedAt,
        },
      })
      await tx.dashboardVersion.create({
        data: {
          id: nanoid(),
          dashboardId: dashboard.id,
          version: nextVersion,
          schema: JSON.stringify(draftSchema),
          publishNote: body.data.publishNote ?? null,
          createdBy: actor.actorId,
        },
      })
      await recordAudit('dashboard.published', dashboard.id, actor.actorId, { version: nextVersion }, tx)
      return updatedDashboard
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return sendConflict(res, 'PUBLISH_CONFLICT', 'Dashboard was published concurrently. Reload and try again.')
    }

    throw error
  }

  res.json(
    ok({
      ...updated,
      draftSchema,
      publishedSchema: draftSchema,
    }),
  )
}))

dashboardRoutes.get('/big-screens/:id/runtime', asyncHandler(async (req, res) => {
  const actor = getRequestDashboardActor(req)
  const params = dashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard id is invalid')

  const dashboard = await findActiveDashboard(params.data.id)
  if (!dashboard) return sendNotFound(res)

  const permission = await getDashboardPermission(dashboard.id, actor)
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
