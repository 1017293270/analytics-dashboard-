import { describe, expect, it } from 'vitest'

import {
  applyTeachingRealtimeEvent,
  createSeedTeachingRoomSnapshot,
  teachingRealtimeClientEventValidator,
  teachingRealtimeClientMessageValidator,
  teachingRealtimeServerMessageValidator,
} from './teachingRealtime'

describe('teachingRealtime shared contract', () => {
  it('validates role, layout, answer, and signaling client events', () => {
    expect(() =>
      teachingRealtimeClientEventValidator.parse({
        type: 'set-member-role',
        memberId: 'member-student-chen',
        role: '授课老师',
      }),
    ).not.toThrow()

    expect(() =>
      teachingRealtimeClientEventValidator.parse({
        type: 'select-layout',
        layout: '白板优先',
      }),
    ).not.toThrow()

    expect(() =>
      teachingRealtimeClientEventValidator.parse({
        type: 'record-answer',
        memberId: 'member-student-chen',
        optionId: 'a',
      }),
    ).not.toThrow()

    expect(() =>
      teachingRealtimeClientEventValidator.parse({
        type: 'signal',
        targetClientId: 'student-tab',
        payload: { kind: 'offer', sdp: 'demo-sdp' },
      }),
    ).not.toThrow()
  })

  it('rejects invalid realtime role and layout events', () => {
    expect(() =>
      teachingRealtimeClientEventValidator.parse({
        type: 'set-member-role',
        memberId: 'member-student-chen',
        role: '校外访客',
      }),
    ).toThrow()

    expect(() =>
      teachingRealtimeClientEventValidator.parse({
        type: 'select-layout',
        layout: '全屏营销页',
      }),
    ).toThrow()
  })

  it('applies room events without mutating the original snapshot', () => {
    const snapshot = createSeedTeachingRoomSnapshot('room-demo')
    const withTeacher = applyTeachingRealtimeEvent(snapshot, {
      type: 'set-member-role',
      memberId: 'member-student-chen',
      role: '授课老师',
    })
    const withLayout = applyTeachingRealtimeEvent(withTeacher, {
      type: 'select-layout',
      layout: '白板优先',
    })
    const withFocus = applyTeachingRealtimeEvent(withLayout, {
      type: 'set-teacher-focus',
      enabled: true,
    })

    expect(snapshot.members.find((member) => member.id === 'member-student-chen')?.role).toBe('学生')
    expect(withTeacher.members.find((member) => member.id === 'member-student-chen')?.role).toBe('授课老师')
    expect(withLayout.layout).toBe('白板优先')
    expect(withFocus.teacherFocus).toBe(true)
  })

  it('replaces the same student answer in realtime snapshots', () => {
    const snapshot = applyTeachingRealtimeEvent(createSeedTeachingRoomSnapshot('room-demo'), {
      type: 'launch-question',
      question: {
        id: 'question-keyword',
        title: '这节课的关键词是什么？',
        options: [
          { id: 'a', label: '分数' },
          { id: 'b', label: '几何' },
        ],
      },
    })

    const first = applyTeachingRealtimeEvent(snapshot, {
      type: 'record-answer',
      memberId: 'member-student-chen',
      optionId: 'a',
    })
    const replaced = applyTeachingRealtimeEvent(first, {
      type: 'record-answer',
      memberId: 'member-student-chen',
      optionId: 'b',
    })

    expect(replaced.activeQuestion?.answers).toEqual([{ memberId: 'member-student-chen', optionId: 'b' }])
  })

  it('validates server snapshot and signaling messages', () => {
    const snapshot = createSeedTeachingRoomSnapshot('room-demo')

    expect(() =>
      teachingRealtimeServerMessageValidator.parse({
        type: 'snapshot',
        snapshot,
      }),
    ).not.toThrow()

    expect(() =>
      teachingRealtimeServerMessageValidator.parse({
        type: 'signal',
        sourceClientId: 'teacher-tab',
        targetClientId: 'student-tab',
        payload: { kind: 'ice-candidate', candidate: 'candidate:demo' },
      }),
    ).not.toThrow()
  })

  it('validates websocket join and event messages', () => {
    expect(() =>
      teachingRealtimeClientMessageValidator.parse({
        type: 'join',
        roomId: 'demo',
        clientId: 'teacher-tab',
        persona: 'teacher',
      }),
    ).not.toThrow()

    expect(() =>
      teachingRealtimeClientMessageValidator.parse({
        type: 'event',
        roomId: 'demo',
        clientId: 'teacher-tab',
        event: {
          type: 'set-teacher-focus',
          enabled: true,
        },
      }),
    ).not.toThrow()
  })
})
