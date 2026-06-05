import type { DataBinding } from '@analytics/shared'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { bigScreenText } from '../i18n/zh-CN'
import { mockDataAdapter } from './mockDataAdapter'

const binding: DataBinding = {
  id: 'binding-1',
  sourceType: 'mock',
  query: { metrics: ['count'] },
}

function mockFetch(body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  )
}

describe('mockDataAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('rejects malformed component data at the adapter boundary', async () => {
    mockFetch({ success: true, data: { kind: 'metric', value: 42, label: 'Requests' }, error: null })

    await expect(mockDataAdapter.query(binding)).rejects.toThrow(bigScreenText.common.errors.invalidComponentData)
  })
})
