import type { ComponentType, DashboardComponent } from '@analytics/shared'
import { nanoid } from 'nanoid'
import type { Component } from 'vue'
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
    title: 'Metric Card',
    defaultLayout: { width: 320, height: 180 },
    defaultProps: { title: 'Core Metric', valuePrefix: '', valueSuffix: '', precision: 0 },
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
    title: 'Line Chart',
    defaultLayout: { width: 560, height: 320 },
    defaultProps: { title: 'Trend Overview', chartType: 'line' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#60a5fa',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'bar-chart': {
    type: 'bar-chart',
    title: 'Bar Chart',
    defaultLayout: { width: 560, height: 320 },
    defaultProps: { title: 'Category Breakdown', chartType: 'bar' },
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
    title: 'Pie Chart',
    defaultLayout: { width: 420, height: 320 },
    defaultProps: { title: 'Share of Work', chartType: 'pie' },
    defaultStyle: {
      backgroundColor: 'rgba(15, 23, 42, 0.82)',
      fontColor: '#dbeafe',
      accentColor: '#f59e0b',
    },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  table: {
    type: 'table',
    title: 'Data Table',
    defaultLayout: { width: 620, height: 340 },
    defaultProps: { title: 'Operational Queue' },
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
    title: 'Text',
    defaultLayout: { width: 360, height: 120 },
    defaultProps: { text: 'AI Operations Command Center' },
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
    title: 'Image',
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
    title: 'Decoration',
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
