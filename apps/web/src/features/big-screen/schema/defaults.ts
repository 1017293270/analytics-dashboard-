import type { DashboardSchema } from '@analytics/shared'
import { bigScreenText } from '../i18n/zh-CN'

export function createDefaultDashboardSchema(): DashboardSchema {
  return {
    version: '1.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: { type: 'color', value: '#0b1220' },
      scaleMode: 'fit-screen',
    },
    theme: {
      name: bigScreenText.presets.aiOperations.name,
      colors: ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'],
      fontFamily: 'Inter',
    },
    components: [],
    dataBindings: {},
    refresh: { mode: 'manual' },
  }
}
