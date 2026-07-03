import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import { useAuthStore } from './features/auth/stores/useAuthStore'

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', redirect: '/big-screens' },
      {
        path: '/login',
        component: () => import('./features/auth/LoginView.vue'),
        meta: { public: true },
      },
      {
        path: '/big-screens',
        component: () => import('./features/big-screen/designer/DashboardList.vue'),
      },
      {
        path: '/big-screens/:id',
        component: () => import('./features/big-screen/designer/DesignerShell.vue'),
      },
      {
        path: '/runtime/:id',
        component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
      },
      {
        path: '/share/:token',
        component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
        meta: { public: true },
      },
    ],
  })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (to.meta.public && to.path !== '/login') {
      return true
    }

    if (!auth.initialized) {
      await auth.loadCurrentUser()
    }

    if (to.meta.public) {
      if (to.path === '/login' && auth.isAuthenticated) return '/'

      return true
    }

    if (!auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    return true
  })

  return router
}

export const router = createAppRouter()
