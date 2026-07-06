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

  test('uses a subtle right-aligned role badge instead of a heavy title block', () => {
    const schema = createEducationWorkbenchSchema('dashboard-all')
    const badge = schema.components.find((component) => component.id === 'dashboard-all-role-chip')

    expect(badge).toBeDefined()
    expect(badge?.layout).toMatchObject({
      x: 1604,
      y: 46,
      width: 212,
      height: 42,
      locked: true,
    })
    expect(badge?.style).toMatchObject({
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(167, 243, 208, 0.26)',
      fontColor: '#d1fae5',
      fontSize: 20,
      fontWeight: 700,
    })
  })

  test('normalizes stored legacy role badges without replacing the whole schema', () => {
    const schema = createEducationWorkbenchSchema('dashboard-all')
    const title = schema.components.find((component) => component.id === 'dashboard-all-title')
    const legacySchema = {
      ...schema,
      components: schema.components.map((component) =>
        component.id === 'dashboard-all-role-chip'
          ? {
              ...component,
              layout: { ...component.layout, x: 1510, y: 44, width: 300, height: 56 },
              style: {
                ...component.style,
                backgroundColor: 'rgba(16, 185, 129, 0.16)',
                borderColor: 'rgba(16, 185, 129, 0.38)',
                fontColor: '#bbf7d0',
                fontSize: 24,
                fontWeight: 800,
              },
            }
          : component,
      ),
    }

    const normalized = normalizeDefaultWorkbenchRoleBadge(legacySchema, 'dashboard-all')
    const normalizedBadge = normalized?.components.find((component) => component.id === 'dashboard-all-role-chip')

    expect(normalized).not.toBeNull()
    expect(normalized?.components.find((component) => component.id === 'dashboard-all-title')).toBe(title)
    expect(normalizedBadge?.layout).toMatchObject({ x: 1604, y: 46, width: 212, height: 42 })
    expect(normalizedBadge?.style).toMatchObject({
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(167, 243, 208, 0.26)',
      fontSize: 20,
      fontWeight: 700,
    })
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
