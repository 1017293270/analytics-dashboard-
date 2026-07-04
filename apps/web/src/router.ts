import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import { useAuthStore } from './features/auth/stores/useAuthStore'

const shellChildren: RouteRecordRaw[] = [
  { path: '', redirect: '/overview' },
  { path: 'overview', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'workbenches', component: () => import('./features/big-screen/designer/DashboardList.vue') },
  {
    path: 'workbenches/:id',
    component: () => import('./features/big-screen/designer/DesignerShell.vue'),
    meta: { fullBleed: true },
  },
  { path: 'data-dashboards', component: () => import('./features/data-dashboards/DataDashboardsView.vue') },
  { path: 'applications', component: () => import('./features/applications/ApplicationCenterView.vue') },
  { path: 'alarms', component: () => import('./features/alarms/AlarmManagementView.vue') },
  { path: 'blackboard', component: () => import('./features/smart-blackboard/SmartBlackboardView.vue') },
  { path: 'teaching', component: () => import('./features/interactive-teaching/InteractiveTeachingView.vue') },
  { path: 'accounts', component: () => import('./features/accounts/AccountsView.vue') },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        component: () => import('./features/shell/AppShell.vue'),
        children: shellChildren,
      },
      { path: '/big-screens', redirect: (to) => ({ path: '/workbenches', query: to.query, hash: to.hash }) },
      {
        path: '/big-screens/:id',
        redirect: (to) => ({ path: `/workbenches/${String(to.params.id)}`, query: to.query, hash: to.hash }),
      },
      {
        path: '/login',
        component: () => import('./features/auth/LoginView.vue'),
        meta: { public: true },
      },
      {
        path: '/runtime/:id',
        component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
        meta: { public: true },
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
      if (to.path === '/login' && auth.isAuthenticated) return '/overview'

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
