import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'

describe('health route', () => {
  test('returns ok status', async () => {
    const response = await request(createApp()).get('/api/health').expect(200)

    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok' },
      error: null,
    })
  })
})
