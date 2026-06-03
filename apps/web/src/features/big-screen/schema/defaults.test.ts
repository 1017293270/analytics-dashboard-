import { dashboardSchemaValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { createDefaultDashboardSchema } from './defaults'

describe('createDefaultDashboardSchema', () => {
  test('creates a valid 1920 by 1080 fit-screen schema', () => {
    const schema = createDefaultDashboardSchema()

    expect(schema.canvas.width).toBe(1920)
    expect(schema.canvas.height).toBe(1080)
    expect(schema.canvas.scaleMode).toBe('fit-screen')
    expect(dashboardSchemaValidator.safeParse(schema).success).toBe(true)
  })
})
