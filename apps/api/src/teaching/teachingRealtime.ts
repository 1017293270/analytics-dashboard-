import type { IncomingMessage, Server } from 'node:http'
import {
  teachingRealtimeClientMessageValidator,
  type TeachingRealtimeServerMessage,
} from '@analytics/shared'
import { WebSocketServer, type WebSocket } from 'ws'
import { createTeachingRoomStore } from './roomStore.js'

type ClientState = {
  clientId: string
  roomId: string
}

export function attachTeachingRealtimeServer(server: Server) {
  const websocketServer = new WebSocketServer({ noServer: true })
  const roomStore = createTeachingRoomStore()
  const clients = new Map<WebSocket, ClientState>()

  server.on('upgrade', (request, socket, head) => {
    if (!isTeachingRealtimeRequest(request)) {
      socket.destroy()
      return
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request)
    })
  })

  websocketServer.on('connection', (websocket) => {
    websocket.on('message', (rawMessage) => {
      try {
        const message = teachingRealtimeClientMessageValidator.parse(JSON.parse(rawMessage.toString()))

        if (message.type === 'join') {
          clients.set(websocket, { clientId: message.clientId, roomId: message.roomId })
          const snapshot = roomStore.joinRoom(message.roomId, message.clientId)
          sendMessage(websocket, { type: 'snapshot', snapshot })
          return
        }

        const state = clients.get(websocket)
        if (!state || state.clientId !== message.clientId || state.roomId !== message.roomId) {
          sendMessage(websocket, { type: 'error', message: 'Join the teaching room before sending events' })
          return
        }

        if (message.event.type === 'signal') {
          broadcastToRoom(clients, state.roomId, {
            type: 'signal',
            sourceClientId: state.clientId,
            targetClientId: message.event.targetClientId,
            payload: message.event.payload,
          })
          return
        }

        const snapshot = roomStore.applyEvent(state.roomId, message.event)
        broadcastToRoom(clients, state.roomId, { type: 'snapshot', snapshot })
      } catch {
        sendMessage(websocket, { type: 'error', message: 'Invalid teaching realtime message' })
      }
    })

    websocket.on('close', () => {
      clients.delete(websocket)
    })
  })
}

function isTeachingRealtimeRequest(request: IncomingMessage) {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost')
  return requestUrl.pathname === '/api/teaching/realtime'
}

function broadcastToRoom(
  clients: Map<WebSocket, ClientState>,
  roomId: string,
  message: TeachingRealtimeServerMessage,
) {
  for (const [client, state] of clients.entries()) {
    if (state.roomId === roomId) sendMessage(client, message)
  }
}

function sendMessage(websocket: WebSocket, message: TeachingRealtimeServerMessage) {
  if (websocket.readyState !== 1) return

  websocket.send(JSON.stringify(message))
}
