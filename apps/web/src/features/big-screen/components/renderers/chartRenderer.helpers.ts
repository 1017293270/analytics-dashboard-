import type { ComponentType, DashboardComponent } from '@analytics/shared'
import type { EChartsOption } from 'echarts'
import type { ComponentData } from '../../data-adapters/dataAdapter.types'

export type ChartTheme = {
  title: string
  fontColor: string
  accentColor: string
}

function isChartType(type: ComponentType): type is 'line-chart' | 'bar-chart' | 'pie-chart' {
  return type === 'line-chart' || type === 'bar-chart' || type === 'pie-chart'
}

export function getChartDataIssue(component: DashboardComponent, data: ComponentData | null): string | null {
  if (!isChartType(component.type)) {
    return 'Unsupported chart component'
  }

  if (!data) {
    return 'No chart data'
  }

  if (component.type === 'line-chart') {
    if (data.kind !== 'time-series') return 'Line charts require time-series data'
    return data.rows.length > 0 ? null : 'No chart data'
  }

  if (component.type === 'bar-chart') {
    if (data.kind !== 'time-series' && data.kind !== 'category') return 'Bar charts require time-series or category data'
    return data.rows.length > 0 ? null : 'No chart data'
  }

  if (data.kind !== 'category') return 'Pie charts require category data'
  return data.rows.length > 0 ? null : 'No chart data'
}

export function buildChartOption(component: DashboardComponent, data: ComponentData, theme: ChartTheme): EChartsOption {
  const textStyle = { color: theme.fontColor }

  if ((component.type === 'line-chart' || component.type === 'bar-chart') && data.kind === 'time-series') {
    const seriesType = component.type === 'bar-chart' ? 'bar' : 'line'
    return {
      color: [theme.accentColor],
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
          smooth: seriesType === 'line',
          areaStyle: seriesType === 'line' ? { opacity: 0.16 } : undefined,
        },
      ],
    }
  }

  if (component.type === 'bar-chart' && data.kind === 'category') {
    return {
      color: [theme.accentColor],
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
      series: [{ type: 'bar', name: theme.title, data: data.rows.map((row) => row.value) }],
    }
  }

  if (component.type === 'pie-chart' && data.kind === 'category') {
    return {
      color: [theme.accentColor, '#22c55e', '#f59e0b', '#f87171', '#a78bfa'],
      textStyle,
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle },
      series: [
        {
          type: 'pie',
          name: theme.title,
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          data: data.rows.map((row) => ({ name: row.category, value: row.value })),
          label: { color: theme.fontColor },
        },
      ],
    }
  }

  return {}
}
