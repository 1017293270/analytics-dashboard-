import { afterEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi, requestJson } from './bigScreenApi'

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

  test('requests dashboard versions without a request body', async () => {
    const fetchMock = mockFetch(JSON.stringify({ success: true, data: [], error: null }))

    await bigScreenApi.listVersions('dashboard-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/big-screens/dashboard-1/versions', expect.any(Object))
    const requestInit = fetchMock.mock.calls[0]?.[1]
    expect(requestInit?.method).toBeUndefined()
  })

  test('rolls back a dashboard version with a stable POST body', async () => {
    const fetchMock = mockFetch(
      JSON.stringify({
        success: true,
        data: { id: 'dashboard-1', name: 'Dashboard', status: 'published', draftSchema: { version: '1.0' } },
        error: null,
      }),
    )

    await bigScreenApi.rollbackVersion('dashboard-1', 3)

    expect(fetchMock).toHaveBeenCalledWith('/api/big-screens/dashboard-1/versions/3/rollback', expect.any(Object))
    const requestInit = fetchMock.mock.calls[0]?.[1]
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.body).toBe('{}')
  })
})
