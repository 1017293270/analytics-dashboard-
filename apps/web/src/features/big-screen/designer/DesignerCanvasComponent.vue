<script setup lang="ts">
import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { computed, type PropType } from 'vue'
import { componentRegistry } from '../components/registry'
import { useComponentData } from '../runtime/useComponentData'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
  schema: { type: Object as PropType<DashboardSchema>, required: true },
})

const renderer = computed(() => componentRegistry[props.component.type].renderer)
const { data, loading, error } = useComponentData(
  () => props.component,
  () => props.schema,
)
</script>

<template>
  <component
    :is="renderer"
    class="designer-canvas-component"
    :component="component"
    :data="data"
    :loading="loading"
    :error="error"
  />
</template>

<style scoped>
.designer-canvas-component {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
