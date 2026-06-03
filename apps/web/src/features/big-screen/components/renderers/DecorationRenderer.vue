<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, type PropType } from 'vue'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
})

function styleString(key: string, fallback: string): string {
  const value = props.component.style[key]
  return typeof value === 'string' ? value : fallback
}

const decorationStyle = computed(() => ({
  backgroundColor: styleString('backgroundColor', 'rgba(8, 13, 28, 0.32)'),
  borderColor: styleString('borderColor', 'rgba(56, 189, 248, 0.5)'),
  '--decoration-accent': styleString('accentColor', '#38bdf8'),
}))
</script>

<template>
  <div class="decoration-renderer" :style="decorationStyle" aria-hidden="true">
    <span class="decoration-renderer__rail decoration-renderer__rail--top" />
    <span class="decoration-renderer__rail decoration-renderer__rail--bottom" />
  </div>
</template>

<style scoped>
.decoration-renderer {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid;
  border-radius: 8px;
}

.decoration-renderer::before,
.decoration-renderer::after {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: var(--decoration-accent);
  content: '';
}

.decoration-renderer::before {
  top: 8px;
  left: 8px;
  border-top: 2px solid;
  border-left: 2px solid;
}

.decoration-renderer::after {
  right: 8px;
  bottom: 8px;
  border-right: 2px solid;
  border-bottom: 2px solid;
}

.decoration-renderer__rail {
  position: absolute;
  left: 16px;
  right: 16px;
  height: 1px;
  background: color-mix(in srgb, var(--decoration-accent) 52%, transparent);
}

.decoration-renderer__rail--top {
  top: 18px;
}

.decoration-renderer__rail--bottom {
  bottom: 18px;
}
</style>
