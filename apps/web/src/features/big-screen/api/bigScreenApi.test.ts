import { afterEach, describe, expect, test, vi } from 'vitest'
import { requestJson } from './bigScreenApi'

function mockFetch(body: string, init: ResponseInit = { status: 200 }) {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _requestInit?: RequestInit) => new Response(body, init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('requestJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('rejects success envelopes with missing data', async () => {
    mockFetch(JSON.stringify({ success: true }))

    await expect(requestJson('/api/test')).rejects.toThrow('Invalid API response')
  })

  test('rejects failure envelopes with missing error details', async () => {
    mockFetch(JSON.stringify({ success: false, error: null }))

    await expect(requestJson('/api/test')).rejects.toThrow('Invalid API response')
  })

  test('rejects non-JSON responses with a clear error', async () => {
    mockFetch('not json')

    await expect(requestJson('/api/test')).rejects.toThrow('Invalid API response')
  })

  test('sends Accept without Content-Type for GET requests without a body', async () => {
    const fetchMock = mockFetch(JSON.stringify({ success: true, data: { ok: true }, error: null }))

    await requestJson('/api/test')

    const headers = fetchMock.mock.calls[0]?.[1]?.headers
    expect(headers).toBeInstanceOf(Headers)
    expect((headers as Headers).get('Accept')).toBe('application/json')
    expect((headers as Headers).has('Content-Type')).toBe(false)
  })
})
