import { describe, expect, test } from 'vitest'
import { bigScreenText } from '../../i18n/zh-CN'
import { createComponent } from '../registry'
import { buildChartOption, getChartDataIssue } from './chartRenderer.helpers'

const timeSeries = { kind: 'time-series' as const, rows: [{ date: '2026-06-03', count: 12 }] }
const category = { kind: 'category' as const, rows: [{ category: 'SQL', value: 8 }] }
const theme = { title: 'Requests', fontColor: '#ffffff', accentColor: '#38bdf8' }

describe('chartRenderer helpers', () => {
  test('detects pie chart and time-series mismatch', () => {
    expect(getChartDataIssue(createComponent('pie-chart'), timeSeries)).toBe(
      bigScreenText.renderers.chartIssues.pieRequiresCategory,
    )
  })

  test('detects line chart and category mismatch', () => {
    expect(getChartDataIssue(createComponent('line-chart'), category)).toBe(
      bigScreenText.renderers.chartIssues.lineRequiresTimeSeries,
    )
  })

  test('detects extended chart data mismatches', () => {
    expect(getChartDataIssue(createComponent('area-chart'), category)).toBe(
      bigScreenText.renderers.chartIssues.areaRequiresTimeSeries,
    )
    expect(getChartDataIssue(createComponent('radar-chart'), timeSeries)).toBe(
      bigScreenText.renderers.chartIssues.radarRequiresCategory,
    )
    expect(getChartDataIssue(createComponent('funnel-chart'), timeSeries)).toBe(
      bigScreenText.renderers.chartIssues.funnelRequiresCategory,
    )
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

  test('builds area chart options from time-series data', () => {
    const option = buildChartOption(createComponent('area-chart'), timeSeries, theme)

    expect(option.series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'line',
          areaStyle: expect.objectContaining({ opacity: 0.32 }),
        }),
      ]),
    )
  })

  test('builds radar and funnel chart options from category data', () => {
    const radar = buildChartOption(createComponent('radar-chart'), category, theme)
    const funnel = buildChartOption(createComponent('funnel-chart'), category, theme)

    expect(radar.series).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'radar' })]))
    expect(funnel.series).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'funnel' })]))
  })

  test('uses series colors for multi-value chart palettes', () => {
    const seriesTheme = {
      ...theme,
      accentColor: '#111111',
      seriesColors: ['#111111', '#222222', '#333333'],
    }
    const pie = buildChartOption(createComponent('pie-chart'), category, seriesTheme)
    const bar = buildChartOption(createComponent('bar-chart'), category, seriesTheme)

    expect(pie.color).toEqual(seriesTheme.seriesColors)
    expect(bar.color).toEqual(seriesTheme.seriesColors)
    expect(bar.series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: [expect.objectContaining({ value: 8, itemStyle: { color: '#111111' } })],
        }),
      ]),
    )
  })

  test('builds variant-specific chart options', () => {
    const horizontalBar = buildChartOption(
      {
        ...createComponent('bar-chart'),
        props: { variant: 'bar-horizontal' },
      },
      category,
      theme,
    )
    const rosePie = buildChartOption(
      {
        ...createComponent('pie-chart'),
        props: { variant: 'pie-rose' },
      },
      category,
      theme,
    )
    const outlineRadar = buildChartOption(
      {
        ...createComponent('radar-chart'),
        props: { variant: 'radar-outline' },
      },
      category,
      theme,
    )

    expect(horizontalBar.xAxis).toMatchObject({ type: 'value' })
    expect(horizontalBar.yAxis).toMatchObject({ type: 'category' })
    expect(rosePie.series).toEqual(expect.arrayContaining([expect.objectContaining({ roseType: 'radius' })]))
    expect(outlineRadar.series).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ areaStyle: { opacity: 0 } })]),
        }),
      ]),
    )
  })
})
