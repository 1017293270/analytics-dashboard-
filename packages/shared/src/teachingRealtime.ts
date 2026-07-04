import { z } from 'zod'

export const teachingMemberRoleValidator = z.enum(['主讲人', '授课老师', '学生'])
export const teachingShareModeValidator = z.enum(['未共享', '共享中'])
export const teachingLayoutValidator = z.enum(['宫格', '主讲', '桌面优先', '白板优先'])

export const teachingMemberValidator = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: teachingMemberRoleValidator,
  muted: z.boolean().optional(),
  weakNetwork: z.boolean().optional(),
})

export const teachingScreenshotValidator = z.object({
  id: z.string().min(1),
  capturedAt: z.string().min(1),
  source: z.enum(['白板', '桌面']),
})

export const teachingQuestionValidator = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
})

export const teachingActiveQuestionValidator = teachingQuestionValidator.extend({
  answers: z.array(z.object({ memberId: z.string().min(1), optionId: z.string().min(1) })),
})

export const teachingRoomSnapshotValidator = z.object({
  roomId: z.string().min(1),
  members: z.array(teachingMemberValidator).min(1),
  whiteboardShare: teachingShareModeValidator,
  desktopShare: teachingShareModeValidator,
  screenshots: z.array(teachingScreenshotValidator),
  activeQuestion: teachingActiveQuestionValidator.nullable(),
  layout: teachingLayoutValidator,
  teacherFocus: z.boolean(),
})

export const teachingRealtimeClientEventValidator = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('set-member-role'),
    memberId: z.string().min(1),
    role: teachingMemberRoleValidator,
  }),
  z.object({
    type: z.literal('set-share-mode'),
    target: z.enum(['whiteboard', 'desktop']),
    mode: teachingShareModeValidator,
  }),
  z.object({
    type: z.literal('insert-screenshot'),
    capturedAt: z.string().min(1),
    source: z.enum(['白板', '桌面']),
  }),
  z.object({
    type: z.literal('launch-question'),
    question: teachingQuestionValidator,
  }),
  z.object({
    type: z.literal('record-answer'),
    memberId: z.string().min(1),
    optionId: z.string().min(1),
  }),
  z.object({
    type: z.literal('select-layout'),
    layout: teachingLayoutValidator,
  }),
  z.object({
    type: z.literal('set-teacher-focus'),
    enabled: z.boolean(),
  }),
  z.object({
    type: z.literal('signal'),
    targetClientId: z.string().min(1).optional(),
    payload: z.record(z.unknown()),
  }),
])

export const teachingRealtimeServerMessageValidator = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('snapshot'),
    snapshot: teachingRoomSnapshotValidator,
  }),
  z.object({
    type: z.literal('signal'),
    sourceClientId: z.string().min(1),
    targetClientId: z.string().min(1).optional(),
    payload: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string().min(1),
  }),
])

export const teachingRealtimeClientMessageValidator = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join'),
    roomId: z.string().min(1),
    clientId: z.string().min(1),
    persona: z.enum(['teacher', 'student', 'observer']),
  }),
  z.object({
    type: z.literal('event'),
    roomId: z.string().min(1),
    clientId: z.string().min(1),
    event: teachingRealtimeClientEventValidator,
  }),
])

export type TeachingMemberRole = z.infer<typeof teachingMemberRoleValidator>
export type TeachingShareMode = z.infer<typeof teachingShareModeValidator>
export type TeachingLayout = z.infer<typeof teachingLayoutValidator>
export type TeachingRoomSnapshot = z.infer<typeof teachingRoomSnapshotValidator>
export type TeachingRealtimeClientEvent = z.infer<typeof teachingRealtimeClientEventValidator>
export type TeachingRealtimeServerMessage = z.infer<typeof teachingRealtimeServerMessageValidator>
export type TeachingRealtimeClientMessage = z.infer<typeof teachingRealtimeClientMessageValidator>

export function createSeedTeachingRoomSnapshot(roomId: string): TeachingRoomSnapshot {
  return {
    roomId,
    members: [
      { id: 'member-host-lin', name: '林老师', role: '主讲人' },
      { id: 'member-teacher-zhou', name: '周老师', role: '授课老师', muted: true },
      { id: 'member-student-chen', name: '陈同学', role: '学生' },
      { id: 'member-student-wang', name: '王同学', role: '学生', weakNetwork: true },
      { id: 'member-student-li', name: '李同学', role: '学生' },
      { id: 'member-student-zhao', name: '赵同学', role: '学生' },
    ],
    whiteboardShare: '未共享',
    desktopShare: '未共享',
    screenshots: [],
    activeQuestion: null,
    layout: '宫格',
    teacherFocus: false,
  }
}

export function applyTeachingRealtimeEvent(
  snapshot: TeachingRoomSnapshot,
  event: TeachingRealtimeClientEvent,
): TeachingRoomSnapshot {
  const current = cloneSnapshot(snapshot)

  if (event.type === 'set-member-role') {
    return {
      ...current,
      members: current.members.map((member) =>
        member.id === event.memberId ? { ...member, role: event.role } : member,
      ),
    }
  }

  if (event.type === 'set-share-mode') {
    return {
      ...current,
      whiteboardShare: event.target === 'whiteboard' ? event.mode : current.whiteboardShare,
      desktopShare: event.target === 'desktop' ? event.mode : current.desktopShare,
    }
  }

  if (event.type === 'insert-screenshot') {
    return {
      ...current,
      screenshots: [
        ...current.screenshots,
        {
          id: `screenshot-${current.screenshots.length + 1}`,
          capturedAt: event.capturedAt,
          source: event.source,
        },
      ],
    }
  }

  if (event.type === 'launch-question') {
    return {
      ...current,
      activeQuestion: {
        ...event.question,
        options: event.question.options.map((option) => ({ ...option })),
        answers: [],
      },
    }
  }

  if (event.type === 'record-answer') {
    if (!current.activeQuestion) return current

    return {
      ...current,
      activeQuestion: {
        ...current.activeQuestion,
        answers: [
          ...current.activeQuestion.answers.filter((answer) => answer.memberId !== event.memberId),
          { memberId: event.memberId, optionId: event.optionId },
        ],
      },
    }
  }

  if (event.type === 'select-layout') {
    return { ...current, layout: event.layout }
  }

  if (event.type === 'set-teacher-focus') {
    return { ...current, teacherFocus: event.enabled }
  }

  return current
}

function cloneSnapshot(snapshot: TeachingRoomSnapshot): TeachingRoomSnapshot {
  return teachingRoomSnapshotValidator.parse(JSON.parse(JSON.stringify(snapshot)))
}
