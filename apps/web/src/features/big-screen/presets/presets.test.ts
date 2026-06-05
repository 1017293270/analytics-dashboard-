import { dashboardSchemaValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { componentRegistry } from '../components/registry'
import { bigScreenText } from '../i18n/zh-CN'
import { aiOperationsPreset, bigScreenPresets } from './presets'

describe('bigScreenPresets', () => {
  test('exports four selectable preset schemas and preserves the legacy AI operations export', () => {
    expect(bigScreenPresets).toHaveLength(4)
    expect(bigScreenPresets[0]).toMatchObject({
      id: 'ai-operations',
      title: bigScreenText.presets.aiOperations.name,
      schema: aiOperationsPreset,
    })
  })

  test('creates valid 1920 by 1080 interval-refresh schemas', () => {
    for (const preset of bigScreenPresets) {
      const result = dashboardSchemaValidator.safeParse(preset.schema)

      expect(result.success).toBe(true)
      expect(preset.schema.canvas).toMatchObject({
        width: 1920,
        height: 1080,
        scaleMode: 'fit-screen',
      })
      expect(preset.schema.refresh.mode).toBe('interval')
    }
  })

  test('uses supported renderer component types and mock data bindings', () => {
    const componentTypes = bigScreenPresets.flatMap((preset) =>
      preset.schema.components.map((component) => component.type),
    )

    expect(componentTypes).toEqual(expect.arrayContaining(['area-chart', 'radar-chart', 'funnel-chart']))

    for (const preset of bigScreenPresets) {
      for (const component of preset.schema.components) {
        expect(componentRegistry[component.type].renderer).toBeTruthy()
        if (component.dataBindingId) {
          expect(preset.schema.dataBindings[component.dataBindingId]).toMatchObject({
            id: component.dataBindingId,
            sourceType: 'mock',
          })
        }
      }
    }
  })
})
