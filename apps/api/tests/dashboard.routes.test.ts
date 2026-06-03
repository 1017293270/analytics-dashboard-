import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import './setup-database.js'

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
})
