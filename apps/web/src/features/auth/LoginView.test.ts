import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import LoginView from './LoginView.vue'
import { useAuthStore } from './stores/useAuthStore'

vi.mock('./api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

function createTestRouter(startPath = '/login') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginView },
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/big-screens', component: { template: '<div>big screens</div>' } },
    ],
  })

  return router.push(startPath).then(() => router.isReady()).then(() => router)
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('renders demo account hints and submits credentials', async () => {
    const router = await createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    const store = useAuthStore()
    const loginSpy = vi.spyOn(store, 'login').mockResolvedValue()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('智慧教育集控平台')
    expect(wrapper.text()).toContain('admin / Admin@123')

    await wrapper.find('input[name="username"]').setValue('admin')
    await wrapper.find('input[name="password"]').setValue('Admin@123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(loginSpy).toHaveBeenCalledWith({ username: 'admin', password: 'Admin@123' })
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  test('uses the redirect query after successful login', async () => {
    const router = await createTestRouter('/login?redirect=/big-screens')
    const pushSpy = vi.spyOn(router, 'push')
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockResolvedValue()

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('form').trigger('submit.prevent')

    expect(pushSpy).toHaveBeenCalledWith('/big-screens')
  })

  test('shows login errors from the store', async () => {
    const router = await createTestRouter()
    const store = useAuthStore()
    vi.spyOn(store, 'login').mockRejectedValue(new Error('Username or password is invalid'))

    const wrapper = mount(LoginView, { global: { plugins: [router] } })
    await wrapper.find('input[name="username"]').setValue('admin')
    await wrapper.find('input[name="password"]').setValue('wrong-password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Username or password is invalid')
  })
})
