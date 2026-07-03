import request from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'

const app = createApp()

async function login(username: string, password: string) {
  const response = await request(app).post('/api/auth/login').send({ username, password }).expect(200)
  const cookies = response.headers['set-cookie']
  const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : []
  return cookieList.find((cookie) => cookie.startsWith('analytics_session=')) ?? ''
}

describe('role routes', () => {
  beforeEach(async () => {
    await ensureDemoAuthSeed()
  })

  test('system admin can list seeded roles in demo order', async () => {
    const cookie = await login('admin', 'Admin@123')

    const response = await request(app).get('/api/roles').set('Cookie', cookie).expect(200)

    expect(response.body.data.map((role: { code: string }) => role.code)).toEqual([
      'system-admin',
      'all-staff',
      'electro-education-director',
      'moral-education-director',
      'teaching-research-director',
    ])
  })

  test('non-admin users cannot list roles', async () => {
    const cookie = await login('all_staff', 'Demo@123')

    const response = await request(app).get('/api/roles').set('Cookie', cookie).expect(403)

    expect(response.body.error).toMatchObject({
      code: 'FORBIDDEN',
      message: 'Only system administrators can manage roles',
    })
  })

  test('anonymous users cannot list roles', async () => {
    const response = await request(app).get('/api/roles').expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})
