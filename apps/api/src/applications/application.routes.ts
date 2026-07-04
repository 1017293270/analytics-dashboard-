import {
  applicationCategoryRowValidator,
  applicationListQueryValidator,
  applicationRowValidator,
  createApplicationInputValidator,
  ok,
  updateApplicationInputValidator,
  type ApplicationRow,
} from '@analytics/shared'
import { Router, type RequestHandler } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import {
  ensureDemoManagementSeed,
  resetDemoApplicationsSeed,
} from '../management/management.seed.js'
import { requireAuth } from '../auth/session.js'

const applicationIdParams = z.object({
  id: z.string().trim().min(1).max(128),
})

export const applicationRoutes = Router()

function hasRole(req: Parameters<RequestHandler>[0], code: string) {
  return Boolean(req.auth?.user?.roles.some((role) => role.code === code))
}

function canManageApplications(req: Parameters<RequestHandler>[0]) {
  return hasRole(req, 'system-admin') || hasRole(req, 'electro-education-director')
}

const requireApplicationManager: RequestHandler = (req, res, next) => {
  if (!canManageApplications(req)) {
    sendForbidden(res, 'Only system administrators and electro-education directors can manage applications')
    return
  }
  next()
}

function parseRoleCodes(value: string): ApplicationRow['visibleRoleCodes'] {
  const parsed = z.array(z.string()).safeParse(JSON.parse(value))
  if (!parsed.success) return []
  return parsed.data as ApplicationRow['visibleRoleCodes']
}

function serializeApplication(application: {
  id: string
  name: string
  categoryId: string
  categoryName: string
  platform: string
  url: string
  packageId: string
  icon: string
  visibleRoleCodes: string
  status: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}) {
  return applicationRowValidator.parse({
    id: application.id,
    name: application.name,
    categoryId: application.categoryId,
    categoryName: application.categoryName,
    platform: application.platform,
    url: application.url,
    packageId: application.packageId,
    icon: application.icon,
    visibleRoleCodes: parseRoleCodes(application.visibleRoleCodes),
    status: application.status,
    sortOrder: application.sortOrder,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  })
}

function buildApplicationSummary(applications: ApplicationRow[]) {
  return {
    total: applications.length,
    web: applications.filter((application) => application.platform === 'web').length,
    mobile: applications.filter((application) => application.platform === 'mobile').length,
    enabled: applications.filter((application) => application.status === 'enabled').length,
  }
}

function filterApplications(applications: ApplicationRow[], query: z.infer<typeof applicationListQueryValidator>) {
  const keyword = query.keyword.toLowerCase()
  return applications.filter((application) => {
    const matchesKeyword =
      !keyword ||
      application.name.toLowerCase().includes(keyword) ||
      application.categoryName.toLowerCase().includes(keyword)
    const matchesCategory = !query.categoryId || application.categoryId === query.categoryId
    const matchesPlatform = !query.platform || application.platform === query.platform
    const matchesStatus = !query.status || application.status === query.status
    const matchesRole = !query.visibleRoleCode || application.visibleRoleCodes.includes(query.visibleRoleCode)
    return matchesKeyword && matchesCategory && matchesPlatform && matchesStatus && matchesRole
  })
}

async function listApplicationPayload(query: z.infer<typeof applicationListQueryValidator>) {
  await ensureDemoManagementSeed()
  const rows = await prisma.managedApplication.findMany({ orderBy: { sortOrder: 'asc' } })
  const applications = rows.map(serializeApplication)
  const filtered = filterApplications(applications, query)
  return {
    items: filtered,
    summary: buildApplicationSummary(applications),
    filteredTotal: filtered.length,
  }
}

applicationRoutes.use('/applications', requireAuth, requireApplicationManager)
applicationRoutes.use('/application-categories', requireAuth, requireApplicationManager)

applicationRoutes.get('/applications', asyncHandler(async (req, res) => {
  const query = applicationListQueryValidator.safeParse(req.query)
  if (!query.success) return sendBadRequest(res, 'APPLICATION_INVALID_QUERY', 'Application query is invalid')

  res.json(ok(await listApplicationPayload(query.data)))
}))

applicationRoutes.post('/applications', asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const body = createApplicationInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'APPLICATION_INVALID', 'Application request is invalid')

  const category = await prisma.applicationCategory.findUnique({ where: { id: body.data.categoryId } })
  if (!category) return sendBadRequest(res, 'APPLICATION_INVALID', 'Application category is invalid')

  const maxSortOrder = await prisma.managedApplication.aggregate({ _max: { sortOrder: true } })
  const created = await prisma.managedApplication.create({
    data: {
      id: nanoid(),
      name: body.data.name,
      categoryId: category.id,
      categoryName: category.name,
      platform: body.data.platform,
      url: body.data.url,
      packageId: body.data.packageId,
      icon: body.data.icon,
      visibleRoleCodes: JSON.stringify(body.data.visibleRoleCodes),
      status: body.data.status,
      sortOrder: body.data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  })

  res.status(201).json(ok(serializeApplication(created)))
}))

applicationRoutes.patch('/applications/:id', asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const params = applicationIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'APPLICATION_INVALID', 'Application id is invalid')
  const body = updateApplicationInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'APPLICATION_INVALID', 'Application request is invalid')

  const existing = await prisma.managedApplication.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Application not found')

  let categoryUpdate: { categoryId: string; categoryName: string } | undefined
  if (body.data.categoryId !== undefined) {
    const category = await prisma.applicationCategory.findUnique({ where: { id: body.data.categoryId } })
    if (!category) return sendBadRequest(res, 'APPLICATION_INVALID', 'Application category is invalid')
    categoryUpdate = { categoryId: category.id, categoryName: category.name }
  }

  const updated = await prisma.managedApplication.update({
    where: { id: params.data.id },
    data: {
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(categoryUpdate ?? {}),
      ...(body.data.platform !== undefined ? { platform: body.data.platform } : {}),
      ...(body.data.url !== undefined ? { url: body.data.url } : {}),
      ...(body.data.packageId !== undefined ? { packageId: body.data.packageId } : {}),
      ...(body.data.icon !== undefined ? { icon: body.data.icon } : {}),
      ...(body.data.visibleRoleCodes !== undefined
        ? { visibleRoleCodes: JSON.stringify(body.data.visibleRoleCodes) }
        : {}),
      ...(body.data.status !== undefined ? { status: body.data.status } : {}),
      ...(body.data.sortOrder !== undefined ? { sortOrder: body.data.sortOrder } : {}),
    },
  })

  res.json(ok(serializeApplication(updated)))
}))

applicationRoutes.post('/applications/:id/uninstall', asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const params = applicationIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'APPLICATION_INVALID', 'Application id is invalid')

  const existing = await prisma.managedApplication.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Application not found')

  const updated = await prisma.managedApplication.update({
    where: { id: params.data.id },
    data: { status: 'uninstalled' },
  })

  res.json(ok(serializeApplication(updated)))
}))

applicationRoutes.post('/applications/demo-reset', asyncHandler(async (_req, res) => {
  await resetDemoApplicationsSeed()
  res.json(ok(await listApplicationPayload(applicationListQueryValidator.parse({}))))
}))

applicationRoutes.get('/application-categories', asyncHandler(async (_req, res) => {
  await ensureDemoManagementSeed()
  const categories = await prisma.applicationCategory.findMany({ orderBy: { sortOrder: 'asc' } })
  res.json(ok(categories.map((category) => applicationCategoryRowValidator.parse(category))))
}))
