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

  test('returns scenario-specific category and table mock data', async () => {
    const app = createApp()

    const categoryResponse = await request(app)
      .post('/api/big-screens/data/query')
      .send({
        sourceType: 'mock',
        query: { dimensions: ['category'], metrics: ['pipeline_stage'] },
      })
      .expect(200)

    expect(categoryResponse.body.data).toMatchObject({
      kind: 'category',
      rows: expect.arrayContaining([expect.objectContaining({ category: 'Qualified' })]),
    })

    const tableResponse = await request(app)
      .post('/api/big-screens/data/query')
      .send({
        sourceType: 'mock',
        query: { dimensions: ['table'], metrics: ['account_health'], limit: 2 },
      })
      .expect(200)

    expect(tableResponse.body.data).toMatchObject({
      kind: 'table',
      columns: ['account', 'arr', 'risk'],
    })
    expect(tableResponse.body.data.rows).toHaveLength(2)
  })

  test('rejects malformed data query with stable fail shape', async () => {
    const app = createApp()

    const response = await request(app)
      .post('/api/big-screens/data/query')
      .send({
        sourceType: 'mock',
        query: { dimensions: [''] },
      })
      .expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'DATA_QUERY_INVALID', message: 'Mock data query is invalid' },
    })
  })
})
