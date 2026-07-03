import { createHash } from 'node:crypto'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'
import { sendUnauthorized } from '../errors.js'

export const SESSION_COOKIE_NAME = 'analytics_session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

type CurrentUser = {
  id: string
  username: string
  displayName: string
  status: 'active' | 'disabled'
  roles: Array<{
    id: string
    code:
      | 'system-admin'
      | 'all-staff'
      | 'electro-education-director'
      | 'moral-education-director'
      | 'teaching-research-director'
    name: string
  }>
}

export type AuthContext = {
  user: CurrentUser | null
  sessionId: string | null
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function parseCookies(header: string | undefined) {
  const cookies = new Map<string, string>()
  for (const part of header?.split(';') ?? []) {
    const [rawName, ...rawValueParts] = part.trim().split('=')
    if (!rawName || rawValueParts.length === 0) continue
    cookies.set(rawName, decodeURIComponent(rawValueParts.join('=')))
  }
  return cookies
}

function serializeCookie(name: string, value: string, options: { maxAgeSeconds?: number } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`)
  }
  return parts.join('; ')
}

function toCurrentUser(user: {
  id: string
  username: string
  displayName: string
  status: string
  roles: Array<{ role: { id: string; code: string; name: string } }>
}): CurrentUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status === 'disabled' ? 'disabled' : 'active',
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      code: role.code as CurrentUser['roles'][number]['code'],
      name: role.name,
    })),
  }
}

export async function createSession(userId: string) {
  const token = nanoid(64)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const session = await prisma.session.create({
    data: {
      id: nanoid(),
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  })
  return { token, session }
}

export async function destroySession(token: string | null) {
  if (!token) return
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
}

export function setSessionCookie(res: Response, token: string) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, token, { maxAgeSeconds: SESSION_TTL_MS / 1000 }))
}

export function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', { maxAgeSeconds: 0 }))
}

export function getSessionToken(req: Request) {
  return parseCookies(req.headers.cookie).get(SESSION_COOKIE_NAME) ?? null
}

async function loadAuthContext(req: Request) {
  const token = getSessionToken(req)
  req.auth = { user: null, sessionId: null }

  if (!token) {
    return
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roles: { include: { role: true } } } } },
  })

  if (!session || session.expiresAt.getTime() <= Date.now() || session.user.status !== 'active') {
    await destroySession(token)
    return
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  })

  req.auth = { user: toCurrentUser(session.user), sessionId: session.id }
}

export const attachAuthContext: RequestHandler = (req, _res, next: NextFunction) => {
  void loadAuthContext(req).then(() => next()).catch(next)
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.auth?.user) {
    sendUnauthorized(res, 'Authentication is required')
    return
  }
  next()
}

export { toCurrentUser }
