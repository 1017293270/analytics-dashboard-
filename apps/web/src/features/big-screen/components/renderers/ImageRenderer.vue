<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, type CSSProperties, type PropType } from 'vue'
import { bigScreenText } from '../../i18n/zh-CN'
import { isAllowedImageSource } from './imageRenderer.helpers'
import { buildBackdropBlurStyle } from './rendererStyle.helpers'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
})

function styleString(key: string, fallback: string): string {
  const value = props.component.style[key]
  return typeof value === 'string' ? value : fallback
}

function propString(key: string, fallback: string): string {
  const value = props.component.props[key]
  return typeof value === 'string' ? value : fallback
}

const src = computed(() => propString('src', ''))
const isRejectedSource = computed(() => src.value !== '' && !isAllowedImageSource(src.value))
const safeSrc = computed(() => (isRejectedSource.value ? '' : src.value))
const objectFit = computed(() => propString('objectFit', 'cover'))
const imageStyle = computed<CSSProperties>(() => ({ objectFit: objectFit.value as CSSProperties['objectFit'] }))
const frameStyle = computed(() => ({
  backgroundColor: styleString('backgroundColor', 'rgba(15, 23, 42, 0.56)'),
  borderColor: styleString('borderColor', 'rgba(148, 163, 184, 0.26)'),
  ...buildBackdropBlurStyle(props.component.style),
}))
</script>

<template>
  <figure class="image-renderer" :style="frameStyle">
    <img v-if="safeSrc" :src="safeSrc" alt="" :style="imageStyle" />
    <figcaption v-else class="image-renderer__empty">
      {{ isRejectedSource ? bigScreenText.renderers.imageUnavailable : bigScreenText.renderers.imageEmpty }}
    </figcaption>
  </figure>
</template>

<style scoped>
.image-renderer {
  box-sizing: border-box;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid;
  border-radius: 8px;
}

img {
  display: block;
  width: 100%;
  height: 100%;
}

.image-renderer__empty {
  padding: 12px;
  color: rgba(226, 232, 240, 0.72);
  font-size: 14px;
  overflow-wrap: anywhere;
}
</style>
