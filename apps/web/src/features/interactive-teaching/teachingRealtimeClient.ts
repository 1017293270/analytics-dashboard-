import {
  teachingRealtimeClientMessageValidator,
  teachingRealtimeServerMessageValidator,
  type TeachingRealtimeClientEvent,
  type TeachingRoomSnapshot,
} from '@analytics/shared'

export type TeachingRoomPersona = 'teacher' | 'student' | 'observer'
export type TeachingRealtimeConnectionStatus = 'connecting' | 'connected' | 'unavailable'

export type TeachingRoomConfig = {
  enabled: boolean
  roomId: string
  persona: TeachingRoomPersona
}

export type QueryValueLike = string | null | undefined
export type QueryLike = Record<string, QueryValueLike | QueryValueLike[]>

type WebSocketLike = {
  onopen: (() => void) | null
  onmessage: ((event: { data: string }) => void) | null
  onerror: (() => void) | null
  onclose: (() => void) | null
  send(message: string): void
  close(): void
}

type WebSocketConstructor = new (url: string) => WebSocketLike

type TeachingRealtimeClientOptions = {
  url: string
  roomId: string
  clientId: string
  persona: TeachingRoomPersona
  WebSocketCtor?: WebSocketConstructor
  onSnapshot?: (snapshot: TeachingRoomSnapshot) => void
  onStatus?: (status: TeachingRealtimeConnectionStatus) => void
}

export function buildTeachingRealtimeUrl(origin = window.location.origin) {
  const url = new URL(origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/api/teaching/realtime'
  url.search = ''
  url.hash = ''

  return url.toString()
}

export function shouldEnableTeachingRealtime(query: QueryLike) {
  return normalizeQueryValue(query.room).length > 0
}

export function getTeachingRoomConfigFromQuery(query: QueryLike): TeachingRoomConfig {
  const roomId = normalizeQueryValue(query.room)
  const persona = normalizePersona(normalizeQueryValue(query.persona))

  return {
    enabled: roomId.length > 0,
    roomId,
    persona,
  }
}

function normalizeQueryValue(value: QueryValueLike | QueryValueLike[]) {
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string')?.trim() ?? ''
  return value?.trim() ?? ''
}

function normalizePersona(value: string): TeachingRoomPersona {
  if (value === 'teacher' || value === 'student') return value
  return 'observer'
}

export function createTeachingRealtimeClient(options: TeachingRealtimeClientOptions) {
  let socket: WebSocketLike | null = null
  let isOpen = false

  function notifyStatus(status: TeachingRealtimeConnectionStatus) {
    options.onStatus?.(status)
  }

  function sendMessage(message: unknown) {
    if (!socket || !isOpen) return false

    socket.send(JSON.stringify(message))
    return true
  }

  return {
    connect() {
      const SocketCtor = options.WebSocketCtor ?? getBrowserWebSocket()
      if (!SocketCtor) {
        notifyStatus('unavailable')
        return
      }

      notifyStatus('connecting')
      socket = new SocketCtor(options.url)
      socket.onopen = () => {
        isOpen = true
        notifyStatus('connected')
        sendMessage(
          teachingRealtimeClientMessageValidator.parse({
            type: 'join',
            roomId: options.roomId,
            clientId: options.clientId,
            persona: options.persona,
          }),
        )
      }
      socket.onmessage = (event) => {
        const message = teachingRealtimeServerMessageValidator.parse(JSON.parse(event.data))
        if (message.type === 'snapshot') {
          options.onSnapshot?.(message.snapshot)
        }
      }
      socket.onerror = () => {
        isOpen = false
        notifyStatus('unavailable')
      }
      socket.onclose = () => {
        isOpen = false
        notifyStatus('unavailable')
      }
    },
    sendEvent(event: TeachingRealtimeClientEvent) {
      return sendMessage(
        teachingRealtimeClientMessageValidator.parse({
          type: 'event',
          roomId: options.roomId,
          clientId: options.clientId,
          event,
        }),
      )
    },
    close() {
      socket?.close()
    },
  }
}

function getBrowserWebSocket(): WebSocketConstructor | undefined {
  if (typeof WebSocket === 'undefined') return undefined
  return WebSocket as unknown as WebSocketConstructor
}
