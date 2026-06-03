import { describe, expect, test } from 'vitest'
import { fail, ok } from './api.js'

describe('api response helpers', () => {
  test('ok returns a stable success shape without undefined meta', () => {
    expect(ok({ id: 'dashboard-1' })).toEqual({
      success: true,
      data: { id: 'dashboard-1' },
      error: null,
    })
  })

  test('ok includes meta when provided', () => {
    expect(ok({ id: 'dashboard-1' }, { requestId: 'request-1' })).toEqual({
      success: true,
      data: { id: 'dashboard-1' },
      error: null,
      meta: { requestId: 'request-1' },
    })
  })

  test('fail returns a stable failure shape without undefined meta', () => {
    expect(fail('not_found', 'Dashboard not found')).toEqual({
      success: false,
      data: null,
      error: {
        code: 'not_found',
        message: 'Dashboard not found',
      },
    })
  })

  test('fail includes meta when provided', () => {
    expect(fail('timeout', 'Request timed out', { retryable: true })).toEqual({
      success: false,
      data: null,
      error: {
        code: 'timeout',
        message: 'Request timed out',
      },
      meta: { retryable: true },
    })
  })
})
