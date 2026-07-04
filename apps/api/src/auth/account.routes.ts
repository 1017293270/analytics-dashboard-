import {
  accountRowValidator,
  createAccountInputValidator,
  ok,
  resetPasswordInputValidator,
  updateAccountInputValidator,
} from '@analytics/shared'
import { Prisma } from '@prisma/client'
import { Router, type RequestHandler } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendConflict, sendForbidden, sendNotFound } from '../errors.js'
import { demoRoles, demoUsers, ensureDemoAuthSeed } from './auth.seed.js'
import { hashPassword } from './password.js'
import { requireAuth } from './session.js'

const accountIdParams = z.object({
  id: z.string().trim().min(1).max(128),
})

const demoUserOrder = new Map(demoUsers.map((user, index) => [user.id, index]))
const demoRoleOrder = new Map<string, number>(demoRoles.map((role, index) => [role.code, index]))

export const accountRoutes = Router()

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function hasSystemAdminRole(user: { roles: Array<{ code: string }> } | null | undefined) {
  return Boolean(user?.roles.some((role) => role.code === 'system-admin'))
}

const requireSystemAdmin: RequestHandler = (req, res, next) => {
  if (!hasSystemAdminRole(req.auth?.user)) {
    sendForbidden(res, 'Only system administrators can manage accounts')
    return
  }
  next()
}

type AccountUser = {
  id: string
  username: string
  displayName: string
  phone: string | null
  status: string
  lastLoginAt: Date | null
  createdAt: Date
  roles: Array<{ role: { code: string } }>
}

function normalizeRoleCodes(roleCodes: string[]) {
  return [...new Set(roleCodes)]
}

function sortRoleCodes(roleCodes: string[]) {
  return [...roleCodes].sort((left, right) => {
    const leftOrder = demoRoleOrder.get(left) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = demoRoleOrder.get(right) ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder || left.localeCompare(right)
  })
}

function sortAccounts(accounts: AccountUser[]) {
  return [...accounts].sort((left, right) => {
    const leftOrder = demoUserOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = demoUserOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER
    if (leftOrder !== rightOrder) return leftOrder - rightOrder
    return left.createdAt.getTime() - right.createdAt.getTime() || left.username.localeCompare(right.username)
  })
}

function serializeAccount(user: AccountUser) {
  return accountRowValidator.parse({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    phone: user.phone ?? '',
    status: user.status === 'disabled' ? 'disabled' : 'active',
    roleCodes: sortRoleCodes(user.roles.map(({ role }) => role.code)),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  })
}

async function resolveRoles(roleCodes: string[]) {
  const uniqueRoleCodes = normalizeRoleCodes(roleCodes)
  const roles = await prisma.role.findMany({
    where: { code: { in: uniqueRoleCodes } },
  })
  if (roles.length !== uniqueRoleCodes.length) return null
  const rolesByCode = new Map(roles.map((role) => [role.code, role]))
  return uniqueRoleCodes.map((roleCode) => rolesByCode.get(roleCode)).filter((role) => role !== undefined)
}

accountRoutes.use('/accounts', requireAuth, requireSystemAdmin)

accountRoutes.get('/accounts', asyncHandler(async (_req, res) => {
  await ensureDemoAuthSeed()

  const accounts = await prisma.user.findMany({
    include: { roles: { include: { role: true } } },
  })

  res.json(ok(sortAccounts(accounts).map(serializeAccount)))
}))

accountRoutes.post('/accounts', asyncHandler(async (req, res) => {
  await ensureDemoAuthSeed()
  const body = createAccountInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account request is invalid')

  const existing = await prisma.user.findUnique({ where: { username: body.data.username } })
  if (existing) return sendConflict(res, 'ACCOUNT_USERNAME_CONFLICT', 'Username already exists')

  const roles = await resolveRoles(body.data.roleCodes)
  if (!roles) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account request is invalid')

  try {
    const created = await prisma.user.create({
      data: {
        id: nanoid(),
        username: body.data.username,
        displayName: body.data.displayName,
        phone: body.data.phone || null,
        passwordHash: hashPassword(body.data.password),
        status: 'active',
        roles: {
          create: roles.map((role) => ({
            id: nanoid(),
            role: { connect: { id: role.id } },
          })),
        },
      },
      include: { roles: { include: { role: true } } },
    })

    res.status(201).json(ok(serializeAccount(created)))
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return sendConflict(res, 'ACCOUNT_USERNAME_CONFLICT', 'Username already exists')
    }
    throw error
  }
}))

accountRoutes.patch('/accounts/:id', asyncHandler(async (req, res) => {
  await ensureDemoAuthSeed()
  const params = accountIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account id is invalid')

  const body = updateAccountInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account request is invalid')

  const existing = await prisma.user.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Account not found')

  const roles = body.data.roleCodes ? await resolveRoles(body.data.roleCodes) : undefined
  if (roles === null) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account request is invalid')

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: params.data.id },
      data: {
        ...(body.data.displayName !== undefined ? { displayName: body.data.displayName } : {}),
        ...(body.data.phone !== undefined ? { phone: body.data.phone || null } : {}),
        ...(body.data.status !== undefined ? { status: body.data.status } : {}),
      },
    })

    if (roles) {
      await tx.userRole.deleteMany({ where: { userId: params.data.id } })
      for (const role of roles) {
        await tx.userRole.create({
          data: {
            id: nanoid(),
            userId: params.data.id,
            roleId: role.id,
          },
        })
      }
    }

    return tx.user.findUniqueOrThrow({
      where: { id: params.data.id },
      include: { roles: { include: { role: true } } },
    })
  })

  res.json(ok(serializeAccount(updated)))
}))

accountRoutes.post('/accounts/:id/reset-password', asyncHandler(async (req, res) => {
  await ensureDemoAuthSeed()
  const params = accountIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account id is invalid')

  const body = resetPasswordInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'ACCOUNT_INVALID', 'Account request is invalid')

  const existing = await prisma.user.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Account not found')

  const updated = await prisma.user.update({
    where: { id: params.data.id },
    data: { passwordHash: hashPassword(body.data.password) },
    include: { roles: { include: { role: true } } },
  })

  res.json(ok(serializeAccount(updated)))
}))
