import { describe, expect, test } from 'vitest'
import {
  chartPresetRegistry,
  getChartPresetGroups,
  getChartPresets,
  isChartComponentType,
  type ChartComponentType,
} from './chartPresets'

describe('chartPresetRegistry', () => {
  test('provides multiple component-level presets for each chart type', () => {
    for (const [type, presets] of Object.entries(chartPresetRegistry) as Array<
      [ChartComponentType, (typeof chartPresetRegistry)[ChartComponentType]]
    >) {
      expect(isChartComponentType(type)).toBe(true)
      expect(presets.length).toBeGreaterThanOrEqual(3)
      expect(presets.every((preset) => preset.componentType === type)).toBe(true)
    }
  })

  test('returns chart presets only for chart components', () => {
    expect(getChartPresets('pie-chart').map((preset) => preset.id)).toEqual([
      'pie-donut',
      'pie-rose',
      'pie-solid',
    ])
    expect(getChartPresets('metric-card')).toEqual([])
  })

  test('exposes grouped picker metadata for every chart type', () => {
    const groups = getChartPresetGroups()

    expect(groups.map((group) => group.componentType)).toEqual([
      'bar-chart',
      'line-chart',
      'area-chart',
      'pie-chart',
      'radar-chart',
      'funnel-chart',
    ])

    for (const group of groups) {
      expect(group.title).toBeTruthy()
      expect(group.dataRequirement).toBeTruthy()
      expect(group.presets).toBe(chartPresetRegistry[group.componentType])
      expect(group.presets.every((preset) => preset.previewKind && preset.dataRequirement)).toBe(true)
    }
  })
})
