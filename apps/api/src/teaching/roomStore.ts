import {
  applyTeachingRealtimeEvent,
  createSeedTeachingRoomSnapshot,
  teachingRoomSnapshotValidator,
  type TeachingRealtimeClientEvent,
  type TeachingRoomSnapshot,
} from '@analytics/shared'

export type TeachingRoomStore = ReturnType<typeof createTeachingRoomStore>

export function createTeachingRoomStore() {
  const rooms = new Map<string, TeachingRoomSnapshot>()

  function getOrCreateRoom(roomId: string) {
    const existing = rooms.get(roomId)
    if (existing) return existing

    const created = createSeedTeachingRoomSnapshot(roomId)
    rooms.set(roomId, created)
    return created
  }

  return {
    joinRoom(roomId: string, _clientId: string) {
      return cloneSnapshot(getOrCreateRoom(roomId))
    },
    getSnapshot(roomId: string) {
      const snapshot = rooms.get(roomId)
      return snapshot ? cloneSnapshot(snapshot) : null
    },
    applyEvent(roomId: string, event: TeachingRealtimeClientEvent) {
      const nextSnapshot = applyTeachingRealtimeEvent(getOrCreateRoom(roomId), event)
      rooms.set(roomId, nextSnapshot)
      return cloneSnapshot(nextSnapshot)
    },
  }
}

function cloneSnapshot(snapshot: TeachingRoomSnapshot): TeachingRoomSnapshot {
  return teachingRoomSnapshotValidator.parse(JSON.parse(JSON.stringify(snapshot)))
}
