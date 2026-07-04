export type TeachingMemberRole = '主讲人' | '授课老师' | '学生'
export type TeachingShareMode = '未共享' | '共享中'
export type TeachingLayout = '宫格' | '主讲' | '桌面优先' | '白板优先'

export interface TeachingMember {
  id: string
  name: string
  role: TeachingMemberRole
  muted?: boolean
  weakNetwork?: boolean
}

export interface TeachingScreenshot {
  id: string
  capturedAt: string
  source: '白板' | '桌面'
}

export interface AnswerQuestion {
  id: string
  title: string
  options: Array<{
    id: string
    label: string
  }>
  answers: Array<{
    memberId: string
    optionId: string
  }>
}

export interface TeachingSession {
  id: string
  members: TeachingMember[]
  whiteboardShare: TeachingShareMode
  desktopShare: TeachingShareMode
  screenshots: TeachingScreenshot[]
  activeQuestion: AnswerQuestion | null
  layout: TeachingLayout
  teacherFocus: boolean
}

export const seedTeachingSession: TeachingSession = {
  id: 'interactive-teaching-demo',
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

export function setMemberRole(
  session: TeachingSession,
  memberId: string,
  role: TeachingMemberRole,
): TeachingSession {
  return {
    ...session,
    members: session.members.map((member) => (member.id === memberId ? { ...member, role } : member)),
  }
}

export function toggleWhiteboardShare(session: TeachingSession): TeachingSession {
  return {
    ...session,
    whiteboardShare: toggleShareMode(session.whiteboardShare),
  }
}

export function toggleDesktopShare(session: TeachingSession): TeachingSession {
  return {
    ...session,
    desktopShare: toggleShareMode(session.desktopShare),
  }
}

export function insertScreenshot(
  session: TeachingSession,
  capturedAt = new Date().toISOString(),
  source: TeachingScreenshot['source'] = '白板',
): TeachingSession {
  return {
    ...session,
    screenshots: [
      ...session.screenshots,
      {
        id: `screenshot-${session.screenshots.length + 1}`,
        capturedAt,
        source,
      },
    ],
  }
}

export function launchAnswerQuestion(
  session: TeachingSession,
  question: Omit<AnswerQuestion, 'answers'>,
): TeachingSession {
  return {
    ...session,
    activeQuestion: {
      ...question,
      options: question.options.map((option) => ({ ...option })),
      answers: [],
    },
  }
}

export function recordStudentAnswer(
  session: TeachingSession,
  memberId: string,
  optionId: string,
): TeachingSession {
  if (!session.activeQuestion) {
    return session
  }

  return {
    ...session,
    activeQuestion: {
      ...session.activeQuestion,
      answers: [
        ...session.activeQuestion.answers.filter((answer) => answer.memberId !== memberId),
        { memberId, optionId },
      ],
    },
  }
}

export function selectLiveLayout(session: TeachingSession, layout: TeachingLayout): TeachingSession {
  return {
    ...session,
    layout,
  }
}

export function toggleTeacherFocus(session: TeachingSession): TeachingSession {
  return {
    ...session,
    teacherFocus: !session.teacherFocus,
  }
}

function toggleShareMode(mode: TeachingShareMode): TeachingShareMode {
  return mode === '未共享' ? '共享中' : '未共享'
}
