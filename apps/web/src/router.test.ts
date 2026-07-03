import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { authApi } from './features/auth/api/authApi'
import { createAppRouter } from './router'

vi.mock('./features/auth/api/authApi', () => ({
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

function createTestRouter() {
  return createAppRouter(createMemoryHistory())
}

describe('router guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('redirects anonymous users from protected routes to login', async () => {
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Authentication is required'))
    const router = createTestRouter()

    await router.push('/big-screens')

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/big-screens')
    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1)
  })

  test('redirects authenticated users away from the login route', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/login')

    expect(router.currentRoute.value.fullPath).toBe('/big-screens')
  })

  test('keeps share routes public without loading the current user', async () => {
    const router = createTestRouter()

    await router.push('/share/token-1')

    expect(router.currentRoute.value.fullPath).toBe('/share/token-1')
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
  })

  test('loads the current user once for repeated protected navigations', async () => {
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Authentication is required'))
    const router = createTestRouter()

    await router.push('/big-screens')
    await router.push('/runtime/first')

    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/runtime/first')
  })
})
