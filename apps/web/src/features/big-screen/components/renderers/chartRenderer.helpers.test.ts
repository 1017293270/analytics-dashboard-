import { describe, expect, test } from 'vitest'
import { createComponent } from '../registry'
import { buildChartOption, getChartDataIssue } from './chartRenderer.helpers'

const timeSeries = { kind: 'time-series' as const, rows: [{ date: '2026-06-03', count: 12 }] }
const category = { kind: 'category' as const, rows: [{ category: 'SQL', value: 8 }] }
const theme = { title: 'Requests', fontColor: '#ffffff', accentColor: '#38bdf8' }

describe('chartRenderer helpers', () => {
  test('detects pie chart and time-series mismatch', () => {
    expect(getChartDataIssue(createComponent('pie-chart'), timeSeries)).toBe('Pie charts require category data')
  })

  test('detects line chart and category mismatch', () => {
    expect(getChartDataIssue(createComponent('line-chart'), category)).toBe('Line charts require time-series data')
  })

  test('builds type-driven chart options for compatible data', () => {
    const option = buildChartOption(createComponent('line-chart'), timeSeries, theme)

    expect(option.series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'line',
          data: [12],
        }),
      ]),
    )
  })
})
