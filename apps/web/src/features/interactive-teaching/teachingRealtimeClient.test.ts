import { describe, expect, it } from 'vitest'

import {
  buildTeachingRealtimeUrl,
  createTeachingRealtimeClient,
  getTeachingRoomConfigFromQuery,
  shouldEnableTeachingRealtime,
} from './teachingRealtimeClient'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  readonly sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this)
  }

  send(message: string) {
    this.sent.push(message)
  }

  close() {
    this.onclose?.()
  }
}

describe('teachingRealtimeClient', () => {
  it('builds a websocket URL from the current origin', () => {
    expect(buildTeachingRealtimeUrl('http://127.0.0.1:5174')).toBe('ws://127.0.0.1:5174/api/teaching/realtime')
    expect(buildTeachingRealtimeUrl('https://demo.example.test')).toBe('wss://demo.example.test/api/teaching/realtime')
  })

  it('enables realtime only when a room query is present', () => {
    expect(shouldEnableTeachingRealtime({ room: 'demo' })).toBe(true)
    expect(shouldEnableTeachingRealtime({ room: '' })).toBe(false)
    expect(shouldEnableTeachingRealtime({})).toBe(false)
  })

  it('normalizes two-tab teaching room query config', () => {
    expect(getTeachingRoomConfigFromQuery({ room: 'demo', persona: 'teacher' })).toEqual({
      enabled: true,
      roomId: 'demo',
      persona: 'teacher',
    })

    expect(getTeachingRoomConfigFromQuery({ room: 'demo', persona: 'visitor' })).toEqual({
      enabled: true,
      roomId: 'demo',
      persona: 'observer',
    })
  })

  it('sends join and realtime event messages through the socket', () => {
    FakeWebSocket.instances = []
    const client = createTeachingRealtimeClient({
      url: 'ws://127.0.0.1:5174/api/teaching/realtime',
      roomId: 'demo',
      clientId: 'teacher-tab',
      persona: 'teacher',
      WebSocketCtor: FakeWebSocket,
    })

    client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.onopen?.()

    expect(JSON.parse(socket.sent[0])).toEqual({
      type: 'join',
      roomId: 'demo',
      clientId: 'teacher-tab',
      persona: 'teacher',
    })

    expect(client.sendEvent({ type: 'set-teacher-focus', enabled: true })).toBe(true)
    expect(JSON.parse(socket.sent[1])).toEqual({
      type: 'event',
      roomId: 'demo',
      clientId: 'teacher-tab',
      event: { type: 'set-teacher-focus', enabled: true },
    })
  })

  it('notifies snapshot and unavailable status callbacks', () => {
    FakeWebSocket.instances = []
    const snapshots: unknown[] = []
    const statuses: string[] = []
    const client = createTeachingRealtimeClient({
      url: 'ws://127.0.0.1:5174/api/teaching/realtime',
      roomId: 'demo',
      clientId: 'student-tab',
      persona: 'student',
      WebSocketCtor: FakeWebSocket,
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onStatus: (status) => statuses.push(status),
    })

    client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.onopen?.()
    socket.onmessage?.({
      data: JSON.stringify({
        type: 'snapshot',
        snapshot: {
          roomId: 'demo',
          members: [{ id: 'member-host-lin', name: '林老师', role: '主讲人' }],
          whiteboardShare: '未共享',
          desktopShare: '未共享',
          screenshots: [],
          activeQuestion: null,
          layout: '宫格',
          teacherFocus: false,
        },
      }),
    })
    socket.onerror?.()

    expect(statuses).toEqual(['connecting', 'connected', 'unavailable'])
    expect(snapshots).toHaveLength(1)
  })
})
