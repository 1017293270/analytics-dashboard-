import request from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'
import { prisma } from '../src/db.js'

const app = createApp()

async function login(username = 'admin', password = 'Admin@123') {
  const response = await request(app).post('/api/auth/login').send({ username, password }).expect(200)
  const cookies = response.headers['set-cookie']
  const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
  return cookieList.find((cookie) => cookie.startsWith('analytics_session=')) ?? ''
}

async function adminCookie() {
  return login('admin', 'Admin@123')
}

describe('account routes', () => {
  beforeEach(async () => {
    await ensureDemoAuthSeed()
  })

  test('anonymous users cannot access account management routes', async () => {
    await request(app).get('/api/accounts').expect(401)
    await request(app).post('/api/accounts').send({}).expect(401)
    await request(app).patch('/api/accounts/user-all-staff').send({ displayName: 'Nope' }).expect(401)
    await request(app).post('/api/accounts/user-all-staff/reset-password').send({ password: 'Nope@123' }).expect(401)
  })

  test('non-admin users cannot access account management routes', async () => {
    const cookie = await login('all_staff', 'Demo@123')

    for (const response of [
      await request(app).get('/api/accounts').set('Cookie', cookie),
      await request(app).post('/api/accounts').set('Cookie', cookie).send({
        username: 'blocked_teacher',
        displayName: '被阻止教师',
        password: 'Demo@123',
        roleCodes: ['all-staff'],
      }),
      await request(app).patch('/api/accounts/user-all-staff').set('Cookie', cookie).send({ displayName: '被阻止' }),
      await request(app)
        .post('/api/accounts/user-all-staff/reset-password')
        .set('Cookie', cookie)
        .send({ password: 'Blocked@123' }),
    ]) {
      expect(response.status).toBe(403)
      expect(response.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'Only system administrators can manage accounts',
      })
    }
  })

  test('system admin lists seeded accounts in demo order with phone fields', async () => {
    const response = await request(app).get('/api/accounts').set('Cookie', await adminCookie()).expect(200)

    expect(response.body.data.map((account: { username: string }) => account.username)).toEqual([
      'admin',
      'all_staff',
      'electro_director',
      'moral_director',
      'research_director',
    ])
    expect(response.body.data.map((account: { phone: string }) => account.phone)).toEqual([
      '13800000001',
      '13800000002',
      '13800000003',
      '13800000004',
      '13800000005',
    ])
    expect(response.body.data[0]).toMatchObject({
      id: 'user-system-admin',
      username: 'admin',
      status: 'active',
      roleCodes: ['system-admin'],
      lastLoginAt: expect.any(String),
    })
    expect(response.body.data[0]).not.toHaveProperty('passwordHash')
  })

  test('system admin creates an account with roles and the created account can log in', async () => {
    const createResponse = await request(app)
      .post('/api/accounts')
      .set('Cookie', await adminCookie())
      .send({
        username: 'demo_teacher',
        displayName: '演示教师',
        phone: '13800000006',
        password: 'Demo@456',
        roleCodes: ['all-staff', 'teaching-research-director'],
      })
      .expect(201)

    expect(createResponse.body.data).toMatchObject({
      username: 'demo_teacher',
      displayName: '演示教师',
      phone: '13800000006',
      status: 'active',
      roleCodes: ['all-staff', 'teaching-research-director'],
      lastLoginAt: null,
    })
    expect(createResponse.body.data).not.toHaveProperty('passwordHash')

    await request(app).post('/api/auth/login').send({ username: 'demo_teacher', password: 'Demo@456' }).expect(200)
  })

  test('duplicate username returns a stable conflict response', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .set('Cookie', await adminCookie())
      .send({
        username: 'admin',
        displayName: '重复管理员',
        password: 'Demo@123',
        roleCodes: ['all-staff'],
      })
      .expect(409)

    expect(response.body.error).toEqual({
      code: 'ACCOUNT_USERNAME_CONFLICT',
      message: 'Username already exists',
    })
  })

  test('unknown role code rejects without creating a user', async () => {
    const response = await request(app)
      .post('/api/accounts')
      .set('Cookie', await adminCookie())
      .send({
        username: 'ghost_user',
        displayName: '未知角色用户',
        password: 'Demo@123',
        roleCodes: ['ghost-role'],
      })
      .expect(400)

    expect(response.body.error.code).toBe('ACCOUNT_INVALID')
    await expect(prisma.user.findUnique({ where: { username: 'ghost_user' } })).resolves.toBeNull()
  })

  test('system admin updates profile fields and replaces role bindings', async () => {
    const response = await request(app)
      .patch('/api/accounts/user-electro-director')
      .set('Cookie', await adminCookie())
      .send({
        displayName: '电教与德育联动主任',
        phone: '13800009999',
        status: 'disabled',
        roleCodes: ['all-staff', 'moral-education-director'],
      })
      .expect(200)

    expect(response.body.data).toMatchObject({
      id: 'user-electro-director',
      username: 'electro_director',
      displayName: '电教与德育联动主任',
      phone: '13800009999',
      status: 'disabled',
      roleCodes: ['all-staff', 'moral-education-director'],
    })

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: 'user-electro-director' },
      include: { roles: { include: { role: true } } },
    })
    expect(stored.roles.map(({ role }) => role.code).sort()).toEqual(['all-staff', 'moral-education-director'])
  })

  test('disabled account cannot log in', async () => {
    await request(app)
      .patch('/api/accounts/user-research-director')
      .set('Cookie', await adminCookie())
      .send({ status: 'disabled' })
      .expect(200)

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'research_director', password: 'Demo@123' })
      .expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  test('missing account returns 404 for update and reset', async () => {
    const cookie = await adminCookie()

    await request(app).patch('/api/accounts/missing-user').set('Cookie', cookie).send({ displayName: 'Missing' }).expect(404)
    await request(app)
      .post('/api/accounts/missing-user/reset-password')
      .set('Cookie', cookie)
      .send({ password: 'Missing@123' })
      .expect(404)
  })

  test('reset password works', async () => {
    await request(app)
      .post('/api/accounts/user-all-staff/reset-password')
      .set('Cookie', await adminCookie())
      .send({ password: 'Fresh@123' })
      .expect(200)

    await request(app).post('/api/auth/login').send({ username: 'all_staff', password: 'Demo@123' }).expect(401)
    await request(app).post('/api/auth/login').send({ username: 'all_staff', password: 'Fresh@123' }).expect(200)
  })

  test('successful login updates lastLoginAt visible in account list', async () => {
    const cookie = await adminCookie()

    await request(app).post('/api/auth/login').send({ username: 'all_staff', password: 'Demo@123' }).expect(200)

    const response = await request(app).get('/api/accounts').set('Cookie', cookie).expect(200)
    const account = response.body.data.find((item: { username: string }) => item.username === 'all_staff')

    expect(account.lastLoginAt).toEqual(expect.any(String))
    expect(Number.isFinite(Date.parse(account.lastLoginAt))).toBe(true)
  })
})
