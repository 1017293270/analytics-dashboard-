import { afterEach, describe, expect, test, vi } from 'vitest'
import { authApi } from './authApi'

const adminUser = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  status: 'active',
  roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('authApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('loads the current user with cookies included', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: adminUser, error: null }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(authApi.getCurrentUser()).resolves.toEqual(adminUser)

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ credentials: 'include' }))
  })

  test('rejects current-user responses outside the shared auth contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      success: true,
      data: {
        ...adminUser,
        roles: [{ id: 'role-guest', code: 'guest', name: 'Guest' }],
      },
      error: null,
    })))

    await expect(authApi.getCurrentUser()).rejects.toThrow('Invalid current user response')
  })
})
