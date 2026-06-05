import type { ComponentType, DashboardComponent } from '@analytics/shared'
import type { EChartsOption } from 'echarts'
import type { ComponentData } from '../../data-adapters/dataAdapter.types'
import { bigScreenText } from '../../i18n/zh-CN'
import { isChartComponentType, type ChartComponentType } from '../chartPresets'

export type ChartTheme = {
  title: string
  fontColor: string
  accentColor: string
  seriesColors?: string[]
}

const DEFAULT_SERIES_COLORS = ['#22c55e', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8']

function isChartType(type: ComponentType): type is ChartComponentType {
  return isChartComponentType(type)
}

function propString(component: DashboardComponent, key: string): string {
  const value = component.props[key]

  return typeof value === 'string' ? value : ''
}

function getChartPalette(theme: ChartTheme): string[] {
  const customColors = theme.seriesColors?.filter(Boolean) ?? []
  if (customColors.length > 0) return customColors

  return [theme.accentColor, ...DEFAULT_SERIES_COLORS]
}

function categoryBarData(
  rows: Extract<ComponentData, { kind: 'category' }>['rows'],
  palette: string[],
) {
  return rows.map((row, index) => ({
    value: row.value,
    itemStyle: { color: palette[index % palette.length] },
  }))
}

export function getChartDataIssue(component: DashboardComponent, data: ComponentData | null): string | null {
  if (!isChartType(component.type)) {
    return bigScreenText.renderers.unsupportedChart
  }

  if (!data) {
    return bigScreenText.renderers.noChartData
  }

  if (component.type === 'line-chart' || component.type === 'area-chart') {
    if (data.kind !== 'time-series') {
      return component.type === 'area-chart'
        ? bigScreenText.renderers.chartIssues.areaRequiresTimeSeries
        : bigScreenText.renderers.chartIssues.lineRequiresTimeSeries
    }
    return data.rows.length > 0 ? null : bigScreenText.renderers.noChartData
  }

  if (component.type === 'bar-chart') {
    if (data.kind !== 'time-series' && data.kind !== 'category') {
      return bigScreenText.renderers.chartIssues.barRequiresTimeOrCategory
    }
    return data.rows.length > 0 ? null : bigScreenText.renderers.noChartData
  }

  if (data.kind !== 'category') {
    if (component.type === 'radar-chart') return bigScreenText.renderers.chartIssues.radarRequiresCategory
    if (component.type === 'funnel-chart') return bigScreenText.renderers.chartIssues.funnelRequiresCategory
    return bigScreenText.renderers.chartIssues.pieRequiresCategory
  }
  return data.rows.length > 0 ? null : bigScreenText.renderers.noChartData
}

export function buildChartOption(component: DashboardComponent, data: ComponentData, theme: ChartTheme): EChartsOption {
  const textStyle = { color: theme.fontColor }
  const palette = getChartPalette(theme)
  const primaryColor = palette[0] ?? theme.accentColor
  const variant = propString(component, 'variant')

  if (
    (component.type === 'line-chart' || component.type === 'area-chart' || component.type === 'bar-chart') &&
    data.kind === 'time-series'
  ) {
    const seriesType = component.type === 'bar-chart' ? 'bar' : 'line'
    const isArea = component.type === 'area-chart'
    const isSteppedLine = variant === 'line-stepped'
    const isMinimalLine = variant === 'line-minimal'
    const isWireArea = variant === 'area-wire'
    const isSoftArea = variant === 'area-soft'
    return {
      color: [primaryColor],
      textStyle,
      tooltip: { trigger: 'axis' },
      grid: { left: 44, right: 20, top: 32, bottom: 32 },
      xAxis: {
        type: 'category',
        data: data.rows.map((row) => row.date),
        axisLabel: { color: theme.fontColor },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.42)' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: theme.fontColor },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } },
      },
      series: [
        {
          type: seriesType,
          name: theme.title,
          data: data.rows.map((row) => row.count),
          smooth: seriesType === 'line' && !isSteppedLine,
          step: isSteppedLine ? 'middle' : undefined,
          showSymbol: !isMinimalLine,
          barWidth: variant === 'bar-compact' ? '42%' : undefined,
          areaStyle:
            seriesType === 'line' && !isMinimalLine && !isSteppedLine
              ? { opacity: isArea ? (isWireArea ? 0.12 : isSoftArea ? 0.22 : 0.32) : 0.16 }
              : undefined,
          lineStyle: isArea ? { width: isWireArea ? 2 : 3 } : undefined,
        },
      ],
    }
  }

  if (component.type === 'bar-chart' && data.kind === 'category') {
    const isHorizontal = variant === 'bar-horizontal'
    if (isHorizontal) {
      return {
        color: palette,
        textStyle,
        tooltip: { trigger: 'axis' },
        grid: { left: 88, right: 20, top: 28, bottom: 30 },
        xAxis: {
          type: 'value',
          axisLabel: { color: theme.fontColor },
          splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } },
        },
        yAxis: {
          type: 'category',
          data: data.rows.map((row) => row.category),
          axisLabel: { color: theme.fontColor },
          axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.42)' } },
        },
        series: [
          {
            type: 'bar',
            name: theme.title,
            data: categoryBarData(data.rows, palette),
            barWidth: '46%',
          },
        ],
      }
    }

    return {
      color: palette,
      textStyle,
      tooltip: { trigger: 'axis' },
      grid: { left: 44, right: 20, top: 32, bottom: 42 },
      xAxis: {
        type: 'category',
        data: data.rows.map((row) => row.category),
        axisLabel: { color: theme.fontColor },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.42)' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: theme.fontColor },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } },
      },
      series: [
        {
          type: 'bar',
          name: theme.title,
          data: categoryBarData(data.rows, palette),
          barWidth: variant === 'bar-compact' ? '42%' : undefined,
        },
      ],
    }
  }

  if (component.type === 'pie-chart' && data.kind === 'category') {
    const isRose = variant === 'pie-rose'
    const isSolid = variant === 'pie-solid'
    return {
      color: palette,
      textStyle,
      tooltip: { trigger: 'item' },
      legend: isSolid ? { right: 4, top: 'middle', orient: 'vertical', textStyle } : { bottom: 0, textStyle },
      series: [
        {
          type: 'pie',
          name: theme.title,
          radius: isSolid ? ['0%', '64%'] : isRose ? ['24%', '68%'] : ['42%', '68%'],
          center: isSolid ? ['42%', '48%'] : ['50%', '44%'],
          roseType: isRose ? 'radius' : undefined,
          data: data.rows.map((row) => ({ name: row.category, value: row.value })),
          label: { color: theme.fontColor },
        },
      ],
    }
  }

  if (component.type === 'radar-chart' && data.kind === 'category') {
    const maxValue = Math.max(...data.rows.map((row) => row.value), 1)
    const isOutline = variant === 'radar-outline'
    const isCompact = variant === 'radar-compact'
    return {
      color: [primaryColor],
      textStyle,
      tooltip: { trigger: 'item' },
      radar: {
        radius: isCompact ? '56%' : '64%',
        center: ['50%', '50%'],
        indicator: data.rows.map((row) => ({ name: row.category, max: Math.ceil(maxValue * 1.25) })),
        axisName: { color: theme.fontColor, fontSize: isCompact ? 10 : 12 },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        splitArea: { areaStyle: { color: ['rgba(148, 163, 184, 0.04)', 'rgba(148, 163, 184, 0.08)'] } },
      },
      series: [
        {
          type: 'radar',
          name: theme.title,
          data: [
            {
              name: theme.title,
              value: data.rows.map((row) => row.value),
              areaStyle: { opacity: isOutline ? 0 : 0.18 },
              lineStyle: { width: isOutline ? 3 : 2 },
            },
          ],
        },
      ],
    }
  }

  if (component.type === 'funnel-chart' && data.kind === 'category') {
    const isPipeline = variant === 'funnel-pipeline'
    const isMinimal = variant === 'funnel-minimal'
    return {
      color: palette,
      textStyle,
      tooltip: { trigger: 'item' },
      legend: isMinimal ? undefined : { bottom: 0, textStyle },
      series: [
        {
          type: 'funnel',
          name: theme.title,
          left: isPipeline ? '6%' : '10%',
          top: isMinimal ? 24 : 20,
          bottom: isMinimal ? 24 : 48,
          width: isPipeline ? '88%' : '80%',
          sort: isPipeline ? 'none' : 'descending',
          gap: isMinimal ? 1 : 3,
          label: { color: theme.fontColor, position: isPipeline ? 'inside' : 'outer' },
          data: data.rows.map((row) => ({ name: row.category, value: row.value })),
        },
      ],
    }
  }

  return {}
}
