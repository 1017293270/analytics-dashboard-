import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { authApi } from '../auth/api/authApi'
import { useAuthStore } from '../auth/stores/useAuthStore'
import TopBar from './TopBar.vue'

vi.mock('../auth/api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({ loggedOut: true }),
  },
}))

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/login', component: { template: '<div>login</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return router
}

function setAdminUser() {
  const auth = useAuthStore()
  auth.user = {
    id: 'user-system-admin',
    username: 'admin',
    displayName: '系统管理员',
    status: 'active',
    roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
  }
  return auth
}

describe('TopBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('renders the school name and current user', async () => {
    const router = await createTestRouter()
    setAdminUser()

    const wrapper = mount(TopBar, {
      props: { schoolName: '未来实验学校' },
      global: { plugins: [ElementPlus, router] },
    })

    expect(wrapper.text()).toContain('未来实验学校')
    expect(wrapper.text()).toContain('系统管理员')
    expect(wrapper.find('.el-dropdown').exists()).toBe(true)
  })

  test('logs out and returns to the login route from the user menu', async () => {
    const router = await createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    const auth = setAdminUser()

    const wrapper = mount(TopBar, {
      props: { schoolName: '未来实验学校' },
      global: { plugins: [ElementPlus, router] },
    })

    wrapper.findComponent({ name: 'ElDropdown' }).vm.$emit('command', 'logout')
    await flushPromises()

    expect(authApi.logout).toHaveBeenCalledTimes(1)
    expect(auth.user).toBeNull()
    expect(pushSpy).toHaveBeenCalledWith('/login')
  })

  test('returns to the login route when the logout request fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('network offline'))
    const router = await createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    const auth = setAdminUser()

    const wrapper = mount(TopBar, {
      props: { schoolName: '未来实验学校' },
      global: { plugins: [ElementPlus, router] },
    })

    wrapper.findComponent({ name: 'ElDropdown' }).vm.$emit('command', 'logout')
    await flushPromises()

    expect(auth.user).toBeNull()
    expect(pushSpy).toHaveBeenCalledWith('/login')
  })
})
