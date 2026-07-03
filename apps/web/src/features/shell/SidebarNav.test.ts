import { Grid, HomeFilled } from '@element-plus/icons-vue'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { ShellNavItem } from './navigation'
import SidebarNav from './SidebarNav.vue'

const navItems: ShellNavItem[] = [
  { key: 'overview', label: '首页总览', path: '/overview', icon: HomeFilled, allowedRoles: 'all' },
  { key: 'workbenches', label: '工作台配置', path: '/workbenches', icon: Grid, allowedRoles: 'all' },
]

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/overview', component: { template: '<div>overview</div>' } },
      { path: '/workbenches', component: { template: '<div>workbenches</div>' } },
    ],
  })
  await router.push('/overview')
  await router.isReady()
  return router
}

describe('SidebarNav', () => {
  test('renders Element Plus menu entries in order', async () => {
    const router = await createTestRouter()
    const wrapper = mount(SidebarNav, {
      props: { navItems, activePath: '/overview' },
      global: { plugins: [ElementPlus, router] },
    })

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).toContain('工作台配置')
    expect(wrapper.find('.el-menu').exists()).toBe(true)
    expect(wrapper.find('.el-menu-item.is-active').text()).toContain('首页总览')
  })

  test('renders only the role-visible items it receives', async () => {
    const router = await createTestRouter()
    const wrapper = mount(SidebarNav, {
      props: { navItems: navItems.slice(0, 1), activePath: '/overview' },
      global: { plugins: [ElementPlus, router] },
    })

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).not.toContain('工作台配置')
  })
})
