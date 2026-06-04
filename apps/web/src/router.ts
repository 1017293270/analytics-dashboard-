import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/big-screens' },
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
    },
  ],
})
