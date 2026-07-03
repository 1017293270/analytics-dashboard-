import { ok } from '@analytics/shared'
import { Router } from 'express'
import { prisma } from '../db.js'
import { asyncHandler, sendForbidden } from '../errors.js'
import { demoRoles, ensureDemoAuthSeed } from './auth.seed.js'
import { requireAuth } from './session.js'

export const roleRoutes = Router()

function userHasSystemAdminRole(user: { roles: Array<{ code: string }> } | null | undefined) {
  return Boolean(user?.roles.some((role) => role.code === 'system-admin'))
}

roleRoutes.get('/roles', requireAuth, asyncHandler(async (req, res) => {
  if (!userHasSystemAdminRole(req.auth?.user)) {
    return sendForbidden(res, 'Only system administrators can manage roles')
  }

  await ensureDemoAuthSeed()
  const roles = await prisma.role.findMany({
    where: { code: { in: demoRoles.map((role) => role.code) } },
  })
  const rolesByCode = new Map(roles.map((role) => [role.code, role]))

  res.json(
    ok(
      demoRoles.map((demoRole) => {
        const role = rolesByCode.get(demoRole.code)
        return {
          id: role?.id ?? demoRole.id,
          code: demoRole.code,
          name: role?.name ?? demoRole.name,
          description: role?.description ?? demoRole.description,
        }
      }),
    ),
  )
}))
