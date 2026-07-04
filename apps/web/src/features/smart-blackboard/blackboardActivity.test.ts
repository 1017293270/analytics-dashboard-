import { describe, expect, test } from 'vitest'
import {
  activityTypeLabels,
  buildBlackboardActivityTitle,
  createCompletedBlackboardActivity,
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

  test('does not treat a cloze activity label as an existing blank marker', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'cloze',
      removeFillers: false,
      sourceText: '选词填空：指南针、造纸术、火药、印刷术是中国古代四大发明。答案：指南针',
    })

    expect(draft.stem).toContain('____、造纸术、火药、印刷术是中国古代四大发明。')
    expect(draft.options[0]).toMatchObject({ id: 'option-a', label: 'A', text: '指南针' })
    expect(draft.correctOptionId).toBe('option-a')
  })

  test('keeps common blank bracket markers instead of replacing the explicit answer elsewhere', () => {
    const sources = [
      '指南针是中国古代四大发明之一，请填写（ ）。答案：指南针',
      '指南针是中国古代四大发明之一，请填写[]。答案：指南针',
      '指南针是中国古代四大发明之一，请填写【】。答案：指南针',
    ]

    for (const sourceText of sources) {
      const draft = parseBlackboardActivity({
        requestedType: 'cloze',
        removeFillers: false,
        sourceText,
      })

      expect(draft.stem).toContain('指南针是中国古代四大发明之一')
      expect(draft.stem).not.toContain('答案')
      expect(draft.stem).not.toContain('____')
      expect(draft.options[0]).toMatchObject({ id: 'option-a', label: 'A', text: '指南针' })
      expect(draft.correctOptionId).toBe('option-a')
    }
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

  test('keeps option text that contains letters or answer-related Chinese words', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'choice',
      removeFillers: false,
      sourceText: '下列哪项是遗传物质？A. DNA B. 正确说法 C. 答案解析 答案：A',
    })

    expect(draft.options.map((option) => option.text)).toEqual(['DNA', '正确说法', '答案解析'])
    expect(draft.correctOptionId).toBe('option-a')
  })

  test('parses compact lettered options without spaces', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'cloze',
      removeFillers: false,
      sourceText: '中国古代四大发明包括造纸术、印刷术、火药和____。A.指南针B.地动仪C.浑天仪答案：A',
    })

    expect(draft.options.map((option) => option.text)).toEqual(['指南针', '地动仪', '浑天仪'])
    expect(draft.correctOptionId).toBe('option-a')
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

  test('rejects stale correct answers that no longer point to an editable option', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'choice',
      removeFillers: false,
      sourceText: '下列哪一项属于可再生能源？A. 煤炭 B. 风能 C. 石油 正确答案：风能',
    })

    expect(validateBlackboardActivity({ ...draft, correctOptionId: 'missing-option' })).toContain('请选择正确答案')
    expect(
      validateBlackboardActivity({
        ...draft,
        type: 'judgement',
        options: [
          { id: 'option-true', label: 'A', text: '正确' },
          { id: 'option-false', label: 'B', text: '错误' },
        ],
        correctOptionId: 'missing-option',
      }),
    ).toContain('请选择正确答案')
  })

  test('creates a completed activity record with cloned draft and readable answer summary', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'cloze',
      removeFillers: true,
      sourceText: '中国古代四大发明包括造纸术、印刷术、火药和____。A. 指南针 B. 地动仪 C. 浑天仪 答案：A',
    })

    const completed = createCompletedBlackboardActivity(draft, {
      id: 'activity-1',
      sourceMode: 'text',
      completedAt: '2026-07-09 10:40',
    })

    expect(completed).toMatchObject({
      id: 'activity-1',
      title: '中国古代四大发明包括造纸术、印刷术、火药和____。',
      type: 'cloze',
      typeLabel: '选词填空',
      correctAnswerText: 'A. 指南针',
      sourceLabel: '文本输入',
      status: '已完成',
      completedAt: '2026-07-09 10:40',
    })

    draft.options[0].text = '已修改'
    expect(completed.draft.options[0].text).toBe('指南针')
  })

  test('builds compact activity titles and rejects invalid completion drafts', () => {
    const draft = parseBlackboardActivity({
      requestedType: 'choice',
      removeFillers: false,
      sourceText: '下列哪一项属于可再生能源？A. 煤炭 B. 风能 C. 石油 正确答案：风能',
    })

    expect(buildBlackboardActivityTitle('  这是一段非常长的题干，用来验证课堂活动列表里标题不会无限撑开页面布局。  ')).toBe(
      '这是一段非常长的题干，用来验证课堂活动列表里标题不会无限撑开页面...',
    )
    expect(() =>
      createCompletedBlackboardActivity(
        {
          ...draft,
          stem: '',
          options: [],
          correctOptionId: '',
        },
        {
          id: 'activity-invalid',
          sourceMode: 'text',
          completedAt: '2026-07-09 10:40',
        },
      ),
    ).toThrow('题干不能为空')
  })
})
