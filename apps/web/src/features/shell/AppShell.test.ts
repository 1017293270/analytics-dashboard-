import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAuthStore } from '../auth/stores/useAuthStore'
import AppShell from './AppShell.vue'

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/overview', component: { template: '<div data-test="outlet">page</div>' } }],
  })
  await router.push('/overview')
  await router.isReady()
  return router
}

describe('AppShell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = {
      id: 'user-system-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
    }
  })

  test('renders sidebar, top bar, and page outlet', async () => {
    const router = await createTestRouter()
    const wrapper = mount(AppShell, {
      global: {
        plugins: [ElementPlus, router],
      },
    })

    expect(wrapper.text()).toContain('智慧教育集控平台')
    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.find('[data-test="outlet"]').exists()).toBe(true)
  })
})
