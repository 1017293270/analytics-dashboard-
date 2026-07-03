import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { authApi } from '../api/authApi'
import { useAuthStore } from './useAuthStore'

vi.mock('../api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

const adminUser = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  status: 'active' as const,
  roles: [{ id: 'role-system-admin', code: 'system-admin' as const, name: '系统管理员' }],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('loads the current user', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const store = useAuthStore()

    await store.loadCurrentUser()

    expect(store.user?.username).toBe('admin')
    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isSystemAdmin).toBe(true)
    expect(store.hasRole('system-admin')).toBe(true)
  })

  test('treats current-user failures as anonymous', async () => {
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Authentication is required'))
    const store = useAuthStore()

    await store.loadCurrentUser()

    expect(store.user).toBeNull()
    expect(store.initialized).toBe(true)
    expect(store.isAuthenticated).toBe(false)
  })

  test('logs in and stores the returned user', async () => {
    vi.mocked(authApi.login).mockResolvedValue(adminUser)
    const store = useAuthStore()

    await store.login({ username: 'admin', password: 'Admin@123' })

    expect(authApi.login).toHaveBeenCalledWith({ username: 'admin', password: 'Admin@123' })
    expect(store.user?.displayName).toBe('系统管理员')
    expect(store.error).toBeNull()
    expect(store.initialized).toBe(true)
  })

  test('exposes login failures and clears stale users', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce(adminUser)
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Username or password is invalid'))
    const store = useAuthStore()

    await store.login({ username: 'admin', password: 'Admin@123' })
    await expect(store.login({ username: 'admin', password: 'wrong-password' })).rejects.toThrow(
      'Username or password is invalid',
    )

    expect(store.user).toBeNull()
    expect(store.error).toBe('Username or password is invalid')
  })

  test('logs out and clears the current user', async () => {
    vi.mocked(authApi.login).mockResolvedValue(adminUser)
    vi.mocked(authApi.logout).mockResolvedValue({ loggedOut: true })
    const store = useAuthStore()

    await store.login({ username: 'admin', password: 'Admin@123' })
    await store.logout()

    expect(authApi.logout).toHaveBeenCalled()
    expect(store.user).toBeNull()
    expect(store.initialized).toBe(true)
  })
})
