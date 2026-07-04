import { dashboardComponentValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { componentRegistry } from './registry'
import { createComponentFromPaletteEntry, getWorkbenchPaletteEntries } from './paletteEntries'

describe('workbench palette entries', () => {
  test('exposes at least thirty tender-demo component entries across required groups', () => {
    const entries = getWorkbenchPaletteEntries()
    const ids = new Set(entries.map((entry) => entry.id))
    const groups = new Set(entries.map((entry) => entry.group))

    expect(entries.length).toBeGreaterThanOrEqual(30)
    expect(ids.size).toBe(entries.length)
    expect(groups).toEqual(
      new Set(['数据指标', '图表组件', '设备状态', '告警组件', '应用入口', '表格组件', '文本图片', '第三方网页']),
    )
    expect(entries.some((entry) => entry.id === 'third-party-web' && entry.type === 'web-embed')).toBe(true)
  })

  test('maps every visible entry to a registered component and valid schema component', () => {
    const schema = createDefaultDashboardSchema()

    for (const entry of getWorkbenchPaletteEntries()) {
      expect(componentRegistry[entry.type], entry.id).toBeDefined()
      const component = createComponentFromPaletteEntry(entry.id, schema)
      expect(dashboardComponentValidator.safeParse(component).success, entry.id).toBe(true)
      expect(component.name).toBe(entry.title)
    }
  })
})
