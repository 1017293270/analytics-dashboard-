<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, type PropType } from 'vue'
import { buildBackdropBlurStyle } from './rendererStyle.helpers'

const props = defineProps({
  component: { type: Object as PropType<DashboardComponent>, required: true },
})

const ALLOWED_HTTP_EMBED_HOSTS = new Set(['127.0.0.1', 'localhost', 'demo.school.local'])

function styleString(key: string, fallback: string): string {
  const value = props.component.style[key]
  return typeof value === 'string' ? value : fallback
}

function propString(key: string, fallback: string): string {
  const value = props.component.props[key]
  return typeof value === 'string' ? value : fallback
}

function isAllowedEmbedUrl(value: string): boolean {
  const trimmedValue = value.trim()
  const hasHttpsScheme = /^https:\/\//i.test(trimmedValue)
  const hasHttpScheme = /^http:\/\//i.test(trimmedValue)
  if (!hasHttpsScheme && !hasHttpScheme) return false

  try {
    const parsedUrl = new URL(trimmedValue)
    if (parsedUrl.protocol === 'https:' && hasHttpsScheme) return true
    if (parsedUrl.protocol === 'http:' && hasHttpScheme) return ALLOWED_HTTP_EMBED_HOSTS.has(parsedUrl.hostname)
  } catch {
    return false
  }

  return false
}

const title = computed(() => propString('title', props.component.name))
const url = computed(() => propString('url', '').trim())
const hasUrl = computed(() => url.value.length > 0)
const isAllowedUrl = computed(() => !hasUrl.value || isAllowedEmbedUrl(url.value))
const frameStyle = computed(() => ({
  backgroundColor: styleString('backgroundColor', 'rgba(15, 23, 42, 0.86)'),
  color: styleString('fontColor', '#e2e8f0'),
  borderColor: styleString('borderColor', 'rgba(56, 189, 248, 0.36)'),
  ...buildBackdropBlurStyle(props.component.style),
}))
</script>

<template>
  <section class="web-embed-renderer" :style="frameStyle">
    <header class="web-embed-renderer__header">
      <strong>{{ title }}</strong>
      <span>第三方网页组件</span>
    </header>

    <iframe
      v-if="hasUrl && isAllowedUrl"
      class="web-embed-renderer__frame"
      :src="url"
      :title="title"
      loading="lazy"
      referrerpolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />

    <div v-else class="web-embed-renderer__state">
      <strong>{{ hasUrl ? '链接格式不支持' : '请配置第三方看板链接' }}</strong>
      <span>{{ hasUrl ? '仅支持 https://，或本地/演示 http:// 链接。' : '在属性面板填写链接后即可融合外部数据看板。' }}</span>
    </div>
  </section>
</template>

<style scoped>
.web-embed-renderer {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid;
  border-radius: 8px;
}

.web-embed-renderer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.web-embed-renderer__header strong,
.web-embed-renderer__header span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.web-embed-renderer__header strong {
  font-size: 14px;
  font-weight: 900;
}

.web-embed-renderer__header span {
  color: color-mix(in srgb, currentColor 64%, transparent);
  font-size: 12px;
  font-weight: 800;
}

.web-embed-renderer__frame {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border: 0;
  background: #ffffff;
}

.web-embed-renderer__state {
  display: grid;
  place-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  text-align: center;
}

.web-embed-renderer__state strong {
  font-size: 15px;
  font-weight: 900;
}

.web-embed-renderer__state span {
  color: color-mix(in srgb, currentColor 70%, transparent);
  font-size: 13px;
}
</style>
