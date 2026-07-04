import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from 'vue'
import type { TeachingRealtimeClientEvent, TeachingRoomSnapshot } from '@analytics/shared'
import type { TeachingSession } from './teachingSession'
import { seedTeachingSession } from './teachingSession'
import {
  buildTeachingRealtimeUrl,
  createTeachingRealtimeClient,
  getTeachingRoomConfigFromQuery,
  type QueryLike,
  type TeachingRealtimeConnectionStatus,
} from './teachingRealtimeClient'

type TeachingRealtimeClient = ReturnType<typeof createTeachingRealtimeClient>

type UseTeachingRoomOptions = {
  origin?: string
  clientId?: string
  createClient?: typeof createTeachingRealtimeClient
}

export function useTeachingRoom(query: QueryLike, options: UseTeachingRoomOptions = {}) {
  const roomConfig = computed(() => getTeachingRoomConfigFromQuery(query))
  const session = ref<TeachingSession>(cloneSession(seedTeachingSession))
  const connectionStatus = ref<TeachingRealtimeConnectionStatus | 'disabled'>('disabled')
  let client: TeachingRealtimeClient | null = null

  const realtimeStatusText = computed(() => buildRealtimeStatusText(roomConfig, connectionStatus.value))
  const realtimeStatusType = computed(() => {
    if (!roomConfig.value.enabled) return 'info'
    if (connectionStatus.value === 'connected') return 'success'
    return 'warning'
  })

  onMounted(() => {
    if (!roomConfig.value.enabled) return

    const createClient = options.createClient ?? createTeachingRealtimeClient
    client = createClient({
      url: buildTeachingRealtimeUrl(options.origin),
      roomId: roomConfig.value.roomId,
      clientId: options.clientId ?? `${roomConfig.value.persona}-tab`,
      persona: roomConfig.value.persona,
      onSnapshot: (snapshot) => {
        session.value = snapshotToSession(snapshot)
      },
      onStatus: (status) => {
        connectionStatus.value = status
      },
    })
    client.connect()
  })

  onBeforeUnmount(() => {
    client?.close()
  })

  function applyLocalSession(nextSession: TeachingSession) {
    session.value = cloneSession(nextSession)
  }

  function sendRealtimeEvent(event: TeachingRealtimeClientEvent) {
    return Boolean(client?.sendEvent(event))
  }

  function updateSession(nextSession: TeachingSession, event?: TeachingRealtimeClientEvent) {
    applyLocalSession(nextSession)
    if (event) sendRealtimeEvent(event)
  }

  return {
    session,
    roomConfig,
    connectionStatus,
    realtimeStatusText,
    realtimeStatusType,
    applyLocalSession,
    sendRealtimeEvent,
    updateSession,
  }
}

function buildRealtimeStatusText(
  roomConfig: ComputedRef<ReturnType<typeof getTeachingRoomConfigFromQuery>>,
  status: TeachingRealtimeConnectionStatus | 'disabled',
) {
  if (!roomConfig.value.enabled) return '实时连接未启用'
  if (status === 'connected') return `WebSocket 状态同步：${roomConfig.value.roomId}`
  if (status === 'connecting') return `正在连接本地课堂：${roomConfig.value.roomId}`
  return `实时连接不可用，本地演示：${roomConfig.value.roomId}`
}

function snapshotToSession(snapshot: TeachingRoomSnapshot): TeachingSession {
  return {
    id: snapshot.roomId,
    members: snapshot.members.map((member) => ({ ...member })),
    whiteboardShare: snapshot.whiteboardShare,
    desktopShare: snapshot.desktopShare,
    screenshots: snapshot.screenshots.map((screenshot) => ({ ...screenshot })),
    activeQuestion: snapshot.activeQuestion
      ? {
          ...snapshot.activeQuestion,
          options: snapshot.activeQuestion.options.map((option) => ({ ...option })),
          answers: snapshot.activeQuestion.answers.map((answer) => ({ ...answer })),
        }
      : null,
    layout: snapshot.layout,
    teacherFocus: snapshot.teacherFocus,
  }
}

function cloneSession(source: TeachingSession): TeachingSession {
  return {
    ...source,
    members: source.members.map((member) => ({ ...member })),
    screenshots: source.screenshots.map((screenshot) => ({ ...screenshot })),
    activeQuestion: source.activeQuestion
      ? {
          ...source.activeQuestion,
          options: source.activeQuestion.options.map((option) => ({ ...option })),
          answers: source.activeQuestion.answers.map((answer) => ({ ...answer })),
        }
      : null,
  }
}
