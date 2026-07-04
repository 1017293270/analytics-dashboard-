import { ok } from '@analytics/shared'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { asyncHandler, sendUnauthorized } from '../errors.js'
import { ensureDemoAuthSeed } from './auth.seed.js'
import { verifyPassword } from './password.js'
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionToken,
  requireAuth,
  setSessionCookie,
  toCurrentUser,
} from './session.js'

const loginBody = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
})

export const authRoutes = Router()

authRoutes.post('/auth/login', asyncHandler(async (req, res) => {
  await ensureDemoAuthSeed()
  const body = loginBody.safeParse(req.body)
  if (!body.success) return sendUnauthorized(res, 'Username or password is invalid')

  const user = await prisma.user.findUnique({
    where: { username: body.data.username },
    include: { roles: { include: { role: true } } },
  })

  if (!user || user.status !== 'active' || !verifyPassword(body.data.password, user.passwordHash)) {
    return sendUnauthorized(res, 'Username or password is invalid')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })
  const { token } = await createSession(user.id)
  setSessionCookie(res, token)
  res.json(ok(toCurrentUser(user)))
}))

authRoutes.get('/auth/me', requireAuth, (req, res) => {
  res.json(ok(req.auth?.user))
})

authRoutes.post('/auth/logout', asyncHandler(async (req, res) => {
  await destroySession(getSessionToken(req))
  clearSessionCookie(res)
  res.json(ok({ loggedOut: true }))
}))
