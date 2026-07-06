import { dashboardSchemaValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import {
  createDefaultSchema,
  createEducationWorkbenchSchema,
  normalizeDefaultWorkbenchRoleBadge,
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

  test('omits role badges from default workbench screens', () => {
    const schema = createEducationWorkbenchSchema('dashboard-all')

    expect(schema.components.some((component) => component.id === 'dashboard-all-role-chip')).toBe(false)
  })

  test('normalizes stored legacy role badges by removing only the badge', () => {
    const schema = createEducationWorkbenchSchema('dashboard-all')
    const title = schema.components.find((component) => component.id === 'dashboard-all-title')
    const legacySchema = {
      ...schema,
      components: [
        ...schema.components,
        {
          id: 'dashboard-all-role-chip',
          type: 'text' as const,
          name: '角色标签',
          layout: { x: 1510, y: 44, width: 300, height: 56, zIndex: 3, locked: true, visible: true },
          props: { text: '全员工作台' },
          style: {
            backgroundColor: 'rgba(16, 185, 129, 0.16)',
            borderColor: 'rgba(16, 185, 129, 0.38)',
            fontColor: '#bbf7d0',
            fontSize: 24,
            fontWeight: 800,
          },
        },
      ],
    }

    const normalized = normalizeDefaultWorkbenchRoleBadge(legacySchema, 'dashboard-all')

    expect(normalized).not.toBeNull()
    expect(normalized?.components.find((component) => component.id === 'dashboard-all-title')).toBe(title)
    expect(normalized?.components.some((component) => component.id === 'dashboard-all-role-chip')).toBe(false)
    expect(normalizeDefaultWorkbenchRoleBadge(schema, 'dashboard-all')).toBeNull()
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
