import type { DashboardComponent } from '@analytics/shared'
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import WebEmbedRenderer from './WebEmbedRenderer.vue'

function createWebEmbed(overrides: Partial<DashboardComponent> = {}): DashboardComponent {
  return {
    id: 'web-embed-1',
    type: 'web-embed',
    name: '第三方网页',
    layout: { x: 0, y: 0, width: 720, height: 420, zIndex: 1, visible: true },
    props: { title: '第三方数据看板', url: '' },
    style: {
      backgroundColor: 'rgba(15, 23, 42, 0.86)',
      fontColor: '#e2e8f0',
      borderColor: 'rgba(56, 189, 248, 0.36)',
    },
    ...overrides,
  }
}

describe('WebEmbedRenderer', () => {
  test('shows a configuration fallback when no URL is set', () => {
    const wrapper = mount(WebEmbedRenderer, { props: { component: createWebEmbed() } })

    expect(wrapper.text()).toContain('请配置第三方看板链接')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  test('renders a safe https URL in a hardened iframe', () => {
    const wrapper = mount(WebEmbedRenderer, {
      props: {
        component: createWebEmbed({
          props: { title: '告警态势', url: 'https://demo.school.local/alarm-bi' },
        }),
      },
    })

    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.get('iframe').attributes('src')).toBe('https://demo.school.local/alarm-bi')
    expect(wrapper.get('iframe').attributes('title')).toBe('告警态势')
    expect(wrapper.get('iframe').attributes('referrerpolicy')).toBe('no-referrer')
  })

  test.each([
    'http://127.0.0.1:5173/local-bi',
    'http://localhost:5173/local-bi',
    'http://demo.school.local/alarm-bi',
  ])('renders an allowed local or demo http URL in an iframe: %s', (url) => {
    const wrapper = mount(WebEmbedRenderer, {
      props: {
        component: createWebEmbed({
          props: { title: '本地看板', url },
        }),
      },
    })

    expect(wrapper.get('iframe').attributes('src')).toBe(url)
    expect(wrapper.get('iframe').attributes('referrerpolicy')).toBe('no-referrer')
  })

  test.each(['javascript:alert(1)', 'https:example.com/dashboard'])(
    'blocks unsupported or unsafe URL schemes: %s',
    (url) => {
      const wrapper = mount(WebEmbedRenderer, {
        props: {
          component: createWebEmbed({
            props: { title: '危险链接', url },
          }),
        },
      })

      expect(wrapper.text()).toContain('链接格式不支持')
      expect(wrapper.find('iframe').exists()).toBe(false)
    },
  )

  test('blocks public http URLs outside the local/demo allowlist', () => {
    const wrapper = mount(WebEmbedRenderer, {
      props: {
        component: createWebEmbed({
          props: { title: '外部明文链接', url: 'http://example.com/dashboard' },
        }),
      },
    })

    expect(wrapper.text()).toContain('链接格式不支持')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })
})
