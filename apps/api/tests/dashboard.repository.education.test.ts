import { dashboardSchemaValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import {
  createDefaultSchema,
  createEducationWorkbenchSchema,
  shouldUpgradeDefaultWorkbenchSchema,
} from '../src/dashboards/dashboard.repository.js'

describe('education workbench schemas', () => {
  test('builds valid non-empty schemas for each default role workbench', () => {
    for (const id of ['dashboard-all', 'dashboard-electro', 'dashboard-moral', 'dashboard-research']) {
      const schema = createEducationWorkbenchSchema(id)

      expect(dashboardSchemaValidator.safeParse(schema).success).toBe(true)
      expect(schema.components.length).toBeGreaterThanOrEqual(8)
      expect(Object.keys(schema.dataBindings).length).toBeGreaterThanOrEqual(6)
      expect(schema.components.some((component) => component.type === 'metric-card')).toBe(true)
      expect(schema.components.some((component) => component.type === 'table')).toBe(true)
      expect(schema.components.every((component) => component.layout.visible)).toBe(true)
    }
  })

  test('upgrades only the exact legacy blank default schema', () => {
    expect(shouldUpgradeDefaultWorkbenchSchema(createDefaultSchema())).toBe(true)
    expect(shouldUpgradeDefaultWorkbenchSchema(createEducationWorkbenchSchema('dashboard-all'))).toBe(false)
    expect(shouldUpgradeDefaultWorkbenchSchema({
      ...createDefaultSchema(),
      canvas: { ...createDefaultSchema().canvas, background: { type: 'color', value: '#123456' } },
    })).toBe(false)
  })
})
