import { describe, expect, it } from 'vitest'

import {
  insertScreenshot,
  launchAnswerQuestion,
  recordStudentAnswer,
  seedTeachingSession,
  selectLiveLayout,
  setMemberRole,
  toggleDesktopShare,
  toggleTeacherFocus,
  toggleWhiteboardShare,
} from './teachingSession'

describe('teachingSession', () => {
  it('seed session has a host and at least five members', () => {
    expect(seedTeachingSession.members).toHaveLength(6)
    expect(seedTeachingSession.members).toContainEqual(
      expect.objectContaining({ name: '林老师', role: '主讲人' }),
    )
    expect(seedTeachingSession.members).toContainEqual(
      expect.objectContaining({ name: '周老师', role: '授课老师' }),
    )
  })

  it('sets a selected member as teaching teacher without mutating the input session', () => {
    const studentId = seedTeachingSession.members.find((member) => member.role === '学生')?.id

    const updated = setMemberRole(seedTeachingSession, studentId ?? '', '授课老师')

    expect(updated).not.toBe(seedTeachingSession)
    expect(seedTeachingSession.members.find((member) => member.id === studentId)?.role).toBe('学生')
    expect(updated.members.find((member) => member.id === studentId)?.role).toBe('授课老师')
  })

  it('sets a selected member as student without mutating the input session', () => {
    const teacherId = seedTeachingSession.members.find((member) => member.role === '授课老师')?.id

    const updated = setMemberRole(seedTeachingSession, teacherId ?? '', '学生')

    expect(updated).not.toBe(seedTeachingSession)
    expect(seedTeachingSession.members.find((member) => member.id === teacherId)?.role).toBe('授课老师')
    expect(updated.members.find((member) => member.id === teacherId)?.role).toBe('学生')
  })

  it('toggles whiteboard share state', () => {
    const sharing = toggleWhiteboardShare(seedTeachingSession)
    const stopped = toggleWhiteboardShare(sharing)

    expect(sharing.whiteboardShare).toBe('共享中')
    expect(stopped.whiteboardShare).toBe('未共享')
  })

  it('toggles desktop share state', () => {
    const sharing = toggleDesktopShare(seedTeachingSession)
    const stopped = toggleDesktopShare(sharing)

    expect(sharing.desktopShare).toBe('共享中')
    expect(stopped.desktopShare).toBe('未共享')
  })

  it('inserts a screenshot record with time and source', () => {
    const updated = insertScreenshot(seedTeachingSession, '2026-07-09T09:30:00.000Z', '白板')

    expect(updated.screenshots).toEqual([
      {
        id: 'screenshot-1',
        capturedAt: '2026-07-09T09:30:00.000Z',
        source: '白板',
      },
    ])
    expect(seedTeachingSession.screenshots).toEqual([])
  })

  it('launches an answer question responder state', () => {
    const updated = launchAnswerQuestion(seedTeachingSession, {
      id: 'question-1',
      title: '这节课的关键词是什么？',
      options: [
        { id: 'a', label: '分数' },
        { id: 'b', label: '几何' },
      ],
    })

    expect(updated.activeQuestion).toEqual({
      id: 'question-1',
      title: '这节课的关键词是什么？',
      options: [
        { id: 'a', label: '分数' },
        { id: 'b', label: '几何' },
      ],
      answers: [],
    })
  })

  it('records one answer per student and replaces the prior answer from the same student', () => {
    const studentId = seedTeachingSession.members.find((member) => member.role === '学生')?.id ?? ''
    const sessionWithQuestion = launchAnswerQuestion(seedTeachingSession, {
      id: 'question-1',
      title: '选择正确答案',
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
    })

    const firstAnswer = recordStudentAnswer(sessionWithQuestion, studentId, 'a')
    const replacedAnswer = recordStudentAnswer(firstAnswer, studentId, 'b')

    expect(replacedAnswer.activeQuestion?.answers).toEqual([{ memberId: studentId, optionId: 'b' }])
    expect(firstAnswer.activeQuestion?.answers).toEqual([{ memberId: studentId, optionId: 'a' }])
  })

  it('selects the live layout', () => {
    const updated = selectLiveLayout(seedTeachingSession, '白板优先')

    expect(updated.layout).toBe('白板优先')
  })

  it('toggles teacher speaking focus state', () => {
    const focused = toggleTeacherFocus(seedTeachingSession)
    const unfocused = toggleTeacherFocus(focused)

    expect(focused.teacherFocus).toBe(true)
    expect(unfocused.teacherFocus).toBe(false)
  })
})
