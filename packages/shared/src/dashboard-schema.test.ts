import { describe, expect, test } from 'vitest'
import { dashboardSchemaValidator } from './dashboard-schema.js'

describe('dashboardSchemaValidator', () => {
  const baseDashboardSchema = {
    version: '1.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: { type: 'color', value: '#0b1220' },
      scaleMode: 'fit-screen',
    },
    theme: {
      name: 'Command Center',
      colors: ['#2563eb'],
      fontFamily: 'Inter',
    },
    components: [],
    dataBindings: {},
    refresh: { mode: 'manual' },
  }

  const metricComponent = {
    id: 'component-1',
    type: 'metric-card',
    name: 'Metric',
    layout: { x: 0, y: 0, width: 320, height: 160, zIndex: 1 },
  }

  test('accepts a valid empty dashboard schema', () => {
    const result = dashboardSchemaValidator.safeParse({
      ...baseDashboardSchema,
      theme: {
        ...baseDashboardSchema.theme,
        name: 'Command Center',
        colors: ['#2563eb', '#22c55e'],
      },
    })

    expect(result.success).toBe(true)
  })

  test('rejects an unknown component type', () => {
    const result = dashboardSchemaValidator.safeParse({
      version: '1.0',
      canvas: {
        width: 1920,
        height: 1080,
        background: { type: 'color', value: '#0b1220' },
        scaleMode: 'fit-screen',
      },
      theme: {
        name: 'Command Center',
        colors: ['#2563eb'],
        fontFamily: 'Inter',
      },
      components: [
        {
          id: 'component-1',
          type: 'unknown-chart',
          name: 'Unknown',
          layout: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          props: {},
          style: {},
        },
      ],
      dataBindings: {},
      refresh: { mode: 'manual' },
    })

    expect(result.success).toBe(false)
  })

  test('rejects duplicate component ids', () => {
    const component = {
      id: 'component-1',
      type: 'metric-card',
      name: 'Metric',
      layout: { x: 0, y: 0, width: 320, height: 160, zIndex: 1 },
      props: {},
      style: {},
    }

    const result = dashboardSchemaValidator.safeParse({
      version: '1.0',
      canvas: {
        width: 1920,
        height: 1080,
        background: { type: 'color', value: '#0b1220' },
        scaleMode: 'fit-screen',
      },
      theme: {
        name: 'Command Center',
        colors: ['#2563eb'],
        fontFamily: 'Inter',
      },
      components: [component, component],
      dataBindings: {},
      refresh: { mode: 'manual' },
    })

    expect(result.success).toBe(false)
  })

  test('rejects a component referencing a missing data binding', () => {
    const result = dashboardSchemaValidator.safeParse({
      ...baseDashboardSchema,
      components: [{ ...metricComponent, dataBindingId: 'missing-binding' }],
      dataBindings: {},
    })

    expect(result.success).toBe(false)
  })

  test('rejects an inherited object key as a missing data binding', () => {
    const result = dashboardSchemaValidator.safeParse({
      ...baseDashboardSchema,
      components: [{ ...metricComponent, dataBindingId: 'toString' }],
      dataBindings: {},
    })

    expect(result.success).toBe(false)
  })

  test('rejects a data binding record key and id mismatch', () => {
    const result = dashboardSchemaValidator.safeParse({
      ...baseDashboardSchema,
      dataBindings: {
        bindingKey: {
          id: 'binding-id',
          sourceType: 'mock',
          query: {},
        },
      },
    })

    expect(result.success).toBe(false)
  })

  test('defaults missing component props and style to empty objects', () => {
    const result = dashboardSchemaValidator.safeParse({
      ...baseDashboardSchema,
      components: [metricComponent],
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }
    expect(result.data.components[0]?.props).toEqual({})
    expect(result.data.components[0]?.style).toEqual({})
  })
})
