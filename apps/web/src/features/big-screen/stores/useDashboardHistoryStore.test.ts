import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardHistoryStore } from './useDashboardHistoryStore'

describe('useDashboardHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('undo and redo return isolated schema clones', () => {
    const history = useDashboardHistoryStore()
    const first = createDefaultDashboardSchema()
    const second = structuredClone(first)
    second.canvas.width = 1440

    history.push(first)

    const undoSchema = history.undo(second)
    expect(undoSchema?.canvas.width).toBe(1920)

    undoSchema!.canvas.width = 800
    expect(history.future[0]?.canvas.width).toBe(1440)

    const redoSchema = history.redo(undoSchema!)
    expect(redoSchema?.canvas.width).toBe(1440)

    redoSchema!.canvas.width = 1024
    expect(history.past.at(-1)?.canvas.width).toBe(800)
  })

  test('caps past history at 100 entries', () => {
    const history = useDashboardHistoryStore()

    for (let index = 0; index < 101; index += 1) {
      const schema = createDefaultDashboardSchema()
      schema.canvas.width = 1000 + index
      history.push(schema)
    }

    expect(history.past).toHaveLength(100)
    expect(history.past[0]?.canvas.width).toBe(1001)
  })
})
