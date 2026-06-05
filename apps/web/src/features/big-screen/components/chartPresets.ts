import type { ComponentType } from '@analytics/shared'
import { bigScreenText } from '../i18n/zh-CN'

export type ChartComponentType = 'line-chart' | 'area-chart' | 'bar-chart' | 'pie-chart' | 'radar-chart' | 'funnel-chart'
export type ChartPresetPreviewKind =
  | 'line-smooth'
  | 'line-stepped'
  | 'line-minimal'
  | 'area-bold'
  | 'area-soft'
  | 'area-wire'
  | 'bar-vertical'
  | 'bar-horizontal'
  | 'bar-compact'
  | 'pie-donut'
  | 'pie-rose'
  | 'pie-solid'
  | 'radar-filled'
  | 'radar-outline'
  | 'radar-compact'
  | 'funnel-standard'
  | 'funnel-pipeline'
  | 'funnel-minimal'

export type ChartDataRequirement = 'time-series' | 'category' | 'time-series-or-category'

export type ChartPresetDefinition = {
  id: string
  componentType: ChartComponentType
  title: string
  previewKind: ChartPresetPreviewKind
  dataRequirement: ChartDataRequirement
  props: Record<string, unknown>
  style: Record<string, unknown>
}

export type ChartPresetGroupDefinition = {
  componentType: ChartComponentType
  title: string
  dataRequirement: ChartDataRequirement
  presets: ChartPresetDefinition[]
}

export const chartComponentOrder: ChartComponentType[] = [
  'bar-chart',
  'line-chart',
  'area-chart',
  'pie-chart',
  'radar-chart',
  'funnel-chart',
]

const chartPresetGroupMeta: Record<ChartComponentType, Omit<ChartPresetGroupDefinition, 'componentType' | 'presets'>> = {
  'bar-chart': { title: bigScreenText.chartPresets.groups.bar, dataRequirement: 'time-series-or-category' },
  'line-chart': { title: bigScreenText.chartPresets.groups.line, dataRequirement: 'time-series' },
  'area-chart': { title: bigScreenText.chartPresets.groups.area, dataRequirement: 'time-series' },
  'pie-chart': { title: bigScreenText.chartPresets.groups.pie, dataRequirement: 'category' },
  'radar-chart': { title: bigScreenText.chartPresets.groups.radar, dataRequirement: 'category' },
  'funnel-chart': { title: bigScreenText.chartPresets.groups.funnel, dataRequirement: 'category' },
}

export function isChartComponentType(type: ComponentType): type is ChartComponentType {
  return (
    type === 'line-chart' ||
    type === 'area-chart' ||
    type === 'bar-chart' ||
    type === 'pie-chart' ||
    type === 'radar-chart' ||
    type === 'funnel-chart'
  )
}

export const chartPresetRegistry: Record<ChartComponentType, ChartPresetDefinition[]> = {
  'line-chart': [
    {
      id: 'line-smooth',
      componentType: 'line-chart',
      title: bigScreenText.chartPresets.titles.lineSmooth,
      previewKind: 'line-smooth',
      dataRequirement: 'time-series',
      props: { chartType: 'line', variant: 'line-smooth' },
      style: { accentColor: '#60a5fa' },
    },
    {
      id: 'line-stepped',
      componentType: 'line-chart',
      title: bigScreenText.chartPresets.titles.lineStepped,
      previewKind: 'line-stepped',
      dataRequirement: 'time-series',
      props: { chartType: 'line', variant: 'line-stepped' },
      style: { accentColor: '#f59e0b' },
    },
    {
      id: 'line-minimal',
      componentType: 'line-chart',
      title: bigScreenText.chartPresets.titles.lineMinimal,
      previewKind: 'line-minimal',
      dataRequirement: 'time-series',
      props: { chartType: 'line', variant: 'line-minimal' },
      style: { accentColor: '#38bdf8' },
    },
  ],
  'area-chart': [
    {
      id: 'area-bold',
      componentType: 'area-chart',
      title: bigScreenText.chartPresets.titles.areaBold,
      previewKind: 'area-bold',
      dataRequirement: 'time-series',
      props: { chartType: 'area', variant: 'area-bold' },
      style: { accentColor: '#2dd4bf' },
    },
    {
      id: 'area-soft',
      componentType: 'area-chart',
      title: bigScreenText.chartPresets.titles.areaSoft,
      previewKind: 'area-soft',
      dataRequirement: 'time-series',
      props: { chartType: 'area', variant: 'area-soft' },
      style: { accentColor: '#22c55e' },
    },
    {
      id: 'area-wire',
      componentType: 'area-chart',
      title: bigScreenText.chartPresets.titles.areaWire,
      previewKind: 'area-wire',
      dataRequirement: 'time-series',
      props: { chartType: 'area', variant: 'area-wire' },
      style: { accentColor: '#38bdf8' },
    },
  ],
  'bar-chart': [
    {
      id: 'bar-vertical',
      componentType: 'bar-chart',
      title: bigScreenText.chartPresets.titles.barVertical,
      previewKind: 'bar-vertical',
      dataRequirement: 'time-series-or-category',
      props: { chartType: 'bar', variant: 'bar-vertical' },
      style: { accentColor: '#22c55e' },
    },
    {
      id: 'bar-horizontal',
      componentType: 'bar-chart',
      title: bigScreenText.chartPresets.titles.barHorizontal,
      previewKind: 'bar-horizontal',
      dataRequirement: 'time-series-or-category',
      props: { chartType: 'bar', variant: 'bar-horizontal' },
      style: { accentColor: '#38bdf8' },
    },
    {
      id: 'bar-compact',
      componentType: 'bar-chart',
      title: bigScreenText.chartPresets.titles.barCompact,
      previewKind: 'bar-compact',
      dataRequirement: 'time-series-or-category',
      props: { chartType: 'bar', variant: 'bar-compact' },
      style: { accentColor: '#f59e0b' },
    },
  ],
  'pie-chart': [
    {
      id: 'pie-donut',
      componentType: 'pie-chart',
      title: bigScreenText.chartPresets.titles.pieDonut,
      previewKind: 'pie-donut',
      dataRequirement: 'category',
      props: { chartType: 'pie', variant: 'pie-donut' },
      style: { accentColor: '#f59e0b' },
    },
    {
      id: 'pie-rose',
      componentType: 'pie-chart',
      title: bigScreenText.chartPresets.titles.pieRose,
      previewKind: 'pie-rose',
      dataRequirement: 'category',
      props: { chartType: 'pie', variant: 'pie-rose' },
      style: { accentColor: '#fb7185' },
    },
    {
      id: 'pie-solid',
      componentType: 'pie-chart',
      title: bigScreenText.chartPresets.titles.pieSolid,
      previewKind: 'pie-solid',
      dataRequirement: 'category',
      props: { chartType: 'pie', variant: 'pie-solid' },
      style: { accentColor: '#a78bfa' },
    },
  ],
  'radar-chart': [
    {
      id: 'radar-filled',
      componentType: 'radar-chart',
      title: bigScreenText.chartPresets.titles.radarFilled,
      previewKind: 'radar-filled',
      dataRequirement: 'category',
      props: { chartType: 'radar', variant: 'radar-filled' },
      style: { accentColor: '#a78bfa' },
    },
    {
      id: 'radar-outline',
      componentType: 'radar-chart',
      title: bigScreenText.chartPresets.titles.radarOutline,
      previewKind: 'radar-outline',
      dataRequirement: 'category',
      props: { chartType: 'radar', variant: 'radar-outline' },
      style: { accentColor: '#38bdf8' },
    },
    {
      id: 'radar-compact',
      componentType: 'radar-chart',
      title: bigScreenText.chartPresets.titles.radarCompact,
      previewKind: 'radar-compact',
      dataRequirement: 'category',
      props: { chartType: 'radar', variant: 'radar-compact' },
      style: { accentColor: '#22c55e' },
    },
  ],
  'funnel-chart': [
    {
      id: 'funnel-standard',
      componentType: 'funnel-chart',
      title: bigScreenText.chartPresets.titles.funnelStandard,
      previewKind: 'funnel-standard',
      dataRequirement: 'category',
      props: { chartType: 'funnel', variant: 'funnel-standard' },
      style: { accentColor: '#fb7185' },
    },
    {
      id: 'funnel-pipeline',
      componentType: 'funnel-chart',
      title: bigScreenText.chartPresets.titles.funnelPipeline,
      previewKind: 'funnel-pipeline',
      dataRequirement: 'category',
      props: { chartType: 'funnel', variant: 'funnel-pipeline' },
      style: { accentColor: '#f59e0b' },
    },
    {
      id: 'funnel-minimal',
      componentType: 'funnel-chart',
      title: bigScreenText.chartPresets.titles.funnelMinimal,
      previewKind: 'funnel-minimal',
      dataRequirement: 'category',
      props: { chartType: 'funnel', variant: 'funnel-minimal' },
      style: { accentColor: '#38bdf8' },
    },
  ],
}

export function getChartPresets(type: ComponentType): ChartPresetDefinition[] {
  return isChartComponentType(type) ? chartPresetRegistry[type] : []
}

export function getDefaultChartPreset(type: ComponentType): ChartPresetDefinition | null {
  return getChartPresets(type)[0] ?? null
}

export function getAllChartPresets(): ChartPresetDefinition[] {
  return chartComponentOrder.flatMap((type) => chartPresetRegistry[type])
}

export function getChartPresetGroups(): ChartPresetGroupDefinition[] {
  return chartComponentOrder.map((componentType) => ({
    componentType,
    ...chartPresetGroupMeta[componentType],
    presets: chartPresetRegistry[componentType],
  }))
}
