import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import SmartBlackboardView from './SmartBlackboardView.vue'

const elementStubs = {
  ElSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

async function mountBlackboardView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/blackboard', component: SmartBlackboardView }],
  })
  await router.push('/blackboard')
  await router.isReady()

  const wrapper = mount(SmartBlackboardView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return wrapper
}

describe('SmartBlackboardView', () => {
  test('renders the dedicated smart blackboard workspace', async () => {
    const wrapper = await mountBlackboardView()

    expect(wrapper.text()).toContain('智慧黑板')
    expect(wrapper.text()).toContain('课堂活动制作')
    expect(wrapper.text()).toContain('文本输入')
    expect(wrapper.text()).toContain('视频转写')
    expect(wrapper.text()).toContain('黑板预览')
    expect(wrapper.text()).not.toContain('集控控制管理系统')
  })

  test('parses text into editable activity fields and preview', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-source-input"]').setValue(
      '中国古代四大发明包括造纸术、印刷术、火药和____。A. 指南针 B. 地动仪 C. 浑天仪 答案：A',
    )
    await wrapper.get('[data-testid="blackboard-parse-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('指南针')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('中国古代四大发明')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('____')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('正确答案')
  })

  test('switches activity type to judgement and shows judgement controls', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-type-judgement"]').trigger('click')
    await wrapper.get('[data-testid="blackboard-source-input"]').setValue('判断：鲸鱼是鱼类，这句话不正确。')
    await wrapper.get('[data-testid="blackboard-parse-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('判断答案')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('错误')
  })

  test('rebuilds options when switching from judgement back to choice', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-type-judgement"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('正确')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('错误')

    await wrapper.get('[data-testid="blackboard-type-choice"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('指南针')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).not.toContain('错误')
  })

  test('rebuilds options when switching from judgement back to cloze', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-type-judgement"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('错误')

    await wrapper.get('[data-testid="blackboard-type-cloze"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('指南针')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('____')
    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).not.toContain('错误')
  })

  test('updates preview when the teacher edits the generated stem', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-source-input"]').setValue('长江是中国第一长河。答案：长江')
    await wrapper.get('[data-testid="blackboard-parse-button"]').trigger('click')
    await wrapper.get('[data-testid="blackboard-stem-input"]').setValue('中国第一长河是____。')
    await flushPromises()

    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('中国第一长河是____。')
  })

  test('keeps teacher edits when clicking the already selected activity type', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-stem-input"]').setValue('老师手动修改后的题干。')
    await wrapper.get('[data-testid="blackboard-type-cloze"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('老师手动修改后的题干。')
  })

  test('adds a unique option after removing one', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-remove-option-b"]').trigger('click')
    await wrapper.get('[data-testid="blackboard-add-option"]').trigger('click')
    await flushPromises()

    const optionRows = wrapper.findAll('[data-testid^="blackboard-option-row-"]')
    const optionIds = optionRows.map((row) => row.attributes('data-option-id'))

    expect(optionIds).toEqual(['option-a', 'option-c', 'option-d'])
  })

  test('shows inline validation when parsing empty source text', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-source-input"]').setValue('')
    await wrapper.get('[data-testid="blackboard-parse-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('请输入文本后再解析')
  })

  test('video transcription tab shows disabled segment deletion capability', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-tab-video"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('视频片段同步删除：暂未启用')
    expect(wrapper.text()).toContain('转写结果预览')
  })
})
