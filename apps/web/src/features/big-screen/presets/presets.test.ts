import { dashboardSchemaValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { componentRegistry } from '../components/registry'
import { aiOperationsPreset } from './presets'

describe('aiOperationsPreset', () => {
  test('creates a valid 1920 by 1080 interval-refresh schema', () => {
    const result = dashboardSchemaValidator.safeParse(aiOperationsPreset)

    expect(result.success).toBe(true)
    expect(aiOperationsPreset.canvas).toMatchObject({
      width: 1920,
      height: 1080,
      scaleMode: 'fit-screen',
    })
    expect(aiOperationsPreset.refresh).toEqual({ mode: 'interval', intervalSeconds: 30 })
  })

  test('uses supported renderer component types and mock data bindings', () => {
    expect(aiOperationsPreset.components.map((component) => component.type)).toEqual(
      expect.arrayContaining(['text', 'metric-card', 'line-chart', 'pie-chart', 'table']),
    )

    for (const component of aiOperationsPreset.components) {
      expect(componentRegistry[component.type].renderer).toBeTruthy()
      if (component.dataBindingId) {
        expect(aiOperationsPreset.dataBindings[component.dataBindingId]).toMatchObject({
          id: component.dataBindingId,
          sourceType: 'mock',
        })
      }
    }
  })
})
