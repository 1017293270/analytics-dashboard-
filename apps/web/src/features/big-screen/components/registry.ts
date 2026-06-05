import type { ComponentType, DashboardComponent } from '@analytics/shared'
import { nanoid } from 'nanoid'
import type { Component } from 'vue'
import { bigScreenText } from '../i18n/zh-CN'
import DecorationRenderer from './renderers/DecorationRenderer.vue'
import EChartRenderer from './renderers/EChartRenderer.vue'
import ImageRenderer from './renderers/ImageRenderer.vue'
import MetricCardRenderer from './renderers/MetricCardRenderer.vue'
import TableRenderer from './renderers/TableRenderer.vue'
import TextRenderer from './renderers/TextRenderer.vue'

export type PropertyGroup = 'basic' | 'data' | 'style' | 'analysis'

type ComponentLayoutDefaults = Pick<DashboardComponent['layout'], 'width' | 'height'>

export interface ComponentDefinition {
  type: ComponentType
  title: string
  defaultLayout: ComponentLayoutDefaults
  defaultProps: Record<string, unknown>
  defaultStyle: Record<string, unknown>
  propertyGroups: PropertyGroup[]
  renderer: Component
}

export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  'metric-card': {
    type: 'metric-card',
    title: bigScreenText.components.names.metricCard,
    defaultLayout: { width: 320, height: 180 },
    defaultProps: { title: bigScreenText.components.defaults.coreMetric, valuePrefix: '', valueSuffix: '', precision: 0 },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.86)',
      fontColor: '#e5f0ff',
      accentColor: '#38bdf8',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: MetricCardRenderer,
  },
  'line-chart': {
    type: 'line-chart',
    title: bigScreenText.components.names.lineChart,
    defaultLayout: { width: 560, height: 320 },
    defaultProps: { title: bigScreenText.components.defaults.trendOverview, chartType: 'line', variant: 'line-smooth' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#60a5fa',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'area-chart': {
    type: 'area-chart',
    title: bigScreenText.components.names.areaChart,
    defaultLayout: { width: 620, height: 340 },
    defaultProps: { title: bigScreenText.components.defaults.volumeTrend, chartType: 'area', variant: 'area-bold' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#2dd4bf',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'bar-chart': {
    type: 'bar-chart',
    title: bigScreenText.components.names.barChart,
    defaultLayout: { width: 560, height: 320 },
    defaultProps: { title: bigScreenText.components.defaults.categoryBreakdown, chartType: 'bar', variant: 'bar-vertical' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#22c55e',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'pie-chart': {
    type: 'pie-chart',
    title: bigScreenText.components.names.pieChart,
    defaultLayout: { width: 420, height: 320 },
    defaultProps: { title: bigScreenText.components.defaults.shareOfWork, chartType: 'pie', variant: 'pie-donut' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#f59e0b',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'radar-chart': {
    type: 'radar-chart',
    title: bigScreenText.components.names.radarChart,
    defaultLayout: { width: 500, height: 360 },
    defaultProps: { title: bigScreenText.components.defaults.capabilityProfile, chartType: 'radar', variant: 'radar-filled' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#a78bfa',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'funnel-chart': {
    type: 'funnel-chart',
    title: bigScreenText.components.names.funnelChart,
    defaultLayout: { width: 500, height: 360 },
    defaultProps: { title: bigScreenText.components.defaults.conversionFunnel, chartType: 'funnel', variant: 'funnel-standard' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#fb7185',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  table: {
    type: 'table',
    title: bigScreenText.components.names.dataTable,
    defaultLayout: { width: 620, height: 340 },
    defaultProps: { title: bigScreenText.components.defaults.operationalQueue },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.86)',
      fontColor: '#e2e8f0',
      accentColor: '#38bdf8',
    },
    propertyGroups: ['basic', 'data', 'style'],
    renderer: TableRenderer,
  },
  text: {
    type: 'text',
    title: bigScreenText.components.names.text,
    defaultLayout: { width: 360, height: 120 },
    defaultProps: { text: bigScreenText.components.defaults.textBlock },
    defaultStyle: {
      backgroundColor: 'transparent',
      fontColor: '#f8fafc',
      fontSize: 28,
      fontWeight: 700,
    },
    propertyGroups: ['basic', 'style'],
    renderer: TextRenderer,
  },
  image: {
    type: 'image',
    title: bigScreenText.components.names.image,
    defaultLayout: { width: 360, height: 220 },
    defaultProps: { src: '', objectFit: 'cover' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.56)',
      borderColor: 'rgba(148, 163, 184, 0.26)',
    },
    propertyGroups: ['basic', 'style'],
    renderer: ImageRenderer,
  },
  decoration: {
    type: 'decoration',
    title: bigScreenText.components.names.decoration,
    defaultLayout: { width: 420, height: 120 },
    defaultProps: { variant: 'frame' },
    defaultStyle: {
      backgroundColor: 'rgba(8, 13, 28, 0.32)',
      borderColor: 'rgba(56, 189, 248, 0.5)',
      accentColor: '#38bdf8',
    },
    propertyGroups: ['basic', 'style'],
    renderer: DecorationRenderer,
  },
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createComponent(type: ComponentType, x = 80, y = 80, zIndex = 1): DashboardComponent {
  const definition = componentRegistry[type]

  return {
    id: nanoid(),
    type,
    name: definition.title,
    layout: {
      x,
      y,
      width: definition.defaultLayout.width,
      height: definition.defaultLayout.height,
      zIndex,
      visible: true,
    },
    props: cloneRecord(definition.defaultProps),
    style: cloneRecord(definition.defaultStyle),
  }
}
