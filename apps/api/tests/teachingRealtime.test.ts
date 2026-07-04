import { describe, expect, it } from 'vitest'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { WebSocket } from 'ws'

import { createTeachingRoomStore } from '../src/teaching/roomStore'
import { attachTeachingRealtimeServer } from '../src/teaching/teachingRealtime'

describe('teaching realtime room store', () => {
  it('creates an isolated room snapshot on first join', () => {
    const store = createTeachingRoomStore()

    const first = store.joinRoom('room-a', 'teacher-tab')
    const second = store.joinRoom('room-b', 'teacher-tab')

    expect(first.roomId).toBe('room-a')
    expect(second.roomId).toBe('room-b')
    expect(first).not.toBe(second)
  })

  it('applies room events to the selected room only', () => {
    const store = createTeachingRoomStore()
    store.joinRoom('room-a', 'teacher-tab')
    store.joinRoom('room-b', 'teacher-tab')

    const updated = store.applyEvent('room-a', {
      type: 'set-member-role',
      memberId: 'member-student-chen',
      role: '授课老师',
    })

    expect(updated.members.find((member) => member.id === 'member-student-chen')?.role).toBe('授课老师')
    expect(store.getSnapshot('room-b')?.members.find((member) => member.id === 'member-student-chen')?.role).toBe(
      '学生',
    )
  })

  it('records one answer per student', () => {
    const store = createTeachingRoomStore()
    store.joinRoom('room-a', 'teacher-tab')
    store.applyEvent('room-a', {
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
    store.applyEvent('room-a', { type: 'record-answer', memberId: 'member-student-chen', optionId: 'a' })
    const updated = store.applyEvent('room-a', {
      type: 'record-answer',
      memberId: 'member-student-chen',
      optionId: 'b',
    })

    expect(updated.activeQuestion?.answers).toEqual([{ memberId: 'member-student-chen', optionId: 'b' }])
  })

  it('broadcasts room snapshots between websocket clients', async () => {
    const server = createServer()
    attachTeachingRealtimeServer(server)

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })

    const port = (server.address() as AddressInfo).port
    const teacher = new WebSocket(`ws://127.0.0.1:${port}/api/teaching/realtime`)
    const student = new WebSocket(`ws://127.0.0.1:${port}/api/teaching/realtime`)

    try {
      await Promise.all([waitForOpen(teacher), waitForOpen(student)])
      teacher.send(JSON.stringify({ type: 'join', roomId: 'room-a', clientId: 'teacher-tab', persona: 'teacher' }))
      student.send(JSON.stringify({ type: 'join', roomId: 'room-a', clientId: 'student-tab', persona: 'student' }))

      await waitForSnapshot(student, (snapshot) => snapshot.roomId === 'room-a')

      teacher.send(
        JSON.stringify({
          type: 'event',
          roomId: 'room-a',
          clientId: 'teacher-tab',
          event: { type: 'set-teacher-focus', enabled: true },
        }),
      )

      const focusedSnapshot = await waitForSnapshot(student, (snapshot) => snapshot.teacherFocus === true)
      expect(focusedSnapshot.teacherFocus).toBe(true)
    } finally {
      teacher.close()
      student.close()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it('rejects websocket mutation events before joining a room', async () => {
    const server = createServer()
    attachTeachingRealtimeServer(server)

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })

    const port = (server.address() as AddressInfo).port
    const websocket = new WebSocket(`ws://127.0.0.1:${port}/api/teaching/realtime`)

    try {
      await waitForOpen(websocket)
      websocket.send(
        JSON.stringify({
          type: 'event',
          roomId: 'room-a',
          clientId: 'teacher-tab',
          event: { type: 'set-teacher-focus', enabled: true },
        }),
      )

      await expect(waitForError(websocket)).resolves.toEqual({
        type: 'error',
        message: 'Join the teaching room before sending events',
      })
    } finally {
      websocket.close()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it('rejects websocket mutation events with a mismatched joined room', async () => {
    const server = createServer()
    attachTeachingRealtimeServer(server)

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })

    const port = (server.address() as AddressInfo).port
    const websocket = new WebSocket(`ws://127.0.0.1:${port}/api/teaching/realtime`)

    try {
      await waitForOpen(websocket)
      websocket.send(JSON.stringify({ type: 'join', roomId: 'room-a', clientId: 'teacher-tab', persona: 'teacher' }))
      await waitForSnapshot(websocket, (snapshot) => snapshot.roomId === 'room-a')
      websocket.send(
        JSON.stringify({
          type: 'event',
          roomId: 'room-b',
          clientId: 'teacher-tab',
          event: { type: 'set-teacher-focus', enabled: true },
        }),
      )

      await expect(waitForError(websocket)).resolves.toEqual({
        type: 'error',
        message: 'Join the teaching room before sending events',
      })
    } finally {
      websocket.close()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })
})

function waitForOpen(websocket: WebSocket) {
  return new Promise<void>((resolve, reject) => {
    websocket.once('open', () => resolve())
    websocket.once('error', reject)
  })
}

function waitForSnapshot(
  websocket: WebSocket,
  predicate: (snapshot: { roomId: string; teacherFocus: boolean }) => boolean,
) {
  return new Promise<{ roomId: string; teacherFocus: boolean }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      websocket.off('message', onMessage)
      reject(new Error('Timed out waiting for teaching room snapshot'))
    }, 2000)

    function onMessage(rawMessage: Buffer) {
      const message = JSON.parse(rawMessage.toString())
      if (message.type !== 'snapshot') return
      if (!predicate(message.snapshot)) return

      clearTimeout(timeout)
      websocket.off('message', onMessage)
      resolve(message.snapshot)
    }

    websocket.on('message', onMessage)
  })
}

function waitForError(websocket: WebSocket) {
  return new Promise<{ type: 'error'; message: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      websocket.off('message', onMessage)
      reject(new Error('Timed out waiting for teaching realtime error'))
    }, 2000)

    function onMessage(rawMessage: Buffer) {
      const message = JSON.parse(rawMessage.toString())
      if (message.type !== 'error') return

      clearTimeout(timeout)
      websocket.off('message', onMessage)
      resolve(message)
    }

    websocket.on('message', onMessage)
  })
}
