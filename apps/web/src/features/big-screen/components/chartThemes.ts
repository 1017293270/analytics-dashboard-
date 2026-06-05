import { bigScreenText } from '../i18n/zh-CN'

export type ChartThemeDefinition = {
  id: string
  title: string
  seriesColors: string[]
  style: {
    backgroundColor: string
    fontColor: string
    accentColor: string
    borderColor: string
    seriesColors: string[]
  }
}

function createChartTheme(
  id: string,
  title: string,
  colors: string[],
  surface: Pick<ChartThemeDefinition['style'], 'backgroundColor' | 'fontColor' | 'borderColor'> = {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    fontColor: '#dbeafe',
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
): ChartThemeDefinition {
  return {
    id,
    title,
    seriesColors: colors,
    style: {
      ...surface,
      accentColor: colors[0],
      seriesColors: colors,
    },
  }
}

export const chartThemeRegistry: ChartThemeDefinition[] = [
  createChartTheme('command-default', bigScreenText.chartThemes.titles.commandDefault, [
    '#38bdf8',
    '#22c55e',
    '#f59e0b',
    '#f87171',
    '#a78bfa',
    '#60a5fa',
  ]),
  createChartTheme('calm-tech', bigScreenText.chartThemes.titles.calmTech, ['#3b82f6', '#22d3ee', '#2dd4bf', '#84cc16', '#facc15'], {
    backgroundColor: 'rgba(12, 20, 38, 0.84)',
    fontColor: '#e0f2fe',
    borderColor: 'rgba(125, 211, 252, 0.22)',
  }),
  createChartTheme('growth-contrast', bigScreenText.chartThemes.titles.growthContrast, [
    '#2563eb',
    '#f97316',
    '#facc15',
    '#22c55e',
    '#64748b',
  ]),
  createChartTheme('risk-signal', bigScreenText.chartThemes.titles.riskSignal, ['#38bdf8', '#facc15', '#fb923c', '#ef4444', '#475569'], {
    backgroundColor: 'rgba(24, 18, 24, 0.82)',
    fontColor: '#fee2e2',
    borderColor: 'rgba(248, 113, 113, 0.24)',
  }),
  createChartTheme('executive-gold', bigScreenText.chartThemes.titles.executiveGold, ['#fbbf24', '#f59e0b', '#fde68a', '#67e8f9', '#bfdbfe'], {
    backgroundColor: 'rgba(24, 20, 12, 0.82)',
    fontColor: '#fef3c7',
    borderColor: 'rgba(251, 191, 36, 0.24)',
  }),
  createChartTheme('vivid-compare', bigScreenText.chartThemes.titles.vividCompare, ['#0891b2', '#2563eb', '#8b5cf6', '#f472b6', '#ec4899'], {
    backgroundColor: 'rgba(16, 18, 38, 0.82)',
    fontColor: '#ede9fe',
    borderColor: 'rgba(167, 139, 250, 0.22)',
  }),
  createChartTheme('mint-lake', bigScreenText.chartThemes.titles.mintLake, ['#14b8a6', '#06b6d4', '#60a5fa', '#a7f3d0', '#fde68a'], {
    backgroundColor: 'rgba(8, 24, 32, 0.78)',
    fontColor: '#ccfbf1',
    borderColor: 'rgba(45, 212, 191, 0.24)',
  }),
  createChartTheme('high-contrast', bigScreenText.chartThemes.titles.highContrast, ['#2563eb', '#f97316', '#16a34a', '#dc2626', '#7c3aed', '#334155'], {
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    fontColor: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  }),
]

export function getChartThemes(): ChartThemeDefinition[] {
  return chartThemeRegistry
}

function stringRecordValue(record: Record<string, unknown>, key: string): string {
  const value = record[key]

  return typeof value === 'string' ? value : ''
}

function stringArrayRecordValue(record: Record<string, unknown>, key: string): string[] {
  const value = record[key]

  return Array.isArray(value) && value.every((item): item is string => typeof item === 'string') ? value : []
}

export function getChartThemeById(themeId: string): ChartThemeDefinition | null {
  return chartThemeRegistry.find((theme) => theme.id === themeId) ?? null
}

export function getMatchingChartThemeId(style: Record<string, unknown>): string {
  const matchingTheme = chartThemeRegistry.find((theme) => {
    const colors = stringArrayRecordValue(style, 'seriesColors')

    return (
      stringRecordValue(style, 'backgroundColor') === theme.style.backgroundColor &&
      stringRecordValue(style, 'fontColor') === theme.style.fontColor &&
      stringRecordValue(style, 'accentColor') === theme.style.accentColor &&
      stringRecordValue(style, 'borderColor') === theme.style.borderColor &&
      colors.length === theme.seriesColors.length &&
      colors.every((color, index) => color === theme.seriesColors[index])
    )
  })

  return matchingTheme?.id ?? ''
}
