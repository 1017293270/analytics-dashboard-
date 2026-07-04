import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import InteractiveTeachingView from './InteractiveTeachingView.vue'

async function mountTeachingView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/teaching', component: InteractiveTeachingView }],
  })
  await router.push('/teaching')
  await router.isReady()

  const wrapper = mount(InteractiveTeachingView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: { teleport: true },
    },
  })

  await flushPromises()
  return wrapper
}

describe('InteractiveTeachingView', () => {
  test('renders the interactive teaching workspace and member roles', async () => {
    const wrapper = await mountTeachingView()

    expect(wrapper.text()).toContain('互动教学')
    expect(wrapper.text()).toContain('实时连接未启用')
    expect(wrapper.text()).toContain('林老师')
    expect(wrapper.text()).toContain('周老师')
    expect(wrapper.text()).toContain('陈同学')
    expect(wrapper.text()).toContain('主讲人')
    expect(wrapper.text()).toContain('授课老师')
    expect(wrapper.text()).toContain('学生')
  })

  test('switches member roles for the demo session', async () => {
    const wrapper = await mountTeachingView()

    await wrapper.get('[data-testid="set-teacher-member-student-chen"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="member-row-member-student-chen"]').text()).toContain('授课老师')

    await wrapper.get('[data-testid="set-student-member-teacher-zhou"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="member-row-member-teacher-zhou"]').text()).toContain('学生')
  })

  test('updates share stage, screenshots, responder, layout, and focus controls', async () => {
    const wrapper = await mountTeachingView()

    expect(wrapper.get('[data-testid="teaching-stage"]').classes()).toContain('is-layout-grid')

    await wrapper.get('[data-testid="teaching-whiteboard-share"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="teaching-stage"]').text()).toContain('模拟白板共享中')

    await wrapper.get('[data-testid="teaching-desktop-share"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="teaching-stage"]').text()).toContain('桌面画面状态共享中')

    await wrapper.get('[data-testid="teaching-insert-screenshot"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="teaching-screenshot-list"]').text()).toContain('截图 1')

    await wrapper.get('[data-testid="teaching-answer-launch"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="teaching-answer-panel"]').text()).toContain('这节课的关键词是什么？')
    expect(wrapper.get('[data-testid="teaching-answer-panel"]').text()).toContain('已作答 2 人')
    expect(wrapper.get('[data-testid="teaching-answer-panel"]').text()).toContain('陈同学')
    expect(wrapper.get('[data-testid="teaching-answer-panel"]').text()).toContain('王同学')

    await wrapper.get('[data-testid="teaching-layout-whiteboard"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="teaching-stage"]').text()).toContain('白板优先')
    expect(wrapper.get('[data-testid="teaching-stage"]').classes()).toContain('is-layout-whiteboard')

    await wrapper.get('[data-testid="teaching-focus-toggle"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('教师发言聚焦中')
    expect(wrapper.get('[data-testid="teacher-video-tile"]').classes()).toContain('is-focused')
  })

  test('uses container-based wrapping before common 1366px shell widths overflow', async () => {
    const wrapper = await mountTeachingView()

    expect(wrapper.find('.interactive-teaching').attributes('style')).toContain('container-type: inline-size')
    expect(wrapper.find('.interactive-teaching__grid').classes()).toContain('interactive-teaching__grid--responsive')
  })
})
