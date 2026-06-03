<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, type PropType } from 'vue'
import { buildTextStyle } from './textRenderer.helpers'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
})

function propString(key: string, fallback: string): string {
  const value = props.component.props[key]
  return typeof value === 'string' ? value : fallback
}

const text = computed(() => propString('text', ''))
const textStyle = computed(() => buildTextStyle(props.component.style))
</script>

<template>
  <div class="text-renderer" :style="textStyle">{{ text }}</div>
</template>

<style scoped>
.text-renderer {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
</style>
