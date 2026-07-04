<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../auth/stores/useAuthStore'
import { getActiveShellNavPath, getVisibleShellNavItems } from './navigation'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'

const route = useRoute()
const auth = useAuthStore()
const navItems = computed(() => getVisibleShellNavItems(auth.user))
const activeNavPath = computed(() => getActiveShellNavPath(navItems.value, route.path))
const isFullBleed = computed(() => route.meta.fullBleed === true)
</script>

<template>
  <div class="app-shell">
    <aside class="app-shell__aside">
      <div class="app-shell__brand">
        <span class="app-shell__brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M12 8.2l3.4 1.9v3.8L12 15.8l-3.4-1.9v-3.8L12 8.2z" fill="currentColor" />
          </svg>
        </span>
        <span class="app-shell__brand-text">
          <strong>智慧教育集控平台</strong>
          <span>Smart Education Console</span>
        </span>
      </div>

      <ElScrollbar class="app-shell__nav-scroll">
        <SidebarNav :nav-items="navItems" :active-path="activeNavPath" />
      </ElScrollbar>

      <div class="app-shell__aside-foot">
        <span class="app-shell__status-dot" aria-hidden="true" />
        <span class="app-shell__aside-foot-text">系统运行正常</span>
      </div>
    </aside>

    <div class="app-shell__body">
      <TopBar school-name="未来实验学校" />
      <main class="app-shell__main" :class="{ 'app-shell__main--full-bleed': isFullBleed }">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  height: 100vh;
  min-height: 100vh;
  background: var(--color-page);
}

/* ════════════════════ SIDEBAR ════════════════════ */
.app-shell__aside {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-sidebar);
  background-image: radial-gradient(130% 90% at 100% 0%, rgba(16, 185, 129, 0.1), transparent 55%);
  border-right: 1px solid var(--color-sidebar-border);
}

.app-shell__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid var(--color-sidebar-border);
}

.app-shell__brand-mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: linear-gradient(140deg, var(--color-accent-500), var(--color-accent-700));
  color: #fff;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
}

.app-shell__brand-mark svg {
  width: 20px;
  height: 20px;
}

.app-shell__brand-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.app-shell__brand-text strong {
  color: var(--color-sidebar-text-strong);
  font-size: 14px;
  font-weight: var(--fw-black);
  line-height: 1.2;
  letter-spacing: var(--tracking-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__brand-text span {
  color: var(--color-sidebar-text-muted);
  font-size: 10px;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-label);
}

.app-shell__nav-scroll {
  flex: 1;
  min-height: 0;
}

.app-shell__aside-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--color-sidebar-border);
  color: var(--color-sidebar-text-muted);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

.app-shell__status-dot {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-circle);
  background: var(--color-success);
}

.app-shell__status-dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: var(--radius-circle);
  background: var(--color-success);
  opacity: 0.3;
  animation: app-shell-pulse 2.4s var(--ease-out) infinite;
}

@keyframes app-shell-pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  70% {
    transform: scale(1.4);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}

/* ════════════════════ BODY ════════════════════ */
.app-shell__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.app-shell__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: var(--space-page-y) var(--space-page);
  overflow: auto;
}

.app-shell__main--full-bleed {
  flex: 1;
  display: grid;
  padding: 0;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .app-shell__status-dot::after {
    animation: none;
  }
}
</style>
