# Smart Blackboard Activity Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/blackboard` smart blackboard page that parses teacher text into editable classroom activities and shows a blackboard-style preview.

**Architecture:** Keep the feature frontend-only for this slice. Put deterministic parsing and validation in a pure TypeScript helper file, keep Vue state local to the page component, and route `/blackboard` to the new page instead of the overview placeholder.

**Tech Stack:** Vue 3, TypeScript, Element Plus, `@element-plus/icons-vue`, Vitest, Vue Test Utils, Vue Router memory history tests.

---

## File Structure

- Create `apps/web/src/features/smart-blackboard/blackboardActivity.ts`
  - Owns activity types, labels, parser helpers, fallback draft creation, validation helpers, and demo transcript text.
- Create `apps/web/src/features/smart-blackboard/blackboardActivity.test.ts`
  - Unit-tests parser behavior without mounting Vue.
- Create `apps/web/src/features/smart-blackboard/SmartBlackboardView.vue`
  - Owns the three-column authoring UI, local editable state, validation display, and blackboard preview.
- Create `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`
  - Component-tests the authoring flow, editing, activity type switching, empty validation, and video placeholder.
- Modify `apps/web/src/router.ts`
  - Route `/blackboard` to `SmartBlackboardView.vue`.
- Modify `apps/web/src/router.test.ts`
  - Assert the blackboard route resolves to the dedicated component instead of the overview placeholder.
- Modify `apps/web/src/features/overview/overviewData.ts`
  - Mark 智慧黑板 as 可演示 once the dedicated page is shipped.
- Modify `apps/web/src/features/overview/OverviewView.test.ts`
  - Assert readiness data includes 智慧黑板 as 可演示.

## Task 1: Parser And Validation Helpers

**Files:**
- Create: `apps/web/src/features/smart-blackboard/blackboardActivity.test.ts`
- Create: `apps/web/src/features/smart-blackboard/blackboardActivity.ts`

- [ ] **Step 1: Write the failing parser tests**

Create `apps/web/src/features/smart-blackboard/blackboardActivity.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  activityTypeLabels,
  parseBlackboardActivity,
  removeFillerWords,
  validateBlackboardActivity,
} from './blackboardActivity'

describe('blackboardActivity parser', () => {
  test('removes common classroom filler words when requested', () => {
    expect(removeFillerWords('嗯 这个 长江 然后 就是 中国第一长河 对吧')).toBe('长江 中国第一长河')
  })

  test('parses a cloze activity with explicit answer and lettered options', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'cloze',
      removeFillers: true,
      sourceText: '嗯 中国古代四大发明包括造纸术、印刷术、火药和____。A. 指南针 B. 地动仪 C. 浑天仪 答案：A',
    })

    expect(draft.type).toBe('cloze')
    expect(draft.cleanedText).not.toContain('嗯')
    expect(draft.stem).toContain('____')
    expect(draft.options.map((option) => option.text)).toEqual(['指南针', '地动仪', '浑天仪'])
    expect(draft.correctOptionId).toBe('option-a')
    expect(draft.parseNotes).toContain('已识别显式答案：A')
  })

  test('generates a cloze blank by replacing the explicit answer when the source has no blank marker', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'cloze',
      removeFillers: false,
      sourceText: '长江是中国第一长河。答案：长江',
    })

    expect(draft.stem).toContain('____是中国第一长河。')
    expect(draft.options[0]).toMatchObject({ id: 'option-a', label: 'A', text: '长江' })
    expect(draft.correctOptionId).toBe('option-a')
  })

  test('detects judgement false intent from negative wording', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'judgement',
      removeFillers: false,
      sourceText: '判断：鲸鱼是鱼类，这句话不正确。',
    })

    expect(draft.type).toBe('judgement')
    expect(draft.judgementAnswer).toBe(false)
    expect(draft.options.map((option) => option.text)).toEqual(['正确', '错误'])
    expect(draft.correctOptionId).toBe('option-false')
  })

  test('parses a choice activity and matches answer by option text', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'choice',
      removeFillers: false,
      sourceText: '下列哪一项属于可再生能源？A. 煤炭 B. 风能 C. 石油 正确答案：风能',
    })

    expect(draft.type).toBe('choice')
    expect(draft.options).toHaveLength(3)
    expect(draft.correctOptionId).toBe('option-b')
    expect(draft.parseNotes).toContain('已识别显式答案：风能')
  })

  test('returns editable fallback output for ambiguous input', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'choice',
      removeFillers: false,
      sourceText: '课堂讨论太阳能。',
    })

    expect(draft.options).toHaveLength(3)
    expect(draft.correctOptionId).toBe('option-a')
    expect(draft.parseNotes).toContain('未识别到选项，已生成演示选项')
  })

  test('validates incomplete editable activities without blocking parser output', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'choice',
      removeFillers: false,
      sourceText: '',
    })

    expect(activityTypeLabels.choice).toBe('趣味选择')
    expect(validateBlackboardActivity({ ...draft, stem: '', options: [], correctOptionId: '' })).toEqual([
      '题干不能为空',
      '至少需要两个选项',
      '请选择正确答案',
    ])
  })
})
```

- [ ] **Step 2: Run the parser tests and verify RED**

Run:

```bash
npm --workspace apps/web run test -- blackboardActivity
```

Expected: FAIL because `apps/web/src/features/smart-blackboard/blackboardActivity.ts` does not exist.

- [ ] **Step 3: Implement the parser helpers**

Create `apps/web/src/features/smart-blackboard/blackboardActivity.ts`:

```ts
export type BlackboardActivityType = 'cloze' | 'judgement' | 'choice'

export type BlackboardOption = {
  id: string
  label: string
  text: string
}

export type BlackboardActivityDraft = {
  type: BlackboardActivityType
  sourceText: string
  cleanedText: string
  removeFillers: boolean
  stem: string
  options: BlackboardOption[]
  correctOptionId: string
  judgementAnswer: boolean
  parseNotes: string[]
}

export const activityTypeLabels: Record<BlackboardActivityType, string> = {
  cloze: '选词填空',
  judgement: '判断对错',
  choice: '趣味选择',
}

export const demoTranscriptText =
  '今天我们复习可再生能源。风能、太阳能和水能都可以持续利用。判断：煤炭属于可再生能源，这句话不正确。'

const fillerWords = ['嗯', '啊', '呃', '这个', '那个', '然后', '就是', '对吧']
const fallbackChoiceTexts = ['核心概念', '课堂观察', '拓展思考']

export function normalizeSourceText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function removeFillerWords(value: string): string {
  return normalizeSourceText(
    fillerWords.reduce((current, word) => current.replace(new RegExp(word, 'g'), ' '), value),
  )
}

export function extractExplicitAnswer(value: string): string {
  const match = value.match(/(?:正确答案|参考答案|答案)\s*[:：]\s*([A-Da-d]|正确|错误|对|错|[^。；;，,\n]+)/)
  return match?.[1]?.trim() ?? ''
}

export function extractLetteredOptions(value: string): BlackboardOption[] {
  const matches = Array.from(value.matchAll(/([A-Da-d])[\.\、:：]\s*([^A-Da-d答案正确参考。；;\n]+)/g))

  return matches
    .map((match) => ({
      id: `option-${match[1].toLowerCase()}`,
      label: match[1].toUpperCase(),
      text: normalizeSourceText(match[2]),
    }))
    .filter((option) => option.text.length > 0)
}

function createOption(index: number, text: string): BlackboardOption {
  const label = String.fromCharCode(65 + index)

  return {
    id: `option-${label.toLowerCase()}`,
    label,
    text,
  }
}

export function buildFallbackOptions(seedText: string, explicitAnswer = ''): BlackboardOption[] {
  const normalizedAnswer = normalizeSourceText(explicitAnswer)
  const cleanedSeed = normalizeSourceText(seedText)
    .replace(/(?:正确答案|参考答案|答案)\s*[:：].*$/, '')
    .replace(/[。；;，,]/g, ' ')
  const keywords = Array.from(
    new Set(
      cleanedSeed
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && !item.includes('判断')),
    ),
  )
  const texts = [normalizedAnswer, ...keywords, ...fallbackChoiceTexts].filter(Boolean)

  return Array.from(new Set(texts)).slice(0, 3).map((text, index) => createOption(index, text))
}

function stripOptionsAndAnswer(value: string): string {
  return normalizeSourceText(
    value
      .replace(/[A-Da-d][\.\、:：]\s*[^A-Da-d答案正确参考。；;\n]+/g, '')
      .replace(/(?:正确答案|参考答案|答案)\s*[:：]\s*([A-Da-d]|正确|错误|对|错|[^。；;，,\n]+)/g, ''),
  )
}

function resolveCorrectOptionId(options: BlackboardOption[], explicitAnswer: string): string {
  const normalizedAnswer = normalizeSourceText(explicitAnswer)
  if (!normalizedAnswer) return options[0]?.id ?? ''

  const byLabel = options.find((option) => option.label.toLowerCase() === normalizedAnswer.toLowerCase())
  if (byLabel) return byLabel.id

  const byText = options.find((option) => option.text.includes(normalizedAnswer) || normalizedAnswer.includes(option.text))
  return byText?.id ?? options[0]?.id ?? ''
}

function createBaseDraft(
  type: BlackboardActivityType,
  sourceText: string,
  cleanedText: string,
  removeFillers: boolean,
): BlackboardActivityDraft {
  return {
    type,
    sourceText,
    cleanedText,
    removeFillers,
    stem: '',
    options: [],
    correctOptionId: '',
    judgementAnswer: true,
    parseNotes: [],
  }
}

function parseClozeActivity(
  sourceText: string,
  cleanedText: string,
  removeFillers: boolean,
): BlackboardActivityDraft {
  const draft = createBaseDraft('cloze', sourceText, cleanedText, removeFillers)
  const explicitAnswer = extractExplicitAnswer(cleanedText)
  const extractedOptions = extractLetteredOptions(cleanedText)
  const options = extractedOptions.length > 0 ? extractedOptions : buildFallbackOptions(cleanedText, explicitAnswer)
  const stemBase = stripOptionsAndAnswer(cleanedText)
  const hasBlank = /____|_{2,}|（）|\(\s*\)|填空/.test(stemBase)
  const stem =
    hasBlank || !explicitAnswer
      ? stemBase || '请根据课堂内容完成填空。'
      : stemBase.replace(explicitAnswer, '____') || `${explicitAnswer} 对应的课堂要点是 ____。`

  draft.stem = stem
  draft.options = options
  draft.correctOptionId = resolveCorrectOptionId(options, explicitAnswer)
  if (explicitAnswer) draft.parseNotes.push(`已识别显式答案：${explicitAnswer}`)
  if (extractedOptions.length === 0) draft.parseNotes.push('未识别到选项，已生成演示选项')

  return draft
}

function parseJudgementActivity(
  sourceText: string,
  cleanedText: string,
  removeFillers: boolean,
): BlackboardActivityDraft {
  const draft = createBaseDraft('judgement', sourceText, cleanedText, removeFillers)
  const stem = stripOptionsAndAnswer(cleanedText).replace(/^判断[:：]?\s*/, '') || '请判断该课堂表述是否正确。'
  const isFalse = /错误|不正确|不是|错/.test(cleanedText)
  const isTrue = /正确|判断正确|是|对/.test(cleanedText)
  const judgementAnswer = isFalse ? false : true

  draft.stem = stem
  draft.options = [
    { id: 'option-true', label: 'A', text: '正确' },
    { id: 'option-false', label: 'B', text: '错误' },
  ]
  draft.judgementAnswer = judgementAnswer
  draft.correctOptionId = judgementAnswer ? 'option-true' : 'option-false'
  if (!isFalse && !isTrue) draft.parseNotes.push('未识别到明确判断信号，默认答案为正确')

  return draft
}

function parseChoiceActivity(
  sourceText: string,
  cleanedText: string,
  removeFillers: boolean,
): BlackboardActivityDraft {
  const draft = createBaseDraft('choice', sourceText, cleanedText, removeFillers)
  const explicitAnswer = extractExplicitAnswer(cleanedText)
  const extractedOptions = extractLetteredOptions(cleanedText)
  const options = extractedOptions.length > 0 ? extractedOptions : buildFallbackOptions(cleanedText, explicitAnswer)

  draft.stem = stripOptionsAndAnswer(cleanedText) || '请选择最符合课堂内容的一项。'
  draft.options = options
  draft.correctOptionId = resolveCorrectOptionId(options, explicitAnswer)
  if (explicitAnswer) draft.parseNotes.push(`已识别显式答案：${explicitAnswer}`)
  if (extractedOptions.length === 0) draft.parseNotes.push('未识别到选项，已生成演示选项')
  if (!explicitAnswer) draft.parseNotes.push('未识别到明确答案，默认选择第一项')

  return draft
}

export function parseBlackboardActivity(input: {
  sourceText: string
  requestedType: BlackboardActivityType
  removeFillers: boolean
}): BlackboardActivityDraft {
  const sourceText = input.sourceText
  const cleanedText = input.removeFillers ? removeFillerWords(sourceText) : normalizeSourceText(sourceText)

  if (input.requestedType === 'cloze') {
    return parseClozeActivity(sourceText, cleanedText, input.removeFillers)
  }

  if (input.requestedType === 'judgement') {
    return parseJudgementActivity(sourceText, cleanedText, input.removeFillers)
  }

  return parseChoiceActivity(sourceText, cleanedText, input.removeFillers)
}

export function validateBlackboardActivity(draft: BlackboardActivityDraft): string[] {
  const errors: string[] = []
  if (!draft.stem.trim()) errors.push('题干不能为空')
  if (draft.type !== 'judgement' && draft.options.filter((option) => option.text.trim()).length < 2) {
    errors.push('至少需要两个选项')
  }
  if (!draft.correctOptionId) errors.push('请选择正确答案')

  return errors
}
```

- [ ] **Step 4: Run the parser tests and verify GREEN**

Run:

```bash
npm --workspace apps/web run test -- blackboardActivity
```

Expected: PASS with `blackboardActivity.test.ts`.

- [ ] **Step 5: Commit parser helpers**

Run:

```bash
git add apps/web/src/features/smart-blackboard/blackboardActivity.ts apps/web/src/features/smart-blackboard/blackboardActivity.test.ts
git commit -m "feat: add smart blackboard parser"
```

## Task 2: Smart Blackboard Vue Page

**Files:**
- Create: `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`
- Create: `apps/web/src/features/smart-blackboard/SmartBlackboardView.vue`

- [ ] **Step 1: Write the failing component tests**

Create `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`:

```ts
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

  test('updates preview when the teacher edits the generated stem', async () => {
    const wrapper = await mountBlackboardView()

    await wrapper.get('[data-testid="blackboard-source-input"]').setValue('长江是中国第一长河。答案：长江')
    await wrapper.get('[data-testid="blackboard-parse-button"]').trigger('click')
    await wrapper.get('[data-testid="blackboard-stem-input"]').setValue('中国第一长河是____。')
    await flushPromises()

    expect(wrapper.get('[data-testid="blackboard-preview"]').text()).toContain('中国第一长河是____。')
  })

  test('shows inline validation when parsing empty source text', async () => {
    const wrapper = await mountBlackboardView()

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
```

- [ ] **Step 2: Run the component tests and verify RED**

Run:

```bash
npm --workspace apps/web run test -- SmartBlackboardView
```

Expected: FAIL because `SmartBlackboardView.vue` does not exist.

- [ ] **Step 3: Implement the Vue page**

Create `apps/web/src/features/smart-blackboard/SmartBlackboardView.vue` with this structure and behavior:

```vue
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CircleCheck, MagicStick, Plus, VideoCamera } from '@element-plus/icons-vue'
import {
  activityTypeLabels,
  demoTranscriptText,
  parseBlackboardActivity,
  validateBlackboardActivity,
  type BlackboardActivityDraft,
  type BlackboardActivityType,
} from './blackboardActivity'

const sourceMode = ref<'text' | 'video'>('text')
const requestedType = ref<BlackboardActivityType>('cloze')
const sourceText = ref('中国古代四大发明包括造纸术、印刷术、火药和____。A. 指南针 B. 地动仪 C. 浑天仪 答案：A')
const transcriptText = ref(demoTranscriptText)
const removeFillers = ref(true)
const parseError = ref('')

const draft = reactive<BlackboardActivityDraft>(
  parseBlackboardActivity({
    sourceText: sourceText.value,
    requestedType: requestedType.value,
    removeFillers: removeFillers.value,
  }),
)

const validationErrors = computed(() => validateBlackboardActivity(draft))
const selectedSourceText = computed(() => (sourceMode.value === 'video' ? transcriptText.value : sourceText.value))
const previewOptions = computed(() => draft.options.filter((option) => option.text.trim()))
const correctOption = computed(() => draft.options.find((option) => option.id === draft.correctOptionId))

function assignDraft(nextDraft: BlackboardActivityDraft) {
  Object.assign(draft, nextDraft)
}

function setType(type: BlackboardActivityType) {
  requestedType.value = type
  draft.type = type
}

function parseActivity() {
  parseError.value = ''
  if (!selectedSourceText.value.trim()) {
    parseError.value = '请输入文本后再解析'
    return
  }

  assignDraft(
    parseBlackboardActivity({
      sourceText: selectedSourceText.value,
      requestedType: requestedType.value,
      removeFillers: removeFillers.value,
    }),
  )
}

function updateCorrectOption(optionId: string) {
  draft.correctOptionId = optionId
  draft.judgementAnswer = optionId === 'option-true'
}

function addOption() {
  const nextIndex = draft.options.length
  const label = String.fromCharCode(65 + nextIndex)
  draft.options.push({
    id: `option-${label.toLowerCase()}`,
    label,
    text: `选项${label}`,
  })
  if (!draft.correctOptionId) draft.correctOptionId = draft.options[0]?.id ?? ''
}

function removeOption(optionId: string) {
  if (draft.options.length <= 2) return
  const nextOptions = draft.options.filter((option) => option.id !== optionId)
  draft.options.splice(0, draft.options.length, ...nextOptions)
  if (draft.correctOptionId === optionId) draft.correctOptionId = draft.options[0]?.id ?? ''
}
</script>
```

Template requirements:

```vue
<template>
  <main class="smart-blackboard">
    <header class="smart-blackboard__header">
      <div>
        <p class="smart-blackboard__eyebrow">智慧黑板</p>
        <h1>课堂活动制作</h1>
        <p>输入课堂文本，一键生成选词填空、判断对错和趣味选择活动。</p>
      </div>
      <ElButton type="primary" :icon="CircleCheck" :disabled="validationErrors.length > 0">完成制作</ElButton>
    </header>

    <section class="smart-blackboard__grid">
      <ElCard shadow="never" class="smart-blackboard__panel">
        <template #header>
          <div class="smart-blackboard__panel-title">
            <span>来源内容</span>
            <ElTag type="info" effect="plain">演示解析</ElTag>
          </div>
        </template>
        <ElTabs v-model="sourceMode">
          <ElTabPane label="文本输入" name="text">
            <template #label>
              <button class="smart-blackboard__tab-proxy" data-testid="blackboard-tab-text" type="button">文本输入</button>
            </template>
            <ElInput
              v-model="sourceText"
              data-testid="blackboard-source-input"
              type="textarea"
              :rows="9"
              resize="none"
              placeholder="输入题干、选项和答案，例如：A. 指南针 B. 地动仪 答案：A"
            />
          </ElTabPane>
          <ElTabPane label="视频转写" name="video">
            <template #label>
              <button class="smart-blackboard__tab-proxy" data-testid="blackboard-tab-video" type="button">视频转写</button>
            </template>
            <div class="smart-blackboard__video-placeholder">
              <ElIcon><VideoCamera /></ElIcon>
              <strong>视频声音转文字</strong>
              <span>演示环境展示转写结果，不接入真实视频处理。</span>
            </div>
            <ElInput v-model="transcriptText" type="textarea" :rows="5" resize="none" aria-label="转写结果预览" />
            <ElTag type="info" effect="plain">视频片段同步删除：暂未启用</ElTag>
          </ElTabPane>
        </ElTabs>

        <div class="smart-blackboard__source-actions">
          <ElSwitch v-model="removeFillers" active-text="删除语气词" />
          <ElButton type="primary" :icon="MagicStick" data-testid="blackboard-parse-button" @click="parseActivity">
            一键解析
          </ElButton>
        </div>
        <ElAlert v-if="parseError" type="error" :closable="false" :title="parseError" show-icon />
      </ElCard>

      <ElCard shadow="never" class="smart-blackboard__panel">
        <template #header>
          <div class="smart-blackboard__panel-title">
            <span>活动编辑</span>
            <ElTag type="success" effect="plain">{{ activityTypeLabels[draft.type] }}</ElTag>
          </div>
        </template>

        <ElRadioGroup v-model="requestedType" class="smart-blackboard__type-group">
          <ElRadioButton value="cloze" data-testid="blackboard-type-cloze" @click="setType('cloze')">选词填空</ElRadioButton>
          <ElRadioButton value="judgement" data-testid="blackboard-type-judgement" @click="setType('judgement')">判断对错</ElRadioButton>
          <ElRadioButton value="choice" data-testid="blackboard-type-choice" @click="setType('choice')">趣味选择</ElRadioButton>
        </ElRadioGroup>

        <ElForm label-position="top" class="smart-blackboard__form">
          <ElFormItem label="题干">
            <ElInput v-model="draft.stem" data-testid="blackboard-stem-input" type="textarea" :rows="4" resize="none" />
          </ElFormItem>

          <template v-if="draft.type === 'judgement'">
            <ElFormItem label="判断答案">
              <ElRadioGroup v-model="draft.correctOptionId" @change="updateCorrectOption">
                <ElRadioButton value="option-true">正确</ElRadioButton>
                <ElRadioButton value="option-false">错误</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
          </template>

          <template v-else>
            <ElFormItem label="选项与正确答案">
              <div class="smart-blackboard__options">
                <div v-for="option in draft.options" :key="option.id" class="smart-blackboard__option-row">
                  <ElRadio v-model="draft.correctOptionId" :value="option.id">{{ option.label }}</ElRadio>
                  <ElInput v-model="option.text" />
                  <ElButton text type="danger" :disabled="draft.options.length <= 2" @click="removeOption(option.id)">
                    删除
                  </ElButton>
                </div>
              </div>
              <ElButton :icon="Plus" plain @click="addOption">添加选项</ElButton>
            </ElFormItem>
          </template>
        </ElForm>

        <div class="smart-blackboard__notes">
          <ElTag v-for="note in draft.parseNotes" :key="note" type="warning" effect="plain">{{ note }}</ElTag>
          <ElTag v-for="error in validationErrors" :key="error" type="danger" effect="plain">{{ error }}</ElTag>
        </div>
      </ElCard>

      <ElCard shadow="never" class="smart-blackboard__panel smart-blackboard__preview-panel">
        <template #header>
          <div class="smart-blackboard__panel-title">
            <span>黑板预览</span>
            <ElTag effect="dark">课堂展示</ElTag>
          </div>
        </template>
        <div class="smart-blackboard__preview" data-testid="blackboard-preview">
          <div v-if="draft.stem" class="smart-blackboard__board">
            <ElTag effect="dark">{{ activityTypeLabels[draft.type] }}</ElTag>
            <h2>{{ draft.stem }}</h2>
            <div class="smart-blackboard__answer-grid">
              <div
                v-for="option in previewOptions"
                :key="option.id"
                class="smart-blackboard__answer-chip"
                :class="{ 'is-correct': option.id === draft.correctOptionId }"
              >
                <strong>{{ option.label }}</strong>
                <span>{{ option.text }}</span>
                <small v-if="option.id === draft.correctOptionId">正确答案</small>
              </div>
            </div>
            <footer>未来实验学校 · 智慧黑板演示</footer>
          </div>
          <ElEmpty v-else description="输入内容并点击一键解析后预览课堂活动" :image-size="64" />
        </div>
      </ElCard>
    </section>
  </main>
</template>
```

Scoped CSS requirements:

```vue
<style scoped>
.smart-blackboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--color-text);
}

.smart-blackboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.smart-blackboard__header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
}

.smart-blackboard__header p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

.smart-blackboard__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 800;
}

.smart-blackboard__grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.95fr) minmax(360px, 1.1fr) minmax(340px, 1fr);
  gap: 14px;
  align-items: stretch;
}

.smart-blackboard__panel {
  min-width: 0;
  border-radius: var(--radius-panel);
}

.smart-blackboard__panel-title,
.smart-blackboard__source-actions,
.smart-blackboard__option-row,
.smart-blackboard__notes {
  display: flex;
  align-items: center;
  gap: 10px;
}

.smart-blackboard__panel-title {
  justify-content: space-between;
  font-weight: 900;
}

.smart-blackboard__tab-proxy {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.smart-blackboard__video-placeholder {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  padding: 18px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
  text-align: center;
}

.smart-blackboard__source-actions {
  justify-content: space-between;
  margin-top: 12px;
}

.smart-blackboard__type-group {
  margin-bottom: 14px;
}

.smart-blackboard__form {
  display: grid;
  gap: 8px;
}

.smart-blackboard__options {
  display: grid;
  gap: 8px;
  width: 100%;
}

.smart-blackboard__option-row {
  width: 100%;
}

.smart-blackboard__option-row :deep(.el-input) {
  flex: 1;
}

.smart-blackboard__notes {
  flex-wrap: wrap;
  min-height: 28px;
}

.smart-blackboard__preview {
  min-height: 520px;
}

.smart-blackboard__board {
  display: flex;
  min-height: 520px;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border: 10px solid #334155;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 32%),
    #12312a;
  color: #f8fafc;
}

.smart-blackboard__board h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.55;
}

.smart-blackboard__answer-grid {
  display: grid;
  gap: 12px;
}

.smart-blackboard__answer-chip {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(248, 250, 252, 0.24);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.28);
}

.smart-blackboard__answer-chip.is-correct {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.16);
}

.smart-blackboard__answer-chip strong {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  background: rgba(248, 250, 252, 0.14);
}

.smart-blackboard__answer-chip small {
  color: #86efac;
  font-weight: 900;
}

.smart-blackboard__board footer {
  margin-top: auto;
  color: rgba(248, 250, 252, 0.68);
  font-size: 13px;
}

@media (max-width: 1180px) {
  .smart-blackboard__grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 4: Run the component tests and verify GREEN**

Run:

```bash
npm --workspace apps/web run test -- SmartBlackboardView
```

Expected: PASS with `SmartBlackboardView.test.ts`.

- [ ] **Step 5: Run parser and component tests together**

Run:

```bash
npm --workspace apps/web run test -- blackboardActivity SmartBlackboardView
```

Expected: PASS with both smart blackboard test files.

- [ ] **Step 6: Commit the Vue page**

Run:

```bash
git add apps/web/src/features/smart-blackboard/SmartBlackboardView.vue apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts
git commit -m "feat: add smart blackboard authoring page"
```

## Task 3: Route Integration, Readiness, And Verification

**Files:**
- Modify: `apps/web/src/router.ts`
- Modify: `apps/web/src/router.test.ts`
- Modify: `apps/web/src/features/overview/overviewData.ts`
- Modify: `apps/web/src/features/overview/OverviewView.test.ts`

- [ ] **Step 1: Write the failing route and readiness tests**

In `apps/web/src/router.test.ts`, add this test inside `describe('router guard', () => { ... })`:

```ts
  test('routes smart blackboard to the dedicated authoring page', async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
    const router = createTestRouter()

    await router.push('/blackboard')

    const matchedComponent = router.currentRoute.value.matched.at(-1)?.components?.default

    expect(router.currentRoute.value.fullPath).toBe('/blackboard')
    expect(String(matchedComponent)).toContain('smart-blackboard/SmartBlackboardView.vue')
  })
```

In `apps/web/src/features/overview/OverviewView.test.ts`, update the readiness expectation in the existing demo-ready test so it includes 智慧黑板:

```ts
    expect(Object.fromEntries(demoLaunchItems.map((item) => [item.label, item.status]))).toMatchObject({
      工作台配置: '可演示',
      数据看板: '可演示',
      应用中心: '可演示',
      告警管理: '可演示',
      智慧黑板: '可演示',
    })
```

- [ ] **Step 2: Run integration tests and verify RED**

Run:

```bash
npm --workspace apps/web run test -- router OverviewView
```

Expected: FAIL because `/blackboard` still routes to `OverviewView.vue` and overview readiness has not marked 智慧黑板 as 可演示.

- [ ] **Step 3: Update route and readiness data**

In `apps/web/src/router.ts`, replace the current blackboard child route:

```ts
  { path: 'blackboard', component: () => import('./features/overview/OverviewView.vue') },
```

with:

```ts
  { path: 'blackboard', component: () => import('./features/smart-blackboard/SmartBlackboardView.vue') },
```

In `apps/web/src/features/overview/overviewData.ts`, update the `demoLaunchItems` entry for 智慧黑板 from its incomplete status to:

```ts
  { label: '智慧黑板', status: '可演示', path: '/blackboard' },
```

If the existing entry includes additional fields such as `description` or `owner`, preserve those fields and only change `status` to `可演示`.

- [ ] **Step 4: Run integration tests and verify GREEN**

Run:

```bash
npm --workspace apps/web run test -- router OverviewView
```

Expected: PASS.

- [ ] **Step 5: Run all affected web tests**

Run:

```bash
npm --workspace apps/web run test -- blackboardActivity SmartBlackboardView router OverviewView
```

Expected: PASS.

- [ ] **Step 6: Commit integration changes**

Run:

```bash
git add apps/web/src/router.ts apps/web/src/router.test.ts apps/web/src/features/overview/overviewData.ts apps/web/src/features/overview/OverviewView.test.ts
git commit -m "feat: route smart blackboard page"
```

## Task 4: Browser QA And Final Project Verification

**Files:**
- No source files are expected to change unless verification finds a defect.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm run test
npm run lint
npm run build
```

Expected:

- `npm run test` passes for shared, web, and api workspaces.
- `npm run lint` passes TypeScript and Vue type checks.
- `npm run build` passes. Existing Rollup pure-comment and large-chunk warnings are acceptable if unchanged.

- [ ] **Step 2: Start or reuse the local dev server**

If no dev server is running on `5174`, run:

```bash
npm run dev
```

Expected: web app is available at `http://localhost:5174`.

- [ ] **Step 3: Verify the page in browser at 1366 x 768**

Open:

```text
http://localhost:5174/blackboard
```

Use the logged-in demo session if already authenticated. If redirected to login, sign in with the documented demo administrator account used earlier in the project.

Check:

- Page title shows 智慧黑板 and 课堂活动制作.
- 文本输入 tab is active by default.
- 一键解析 fills the editor and blackboard preview.
- Switching 判断对错 shows 正确/错误 controls and preview.
- Editing 题干 changes preview text.
- 视频转写 tab shows 转写结果预览 and 视频片段同步删除：暂未启用.
- `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- `document.body.scrollWidth <= document.body.clientWidth`.

- [ ] **Step 4: Fix any defects with TDD**

For each defect found in Task 4, first add or update a failing test in the closest test file:

- Parser defect: `apps/web/src/features/smart-blackboard/blackboardActivity.test.ts`
- Page interaction defect: `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`
- Route/readiness defect: `apps/web/src/router.test.ts` or `apps/web/src/features/overview/OverviewView.test.ts`

Run the targeted test to verify it fails, implement the smallest fix, then re-run the targeted test and the affected test group.

- [ ] **Step 5: Commit verification fixes if any**

If Task 4 produced source changes, run:

```bash
git add apps/web/src/features/smart-blackboard apps/web/src/router.ts apps/web/src/router.test.ts apps/web/src/features/overview/overviewData.ts apps/web/src/features/overview/OverviewView.test.ts
git commit -m "fix: polish smart blackboard demo"
```

If Task 4 produced no source changes, do not create an empty commit.

## Self-Review

- Spec coverage: Task 1 covers deterministic parser, filler removal, explicit answer extraction, fallback behavior, and validation. Task 2 covers the three-column Element Plus UI, activity editing, preview, text/video tabs, and disabled video segment deletion capability. Task 3 covers routing and overview readiness. Task 4 covers full checks and browser verification at 1366 x 768.
- Placeholder scan: No unresolved placeholder work remains in this plan. Every code-changing task includes a specific test, expected RED result, implementation target, GREEN command, and commit command.
- Type consistency: `BlackboardActivityType`, `BlackboardOption`, `BlackboardActivityDraft`, `parseBlackboardActivity`, `removeFillerWords`, `validateBlackboardActivity`, `activityTypeLabels`, and `demoTranscriptText` are defined in Task 1 and used consistently in Tasks 2 and 3.
