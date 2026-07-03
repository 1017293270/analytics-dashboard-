<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../auth/stores/useAuthStore'
import { getVisibleShellNavItems } from './navigation'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'

const route = useRoute()
const auth = useAuthStore()
const navItems = computed(() => getVisibleShellNavItems(auth.user))
</script>

<template>
  <ElContainer class="app-shell">
    <ElAside width="240px" class="app-shell__aside">
      <div class="app-shell__brand">
        <strong>智慧教育集控平台</strong>
        <span>Smart Education Console</span>
      </div>
      <ElScrollbar>
        <SidebarNav :nav-items="navItems" :active-path="route.path" />
      </ElScrollbar>
    </ElAside>

    <ElContainer class="app-shell__body">
      <ElHeader height="60px" class="app-shell__header">
        <TopBar school-name="未来实验学校" />
      </ElHeader>
      <ElMain class="app-shell__main">
        <RouterView />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  min-height: 100vh;
  background: var(--color-page);
}

.app-shell__aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-panel);
}

.app-shell__brand {
  display: grid;
  gap: 4px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid var(--color-border);
}

.app-shell__brand strong {
  font-size: 16px;
  font-weight: 900;
}

.app-shell__brand span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.app-shell__body {
  min-width: 0;
  min-height: 0;
}

.app-shell__header {
  padding: 0;
}

.app-shell__main {
  min-width: 0;
  min-height: 0;
  padding: 20px;
  overflow: auto;
}
</style>
