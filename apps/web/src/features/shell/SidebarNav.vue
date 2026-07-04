<script setup lang="ts">
import { computed, toRaw } from 'vue'
import type { ShellNavItem } from './navigation'

const props = defineProps<{
  navItems: ShellNavItem[]
  activePath: string
}>()

function resolveIcon(icon: ShellNavItem['icon']) {
  return toRaw(icon)
}

// Group nav items into semantic sections. Keys that aren't mapped land in "概览".
const sectionOrder = ['概览', '运营', '教学', '系统'] as const
const sectionMap: Record<string, ShellNavItem['key']> = {
  overview: '概览',
  workbenches: '运营',
  'data-dashboards': '运营',
  applications: '运营',
  alarms: '运营',
  blackboard: '教学',
  teaching: '教学',
  accounts: '系统',
  settings: '系统',
}

const sections = computed(() => {
  const groups = new Map<string, ShellNavItem[]>()
  for (const item of props.navItems) {
    const section = sectionMap[item.key] ?? '概览'
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section)!.push(item)
  }
  return sectionOrder
    .filter((name) => groups.has(name))
    .map((name) => ({ name, items: groups.get(name)! }))
})
</script>

<template>
  <nav class="sidebar-nav" aria-label="智慧教育主导航">
    <ElMenu :default-active="activePath" router class="sidebar-nav__menu">
      <template v-for="section in sections" :key="section.name">
        <li class="sidebar-nav__section-title" role="presentation">{{ section.name }}</li>
        <ElMenuItem v-for="item in section.items" :key="item.key" :index="item.path">
          <ElIcon class="sidebar-nav__icon"><component :is="resolveIcon(item.icon)" /></ElIcon>
          <span>{{ item.label }}</span>
        </ElMenuItem>
      </template>
    </ElMenu>
  </nav>
</template>

<style scoped>
.sidebar-nav {
  min-height: 0;
  padding: 8px 0 12px;
}

.sidebar-nav__menu {
  border-right: 0;
  background: transparent;
  padding: 0 10px;
}

.sidebar-nav__section-title {
  padding: 14px 12px 6px;
  color: var(--color-sidebar-text-muted);
  font-size: 10px;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-label);
  list-style: none;
}

.sidebar-nav__section-title:first-child {
  padding-top: 4px;
}

/* Override Element Plus menu items for the dark emerald sidebar */
.sidebar-nav :deep(.el-menu-item) {
  display: flex;
  align-items: center;
  gap: 11px;
  height: 40px;
  margin: 2px 0;
  padding: 0 12px !important;
  border: 0;
  border-radius: var(--radius-md);
  color: var(--color-sidebar-text);
  font-size: 13px;
  font-weight: var(--fw-medium);
  line-height: 1;
  transition:
    background var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.sidebar-nav :deep(.el-menu-item .el-icon) {
  margin-right: 0;
  color: inherit;
  font-size: 17px;
  opacity: 0.82;
}

.sidebar-nav :deep(.el-menu-item:hover) {
  background: var(--color-sidebar-hover);
  color: var(--color-sidebar-text-strong);
}

.sidebar-nav :deep(.el-menu-item:hover .el-icon) {
  opacity: 1;
}

/* Active: emerald pill with left accent bar */
.sidebar-nav :deep(.el-menu-item.is-active) {
  position: relative;
  background: var(--color-sidebar-active);
  color: var(--color-sidebar-text-strong);
  font-weight: var(--fw-bold);
}

.sidebar-nav :deep(.el-menu-item.is-active .el-icon) {
  color: var(--color-accent-300);
  opacity: 1;
}

.sidebar-nav :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-400);
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}

.sidebar-nav :deep(.el-menu-item:focus-visible) {
  outline: 2px solid var(--color-accent-400);
  outline-offset: -2px;
}
</style>
