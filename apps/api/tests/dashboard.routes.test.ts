import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { prisma } from '../src/db.js'
import { createApp } from '../src/app.js'

describe('dashboard routes', () => {
  test('creates and fetches a dashboard draft', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Operations Overview', description: 'AI Q&A operations' })
      .expect(201)

    expect(created.body.success).toBe(true)
    expect(created.body.data.name).toBe('Operations Overview')

    const fetched = await request(app)
      .get(`/api/big-screens/${created.body.data.id}`)
      .expect(200)

    expect(fetched.body.data.id).toBe(created.body.data.id)
    expect(fetched.body.data.draftSchema.version).toBe('1.0')
  })

  test('rejects invalid draft schema', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Invalid Schema Screen' })
      .expect(201)

    const response = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: { version: 'bad' } })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('SCHEMA_INVALID')
  })

  test('rejects invalid create body with stable fail shape', async () => {
    const app = createApp()

    const response = await request(app).post('/api/big-screens').send({ name: '' }).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'REQUEST_INVALID', message: 'Dashboard name is required' },
    })
  })

  test('runtime before publish returns not published fail shape', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Draft Runtime' }).expect(201)
    const response = await request(app).get(`/api/big-screens/${created.body.data.id}/runtime`).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_PUBLISHED', message: 'Dashboard is not published' },
    })
  })

  test('publishes a dashboard and returns runtime schema', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Published Runtime' }).expect(201)
    const published = await request(app).post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(200)

    expect(published.body.success).toBe(true)
    expect(published.body.data.status).toBe('published')
    expect(published.body.data.publishedSchema.version).toBe('1.0')

    const runtime = await request(app).get(`/api/big-screens/${created.body.data.id}/runtime`).expect(200)

    expect(runtime.body.success).toBe(true)
    expect(runtime.body.data.schema.version).toBe('1.0')
  })

  test('corrupt stored schema returns stable internal error shape', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Corrupt Stored Schema' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { draftSchema: '{"version":"bad"}' },
    })

    const response = await request(app).get(`/api/big-screens/${created.body.data.id}`).expect(500)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
    })
  })
})
