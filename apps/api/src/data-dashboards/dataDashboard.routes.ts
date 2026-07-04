import {
  createDataDashboardInputValidator,
  dataDashboardListQueryValidator,
  dataDashboardRowValidator,
  ok,
  updateDataDashboardInputValidator,
  type DataDashboardMetric,
  type DataDashboardRow,
} from '@analytics/shared'
import { Router, type Request, type RequestHandler } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { requireAuth } from '../auth/session.js'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import {
  ensureDemoManagementSeed,
  resetDemoDataDashboardsSeed,
} from '../management/management.seed.js'

const dataDashboardIdParams = z.object({
  id: z.string().trim().min(1).max(128),
})

export const dataDashboardRoutes = Router()

function hasRole(req: Request, code: string) {
  return Boolean(req.auth?.user?.roles.some((role) => role.code === code))
}

function userRoleCodes(req: Request) {
  return req.auth?.user?.roles.map((role) => role.code) ?? []
}

const requireSystemAdmin: RequestHandler = (req, res, next) => {
  if (!hasRole(req, 'system-admin')) {
    sendForbidden(res, 'Only system administrators can manage data dashboards')
    return
  }
  next()
}

function parseJsonArray<T>(value: string): T[] {
  const parsed = z.array(z.unknown()).safeParse(JSON.parse(value))
  if (!parsed.success) return []
  return parsed.data as T[]
}

function serializeDataDashboard(dashboard: {
  id: string
  name: string
  type: string
  source: string
  embedUrl: string
  isDefault: boolean
  visibleRoleCodes: string
  status: string
  metrics: string
  createdAt: Date
  updatedAt: Date
}) {
  return dataDashboardRowValidator.parse({
    id: dashboard.id,
    name: dashboard.name,
    type: dashboard.type,
    source: dashboard.source,
    embedUrl: dashboard.embedUrl,
    isDefault: dashboard.isDefault,
    visibleRoleCodes: parseJsonArray<DataDashboardRow['visibleRoleCodes'][number]>(dashboard.visibleRoleCodes),
    status: dashboard.status,
    metrics: parseJsonArray<DataDashboardMetric>(dashboard.metrics),
    createdAt: dashboard.createdAt.toISOString(),
    updatedAt: dashboard.updatedAt.toISOString(),
  })
}

function buildDataDashboardSummary(dashboards: DataDashboardRow[]) {
  return {
    total: dashboards.length,
    default: dashboards.filter((dashboard) => dashboard.isDefault).length,
    embedded: dashboards.filter((dashboard) => dashboard.source === 'embedded').length,
  }
}

function applyRoleVisibility(req: Request, dashboards: DataDashboardRow[]) {
  if (hasRole(req, 'system-admin')) return dashboards
  const roles = new Set(userRoleCodes(req))
  return dashboards.filter((dashboard) => dashboard.visibleRoleCodes.some((roleCode) => roles.has(roleCode)))
}

function filterDataDashboards(
  dashboards: DataDashboardRow[],
  query: z.infer<typeof dataDashboardListQueryValidator>,
  req: Request,
) {
  const roleFilterAllowed = !query.roleCode || hasRole(req, 'system-admin') || userRoleCodes(req).includes(query.roleCode)
  const keyword = query.keyword.toLowerCase()

  return dashboards.filter((dashboard) => {
    const matchesKeyword = !keyword || dashboard.name.toLowerCase().includes(keyword) || dashboard.type.includes(keyword)
    const matchesType = !query.type || dashboard.type === query.type
    const matchesSource = !query.source || dashboard.source === query.source
    const matchesStatus = !query.status || dashboard.status === query.status
    const matchesRole =
      !query.roleCode || (roleFilterAllowed && dashboard.visibleRoleCodes.includes(query.roleCode))
    return matchesKeyword && matchesType && matchesSource && matchesStatus && matchesRole
  })
}

async function listDataDashboardPayload(req: Request, query: z.infer<typeof dataDashboardListQueryValidator>) {
  await ensureDemoManagementSeed()
  const rows = await prisma.dataDashboard.findMany({ orderBy: { sortOrder: 'asc' } })
  const dashboards = rows.map(serializeDataDashboard)
  const visible = applyRoleVisibility(req, dashboards)
  const filtered = filterDataDashboards(visible, query, req)
  return {
    items: filtered,
    summary: buildDataDashboardSummary(dashboards),
    filteredTotal: filtered.length,
  }
}

dataDashboardRoutes.use('/data-dashboards', requireAuth)

dataDashboardRoutes.get('/data-dashboards', asyncHandler(async (req, res) => {
  const query = dataDashboardListQueryValidator.safeParse(req.query)
  if (!query.success) return sendBadRequest(res, 'DATA_DASHBOARD_INVALID_QUERY', 'Data dashboard query is invalid')

  res.json(ok(await listDataDashboardPayload(req, query.data)))
}))

dataDashboardRoutes.post('/data-dashboards', requireSystemAdmin, asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const body = createDataDashboardInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'DATA_DASHBOARD_INVALID', 'Data dashboard request is invalid')

  const maxSortOrder = await prisma.dataDashboard.aggregate({ _max: { sortOrder: true } })
  const created = await prisma.dataDashboard.create({
    data: {
      id: nanoid(),
      name: body.data.name,
      type: body.data.type,
      source: body.data.source,
      embedUrl: body.data.embedUrl,
      isDefault: body.data.isDefault,
      visibleRoleCodes: JSON.stringify(body.data.visibleRoleCodes),
      status: body.data.status,
      metrics: JSON.stringify(body.data.metrics),
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  })

  res.status(201).json(ok(serializeDataDashboard(created)))
}))

dataDashboardRoutes.patch('/data-dashboards/:id', requireSystemAdmin, asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const params = dataDashboardIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'DATA_DASHBOARD_INVALID', 'Data dashboard id is invalid')
  const body = updateDataDashboardInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'DATA_DASHBOARD_INVALID', 'Data dashboard request is invalid')

  const existing = await prisma.dataDashboard.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Data dashboard not found')

  const updated = await prisma.dataDashboard.update({
    where: { id: params.data.id },
    data: {
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.type !== undefined ? { type: body.data.type } : {}),
      ...(body.data.source !== undefined ? { source: body.data.source } : {}),
      ...(body.data.embedUrl !== undefined ? { embedUrl: body.data.embedUrl } : {}),
      ...(body.data.isDefault !== undefined ? { isDefault: body.data.isDefault } : {}),
      ...(body.data.visibleRoleCodes !== undefined
        ? { visibleRoleCodes: JSON.stringify(body.data.visibleRoleCodes) }
        : {}),
      ...(body.data.status !== undefined ? { status: body.data.status } : {}),
      ...(body.data.metrics !== undefined ? { metrics: JSON.stringify(body.data.metrics) } : {}),
    },
  })

  res.json(ok(serializeDataDashboard(updated)))
}))

dataDashboardRoutes.post('/data-dashboards/demo-reset', requireSystemAdmin, asyncHandler(async (req, res) => {
  await resetDemoDataDashboardsSeed()
  res.json(ok(await listDataDashboardPayload(req, dataDashboardListQueryValidator.parse({}))))
}))
