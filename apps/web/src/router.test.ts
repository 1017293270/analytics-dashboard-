import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { authApi } from './features/auth/api/authApi'
import AccountsView from './features/accounts/AccountsView.vue'
import InteractiveTeachingView from './features/interactive-teaching/InteractiveTeachingView.vue'
import SmartBlackboardView from './features/smart-blackboard/SmartBlackboardView.vue'
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
    vi.resetAllMocks()
    vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Authentication is required'))
  })

  test('redirects anonymous users from protected shell routes to login', async () => {
    const router = createTestRouter()

    await router.push('/overview')

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/overview')
    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1)
  })

  test('redirects authenticated users from root to overview', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/')

    expect(router.currentRoute.value.fullPath).toBe('/overview')
  })

  test('redirects authenticated users away from the login route', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/login')

    expect(router.currentRoute.value.fullPath).toBe('/overview')
  })

  test('keeps legacy big-screen management routes as workbench redirects', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/big-screens')
    expect(router.currentRoute.value.fullPath).toBe('/workbenches')

    await router.push('/big-screens/dashboard-1')
    expect(router.currentRoute.value.fullPath).toBe('/workbenches/dashboard-1')
  }, 10_000)

  test('marks workbench editor routes as full-bleed shell content', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/workbenches/dashboard-1')

    expect(router.currentRoute.value.meta.fullBleed).toBe(true)
  })

  test('routes smart blackboard to the dedicated authoring page', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/blackboard')

    const matchedComponent = router.currentRoute.value.matched.at(-1)?.components?.default

    expect(router.currentRoute.value.fullPath).toBe('/blackboard')
    expect(matchedComponent).toBe(SmartBlackboardView)
  })

  test('routes interactive teaching to the dedicated demo page', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/teaching')

    const matchedComponent = router.currentRoute.value.matched.at(-1)?.components?.default

    expect(router.currentRoute.value.fullPath).toBe('/teaching')
    expect(matchedComponent).toBe(InteractiveTeachingView)
  })

  test('routes account role management to the dedicated admin page', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/accounts')

    const matchedComponent = router.currentRoute.value.matched.at(-1)?.components?.default

    expect(router.currentRoute.value.fullPath).toBe('/accounts')
    expect(matchedComponent).toBe(AccountsView)
  })

  test('keeps share and runtime presentation routes outside shell authorization loading', async () => {
    const router = createTestRouter()

    await router.push('/runtime/screen-1')
    expect(router.currentRoute.value.fullPath).toBe('/runtime/screen-1')

    await router.push('/share/token-1')

    expect(router.currentRoute.value.fullPath).toBe('/share/token-1')
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
  })

  test('loads the current user once for repeated protected navigations', async () => {
    const router = createTestRouter()

    await router.push('/overview')
    await router.push('/workbenches')

    expect(authApi.getCurrentUser).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/workbenches')
  })
})
