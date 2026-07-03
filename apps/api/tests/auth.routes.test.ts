import request from 'supertest'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'
import { prisma } from '../src/db.js'

const app = createApp()

function login(username = 'admin', password = 'Admin@123') {
  return request(app).post('/api/auth/login').send({ username, password })
}

function getSessionCookie(response: request.Response) {
  const cookies = response.headers['set-cookie']
  const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
  return cookieList.find((cookie) => cookie.startsWith('analytics_session='))
}

describe('auth routes', () => {
  beforeEach(async () => {
    await ensureDemoAuthSeed()
  })

  afterEach(() => {
    delete process.env.AUTH_COOKIE_SECURE
  })

  test('logs in a seeded system admin and returns the current user', async () => {
    const response = await login().expect(200)

    expect(response.body).toMatchObject({
      success: true,
      data: {
        username: 'admin',
        displayName: '系统管理员',
        status: 'active',
        roles: [{ code: 'system-admin', name: '系统管理员' }],
      },
    })
    expect(getSessionCookie(response)).toContain('HttpOnly')
    expect(getSessionCookie(response)).toContain('SameSite=Lax')

    const sessionCount = await prisma.session.count()
    expect(sessionCount).toBe(1)
  })

  test('rejects an invalid password without creating a session', async () => {
    const response = await login('admin', 'wrong-password').expect(401)

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Username or password is invalid' },
    })
    await expect(prisma.session.count()).resolves.toBe(0)
  })

  test('loads the current user from the session cookie', async () => {
    const loginResponse = await login().expect(200)
    const cookie = getSessionCookie(loginResponse)
    expect(cookie).toBeTruthy()

    const response = await request(app).get('/api/auth/me').set('Cookie', cookie ?? '').expect(200)

    expect(response.body.data.username).toBe('admin')
    expect(response.body.data.roles.map((role: { code: string }) => role.code)).toContain('system-admin')
  })

  test('returns 401 for current user without a valid session', async () => {
    const response = await request(app).get('/api/auth/me').expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  test('treats malformed session cookies as anonymous', async () => {
    await request(app).get('/api/health').set('Cookie', 'analytics_session=%').expect(200)

    const response = await request(app).get('/api/auth/me').set('Cookie', 'analytics_session=%').expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  test('marks session cookies as secure when secure cookies are enabled', async () => {
    process.env.AUTH_COOKIE_SECURE = 'true'

    const response = await login().expect(200)

    expect(getSessionCookie(response)).toContain('Secure')
  })

  test('logs out by deleting the session and clearing the cookie', async () => {
    const loginResponse = await login().expect(200)
    const cookie = getSessionCookie(loginResponse)
    expect(cookie).toBeTruthy()

    const logoutResponse = await request(app).post('/api/auth/logout').set('Cookie', cookie ?? '').send({}).expect(200)

    expect(logoutResponse.body.data).toEqual({ loggedOut: true })
    expect(getSessionCookie(logoutResponse)).toContain('Max-Age=0')
    await expect(prisma.session.count()).resolves.toBe(0)
  })
})
