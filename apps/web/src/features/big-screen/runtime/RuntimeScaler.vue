<script setup lang="ts">
import type { CSSProperties, PropType } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { calculateRuntimeScale, type RuntimeScaleMode } from './runtime-scale'

type StyleValue = string | CSSProperties

const props = defineProps({
  canvasWidth: { type: Number, required: true },
  canvasHeight: { type: Number, required: true },
  scaleMode: { type: String as PropType<RuntimeScaleMode>, default: 'fit-screen' },
  background: { type: [String, Object] as PropType<StyleValue>, default: '' },
})

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: props.canvasWidth, height: props.canvasHeight }
  }

  return { width: window.innerWidth, height: window.innerHeight }
}

const viewport = ref(getViewportSize())

const scale = computed(() =>
  calculateRuntimeScale({
    scaleMode: props.scaleMode,
    viewportWidth: viewport.value.width,
    viewportHeight: viewport.value.height,
    canvasWidth: props.canvasWidth,
    canvasHeight: props.canvasHeight,
  }),
)

const stageStyle = computed<CSSProperties>(() => ({
  width: `${props.canvasWidth * scale.value}px`,
  height: `${props.canvasHeight * scale.value}px`,
}))

const canvasStyle = computed<StyleValue>(() => {
  const baseStyle: CSSProperties = {
    width: `${props.canvasWidth}px`,
    height: `${props.canvasHeight}px`,
    transform: `scale(${scale.value})`,
  }

  if (typeof props.background === 'string') {
    return `${props.background}; width: ${baseStyle.width}; height: ${baseStyle.height}; transform: ${baseStyle.transform};`
  }

  return {
    ...props.background,
    ...baseStyle,
  }
})

function handleResize() {
  viewport.value = getViewportSize()
}

onMounted(() => {
  handleResize()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<template>
  <section class="runtime-scaler" aria-label="Dashboard runtime">
    <div class="runtime-scaler__stage" :style="stageStyle">
      <div class="runtime-scaler__canvas" :style="canvasStyle">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.runtime-scaler {
  display: grid;
  width: 100vw;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  background: linear-gradient(180deg, #07111f 0%, #030712 100%);
}

.runtime-scaler__stage {
  position: relative;
  min-width: 1px;
  min-height: 1px;
}

.runtime-scaler__canvas {
  position: absolute;
  inset: 0 auto auto 0;
  overflow: hidden;
  transform-origin: 0 0;
  box-shadow: 0 24px 90px rgba(0, 0, 0, 0.42);
}
</style>
