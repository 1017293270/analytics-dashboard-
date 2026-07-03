<script setup lang="ts">
import { toRaw } from 'vue'
import type { ShellNavItem } from './navigation'

defineProps<{
  navItems: ShellNavItem[]
  activePath: string
}>()

function resolveIcon(icon: ShellNavItem['icon']) {
  return toRaw(icon)
}
</script>

<template>
  <nav class="sidebar-nav" aria-label="智慧教育主导航">
    <ElMenu :default-active="activePath" router>
      <ElMenuItem v-for="item in navItems" :key="item.key" :index="item.path">
        <ElIcon><component :is="resolveIcon(item.icon)" /></ElIcon>
        <span>{{ item.label }}</span>
      </ElMenuItem>
    </ElMenu>
  </nav>
</template>

<style scoped>
.sidebar-nav {
  min-height: 0;
}
</style>
