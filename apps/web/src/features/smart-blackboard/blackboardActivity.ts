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
const explicitAnswerPattern = /(?:正确答案|参考答案|答案)\s*[:：]\s*([A-Da-d]|正确|错误|对|错|[^。；;，,\n]+)/
const blankPattern = /____|_{2,}|（）|\(\s*\)|填空/

export function normalizeSourceText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function removeFillerWords(value: string): string {
  return normalizeSourceText(
    fillerWords.reduce((current, word) => current.replace(new RegExp(word, 'g'), ' '), value),
  )
}

export function extractExplicitAnswer(value: string): string {
  return value.match(explicitAnswerPattern)?.[1]?.trim() ?? ''
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
    .replace(/[。；;，,？?！!]/g, ' ')
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
  const stem =
    blankPattern.test(stemBase) || !explicitAnswer
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
