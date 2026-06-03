import type { DashboardSchema } from '@analytics/shared'
import { defineStore } from 'pinia'

type HistoryState = { past: DashboardSchema[]; future: DashboardSchema[] }

export const useDashboardHistoryStore = defineStore('dashboard-history', {
  state: (): HistoryState => ({ past: [], future: [] }),
  actions: {
    push(previous: DashboardSchema) {
      this.past = [...this.past, structuredClone(previous)]
      this.future = []
    },
    undo(current: DashboardSchema): DashboardSchema | null {
      const previous = this.past.at(-1)
      if (!previous) return null
      this.past = this.past.slice(0, -1)
      this.future = [structuredClone(current), ...this.future]
      return structuredClone(previous)
    },
    redo(current: DashboardSchema): DashboardSchema | null {
      const next = this.future[0]
      if (!next) return null
      this.future = this.future.slice(1)
      this.past = [...this.past, structuredClone(current)]
      return structuredClone(next)
    },
  },
})
