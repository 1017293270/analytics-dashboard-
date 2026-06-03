import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'

describe('mock data routes', () => {
  test('returns time-series mock data', async () => {
    const app = createApp()

    const response = await request(app)
      .post('/api/big-screens/data/query')
      .send({
        sourceType: 'mock',
        query: { dimensions: ['date'], metrics: ['count'] },
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.kind).toBe('time-series')
    expect(response.body.data.rows.length).toBeGreaterThan(0)
  })
})
