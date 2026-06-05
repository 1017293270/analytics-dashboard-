import type { ComponentType, DashboardSchema } from '@analytics/shared'
import { bigScreenText } from '../i18n/zh-CN'

type DashboardComponent = DashboardSchema['components'][number]
type DataBinding = DashboardSchema['dataBindings'][string]
type ChartType = Extract<
  ComponentType,
  'line-chart' | 'area-chart' | 'bar-chart' | 'pie-chart' | 'radar-chart' | 'funnel-chart'
>

export type BigScreenPreset = {
  id: string
  title: string
  description: string
  schema: DashboardSchema
}

function mockBinding(id: string, query: DataBinding['query'], refreshSeconds = 30): DataBinding {
  return { id, sourceType: 'mock', query, refreshSeconds }
}

function textComponent(
  id: string,
  name: string,
  text: string,
  layout: DashboardComponent['layout'],
  style: DashboardComponent['style'],
): DashboardComponent {
  return {
    id,
    type: 'text',
    name,
    layout,
    props: { text },
    style: { backgroundColor: 'transparent', ...style },
  }
}

function metricComponent(
  id: string,
  name: string,
  title: string,
  dataBindingId: string,
  layout: DashboardComponent['layout'],
  style: DashboardComponent['style'],
): DashboardComponent {
  return {
    id,
    type: 'metric-card',
    name,
    layout,
    props: { title, valuePrefix: '', valueSuffix: '', precision: 0 },
    style,
    dataBindingId,
  }
}

function chartComponent(
  id: string,
  type: ChartType,
  name: string,
  title: string,
  dataBindingId: string,
  layout: DashboardComponent['layout'],
  style: DashboardComponent['style'],
): DashboardComponent {
  return {
    id,
    type,
    name,
    layout,
    props: { title, chartType: type.replace('-chart', '') },
    style,
    dataBindingId,
  }
}

function tableComponent(
  id: string,
  name: string,
  title: string,
  dataBindingId: string,
  layout: DashboardComponent['layout'],
  style: DashboardComponent['style'],
): DashboardComponent {
  return {
    id,
    type: 'table',
    name,
    layout,
    props: { title },
    style,
    dataBindingId,
  }
}

function decorationComponent(
  id: string,
  name: string,
  layout: DashboardComponent['layout'],
  style: DashboardComponent['style'],
): DashboardComponent {
  return {
    id,
    type: 'decoration',
    name,
    layout,
    props: { variant: 'frame' },
    style,
  }
}

export const aiOperationsPreset: DashboardSchema = {
  version: '1.0',
  canvas: {
    width: 1920,
    height: 1080,
    background: { type: 'color', value: '#07111f' },
    scaleMode: 'fit-screen',
  },
  theme: {
    name: bigScreenText.presets.aiOperations.name,
    colors: ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa'],
    fontFamily: 'Inter',
  },
  refresh: { mode: 'interval', intervalSeconds: 30 },
  dataBindings: {
    'ai-ops-total-requests': mockBinding('ai-ops-total-requests', { metrics: ['requests'] }, 30),
    'ai-ops-autonomous-resolutions': mockBinding(
      'ai-ops-autonomous-resolutions',
      { metrics: ['autonomous_resolutions'] },
      30,
    ),
    'ai-ops-resolution-trend': mockBinding(
      'ai-ops-resolution-trend',
      { dimensions: ['date'], metrics: ['resolved_questions'] },
      30,
    ),
    'ai-ops-workload-mix': mockBinding(
      'ai-ops-workload-mix',
      { dimensions: ['category'], metrics: ['workload_mix'] },
      45,
    ),
    'ai-ops-queue-detail': mockBinding(
      'ai-ops-queue-detail',
      { dimensions: ['table'], metrics: ['ai_queue'], limit: 8 },
      45,
    ),
  },
  components: [
    textComponent(
      'ai-ops-title',
      bigScreenText.components.defaults.dashboardTitle,
      bigScreenText.presets.aiOperations.title,
      { x: 48, y: 28, width: 920, height: 72, zIndex: 1, visible: true, locked: true },
      { fontColor: '#f8fafc', fontSize: 40, fontWeight: 800 },
    ),
    textComponent(
      'ai-ops-subtitle',
      bigScreenText.components.defaults.dashboardSubtitle,
      bigScreenText.presets.aiOperations.subtitle,
      { x: 52, y: 94, width: 780, height: 42, zIndex: 2, visible: true, locked: true },
      { fontColor: '#94a3b8', fontSize: 18, fontWeight: 600 },
    ),
    metricComponent(
      'ai-ops-metric-requests',
      bigScreenText.components.defaults.totalAiRequests,
      bigScreenText.components.defaults.totalAiRequests,
      'ai-ops-total-requests',
      { x: 48, y: 164, width: 360, height: 180, zIndex: 3, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.92)', fontColor: '#e2e8f0', accentColor: '#38bdf8' },
    ),
    metricComponent(
      'ai-ops-metric-autonomous',
      bigScreenText.components.defaults.autonomousResolutions,
      bigScreenText.components.defaults.autonomousResolutions,
      'ai-ops-autonomous-resolutions',
      { x: 432, y: 164, width: 360, height: 180, zIndex: 4, visible: true },
      { backgroundColor: 'rgba(10, 31, 46, 0.92)', fontColor: '#e0f2fe', accentColor: '#22c55e' },
    ),
    chartComponent(
      'ai-ops-trend-chart',
      'line-chart',
      bigScreenText.components.defaults.resolutionTrend,
      bigScreenText.components.defaults.resolutionTrend,
      'ai-ops-resolution-trend',
      { x: 48, y: 380, width: 900, height: 408, zIndex: 5, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.88)', fontColor: '#dbeafe', accentColor: '#60a5fa' },
    ),
    chartComponent(
      'ai-ops-workload-chart',
      'pie-chart',
      bigScreenText.components.defaults.workloadMix,
      bigScreenText.components.defaults.workloadMix,
      'ai-ops-workload-mix',
      { x: 988, y: 164, width: 432, height: 360, zIndex: 6, visible: true },
      { backgroundColor: 'rgba(17, 24, 39, 0.9)', fontColor: '#e5e7eb', accentColor: '#f59e0b' },
    ),
    tableComponent(
      'ai-ops-queue-table',
      bigScreenText.components.defaults.operationalQueue,
      bigScreenText.components.defaults.operationalQueueDetail,
      'ai-ops-queue-detail',
      { x: 988, y: 560, width: 820, height: 348, zIndex: 7, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.9)', fontColor: '#e2e8f0', accentColor: '#a78bfa' },
    ),
    textComponent(
      'ai-ops-footer',
      bigScreenText.components.defaults.runtimeNote,
      bigScreenText.presets.aiOperations.footer,
      { x: 50, y: 950, width: 980, height: 46, zIndex: 8, visible: true, locked: true },
      { fontColor: '#64748b', fontSize: 16, fontWeight: 600 },
    ),
  ],
}

const businessKpiPreset: DashboardSchema = {
  version: '1.0',
  canvas: {
    width: 1920,
    height: 1080,
    background: { type: 'color', value: '#081524' },
    scaleMode: 'fit-screen',
  },
  theme: {
    name: bigScreenText.presets.businessKpi.name,
    colors: ['#14b8a6', '#f97316', '#22c55e', '#0ea5e9', '#f43f5e'],
    fontFamily: 'Inter',
  },
  refresh: { mode: 'interval', intervalSeconds: 45 },
  dataBindings: {
    'business-revenue': mockBinding('business-revenue', { metrics: ['revenue'] }, 45),
    'business-pipeline': mockBinding('business-pipeline', { metrics: ['pipeline'] }, 45),
    'business-revenue-trend': mockBinding(
      'business-revenue-trend',
      { dimensions: ['date'], metrics: ['revenue_trend'] },
      45,
    ),
    'business-channel-mix': mockBinding(
      'business-channel-mix',
      { dimensions: ['category'], metrics: ['channel_revenue'] },
      60,
    ),
    'business-pipeline-stages': mockBinding(
      'business-pipeline-stages',
      { dimensions: ['category'], metrics: ['pipeline_stage'] },
      60,
    ),
    'business-account-health': mockBinding(
      'business-account-health',
      { dimensions: ['table'], metrics: ['account_health'], limit: 8 },
      60,
    ),
  },
  components: [
    textComponent(
      'business-title',
      bigScreenText.components.defaults.dashboardTitle,
      bigScreenText.presets.businessKpi.title,
      { x: 52, y: 34, width: 780, height: 64, zIndex: 1, visible: true, locked: true },
      { fontColor: '#f8fafc', fontSize: 38, fontWeight: 800 },
    ),
    textComponent(
      'business-subtitle',
      bigScreenText.components.defaults.dashboardSubtitle,
      bigScreenText.presets.businessKpi.subtitle,
      { x: 54, y: 96, width: 740, height: 42, zIndex: 2, visible: true, locked: true },
      { fontColor: '#8fb4c7', fontSize: 17, fontWeight: 600 },
    ),
    metricComponent(
      'business-revenue-card',
      bigScreenText.components.defaults.revenueThisMonth,
      bigScreenText.components.defaults.revenueThisMonth,
      'business-revenue',
      { x: 52, y: 168, width: 356, height: 172, zIndex: 3, visible: true },
      { backgroundColor: 'rgba(12, 42, 49, 0.9)', fontColor: '#ecfeff', accentColor: '#14b8a6' },
    ),
    metricComponent(
      'business-pipeline-card',
      bigScreenText.components.defaults.qualifiedPipeline,
      bigScreenText.components.defaults.qualifiedPipeline,
      'business-pipeline',
      { x: 432, y: 168, width: 356, height: 172, zIndex: 4, visible: true },
      { backgroundColor: 'rgba(42, 26, 10, 0.88)', fontColor: '#fff7ed', accentColor: '#f97316' },
    ),
    chartComponent(
      'business-area-chart',
      'area-chart',
      bigScreenText.components.defaults.revenueRunRate,
      bigScreenText.components.defaults.revenueRunRate,
      'business-revenue-trend',
      { x: 52, y: 380, width: 900, height: 408, zIndex: 5, visible: true },
      { backgroundColor: 'rgba(8, 22, 38, 0.9)', fontColor: '#dff7f3', accentColor: '#14b8a6' },
    ),
    chartComponent(
      'business-channel-chart',
      'bar-chart',
      bigScreenText.components.defaults.channelRevenue,
      bigScreenText.components.defaults.channelRevenue,
      'business-channel-mix',
      { x: 988, y: 168, width: 460, height: 336, zIndex: 6, visible: true },
      { backgroundColor: 'rgba(11, 27, 44, 0.9)', fontColor: '#e0f2fe', accentColor: '#0ea5e9' },
    ),
    chartComponent(
      'business-funnel-chart',
      'funnel-chart',
      bigScreenText.components.defaults.pipelineStages,
      bigScreenText.components.defaults.pipelineStages,
      'business-pipeline-stages',
      { x: 1488, y: 168, width: 380, height: 336, zIndex: 7, visible: true },
      { backgroundColor: 'rgba(35, 17, 28, 0.86)', fontColor: '#ffe4e6', accentColor: '#fb7185' },
    ),
    tableComponent(
      'business-account-table',
      bigScreenText.components.defaults.accountHealthShort,
      bigScreenText.components.defaults.accountHealthWatchlist,
      'business-account-health',
      { x: 988, y: 548, width: 880, height: 348, zIndex: 8, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.9)', fontColor: '#e2e8f0', accentColor: '#22c55e' },
    ),
    decorationComponent(
      'business-bottom-rule',
      bigScreenText.components.defaults.bottomBorder,
      { x: 52, y: 928, width: 1816, height: 38, zIndex: 9, visible: true, locked: true },
      { backgroundColor: 'rgba(20, 184, 166, 0.06)', borderColor: 'rgba(20, 184, 166, 0.36)', accentColor: '#14b8a6' },
    ),
  ],
}

const customerServicePreset: DashboardSchema = {
  version: '1.0',
  canvas: {
    width: 1920,
    height: 1080,
    background: { type: 'color', value: '#0b1020' },
    scaleMode: 'fit-screen',
  },
  theme: {
    name: bigScreenText.presets.customerService.name,
    colors: ['#f59e0b', '#38bdf8', '#a78bfa', '#22c55e', '#f87171'],
    fontFamily: 'Inter',
  },
  refresh: { mode: 'interval', intervalSeconds: 30 },
  dataBindings: {
    'service-satisfaction': mockBinding('service-satisfaction', { metrics: ['satisfaction'] }, 30),
    'service-response': mockBinding('service-response', { metrics: ['first_response'] }, 30),
    'service-response-trend': mockBinding(
      'service-response-trend',
      { dimensions: ['date'], metrics: ['response_trend'] },
      30,
    ),
    'service-quality-radar': mockBinding(
      'service-quality-radar',
      { dimensions: ['category'], metrics: ['service_quality'] },
      45,
    ),
    'service-contact-mix': mockBinding(
      'service-contact-mix',
      { dimensions: ['category'], metrics: ['contact_channel'] },
      45,
    ),
    'service-escalation-table': mockBinding(
      'service-escalation-table',
      { dimensions: ['table'], metrics: ['service_queue'], limit: 8 },
      45,
    ),
  },
  components: [
    textComponent(
      'service-title',
      bigScreenText.components.defaults.dashboardTitle,
      bigScreenText.presets.customerService.title,
      { x: 50, y: 30, width: 760, height: 68, zIndex: 1, visible: true, locked: true },
      { fontColor: '#f8fafc', fontSize: 40, fontWeight: 800 },
    ),
    textComponent(
      'service-subtitle',
      bigScreenText.components.defaults.dashboardSubtitle,
      bigScreenText.presets.customerService.subtitle,
      { x: 54, y: 96, width: 760, height: 42, zIndex: 2, visible: true, locked: true },
      { fontColor: '#a6b7d4', fontSize: 17, fontWeight: 600 },
    ),
    metricComponent(
      'service-satisfaction-card',
      bigScreenText.components.defaults.customerSatisfaction,
      bigScreenText.components.defaults.customerSatisfaction,
      'service-satisfaction',
      { x: 52, y: 164, width: 356, height: 172, zIndex: 3, visible: true },
      { backgroundColor: 'rgba(43, 32, 13, 0.9)', fontColor: '#fef3c7', accentColor: '#f59e0b' },
    ),
    metricComponent(
      'service-response-card',
      bigScreenText.components.defaults.firstResponse,
      bigScreenText.components.defaults.firstResponse,
      'service-response',
      { x: 432, y: 164, width: 356, height: 172, zIndex: 4, visible: true },
      { backgroundColor: 'rgba(8, 31, 48, 0.9)', fontColor: '#e0f2fe', accentColor: '#38bdf8' },
    ),
    chartComponent(
      'service-response-chart',
      'line-chart',
      bigScreenText.components.defaults.responseTrend,
      bigScreenText.components.defaults.responseTrend,
      'service-response-trend',
      { x: 52, y: 380, width: 770, height: 392, zIndex: 5, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.9)', fontColor: '#dbeafe', accentColor: '#38bdf8' },
    ),
    chartComponent(
      'service-quality-radar-chart',
      'radar-chart',
      bigScreenText.components.defaults.serviceQualityShort,
      bigScreenText.components.defaults.serviceQualityProfile,
      'service-quality-radar',
      { x: 858, y: 164, width: 520, height: 408, zIndex: 6, visible: true },
      { backgroundColor: 'rgba(30, 23, 52, 0.9)', fontColor: '#ede9fe', accentColor: '#a78bfa' },
    ),
    chartComponent(
      'service-contact-chart',
      'pie-chart',
      bigScreenText.components.defaults.contactMix,
      bigScreenText.components.defaults.contactMix,
      'service-contact-mix',
      { x: 1412, y: 164, width: 440, height: 408, zIndex: 7, visible: true },
      { backgroundColor: 'rgba(17, 24, 39, 0.9)', fontColor: '#e5e7eb', accentColor: '#22c55e' },
    ),
    tableComponent(
      'service-escalation-table-component',
      bigScreenText.components.defaults.escalationWatch,
      bigScreenText.components.defaults.escalationWatch,
      'service-escalation-table',
      { x: 858, y: 612, width: 994, height: 312, zIndex: 8, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.9)', fontColor: '#e2e8f0', accentColor: '#f87171' },
    ),
    textComponent(
      'service-note',
      bigScreenText.components.defaults.runtimeNote,
      bigScreenText.presets.customerService.note,
      { x: 52, y: 842, width: 720, height: 46, zIndex: 9, visible: true, locked: true },
      { fontColor: '#64748b', fontSize: 16, fontWeight: 600 },
    ),
  ],
}

const dataQualityPreset: DashboardSchema = {
  version: '1.0',
  canvas: {
    width: 1920,
    height: 1080,
    background: { type: 'color', value: '#071018' },
    scaleMode: 'fit-screen',
  },
  theme: {
    name: bigScreenText.presets.dataQuality.name,
    colors: ['#22c55e', '#38bdf8', '#f59e0b', '#f43f5e', '#a78bfa'],
    fontFamily: 'Inter',
  },
  refresh: { mode: 'interval', intervalSeconds: 30 },
  dataBindings: {
    'quality-freshness': mockBinding('quality-freshness', { metrics: ['freshness'] }, 30),
    'quality-incidents': mockBinding('quality-incidents', { metrics: ['incidents'] }, 30),
    'quality-freshness-trend': mockBinding(
      'quality-freshness-trend',
      { dimensions: ['date'], metrics: ['freshness_trend'] },
      30,
    ),
    'quality-source-errors': mockBinding(
      'quality-source-errors',
      { dimensions: ['category'], metrics: ['source_errors'] },
      45,
    ),
    'quality-platform-health': mockBinding(
      'quality-platform-health',
      { dimensions: ['category'], metrics: ['platform_health'] },
      45,
    ),
    'quality-remediation': mockBinding(
      'quality-remediation',
      { dimensions: ['category'], metrics: ['quality_remediation'] },
      45,
    ),
    'quality-job-table': mockBinding(
      'quality-job-table',
      { dimensions: ['table'], metrics: ['data_jobs'], limit: 8 },
      45,
    ),
  },
  components: [
    textComponent(
      'quality-title',
      bigScreenText.components.defaults.dashboardTitle,
      bigScreenText.presets.dataQuality.title,
      { x: 50, y: 32, width: 840, height: 68, zIndex: 1, visible: true, locked: true },
      { fontColor: '#f8fafc', fontSize: 40, fontWeight: 800 },
    ),
    textComponent(
      'quality-subtitle',
      bigScreenText.components.defaults.dashboardSubtitle,
      bigScreenText.presets.dataQuality.subtitle,
      { x: 54, y: 98, width: 760, height: 42, zIndex: 2, visible: true, locked: true },
      { fontColor: '#94a3b8', fontSize: 17, fontWeight: 600 },
    ),
    metricComponent(
      'quality-freshness-card',
      bigScreenText.components.defaults.freshSources,
      bigScreenText.components.defaults.freshSources,
      'quality-freshness',
      { x: 52, y: 166, width: 344, height: 170, zIndex: 3, visible: true },
      { backgroundColor: 'rgba(10, 36, 25, 0.9)', fontColor: '#dcfce7', accentColor: '#22c55e' },
    ),
    metricComponent(
      'quality-incident-card',
      bigScreenText.components.defaults.openIncidents,
      bigScreenText.components.defaults.openIncidents,
      'quality-incidents',
      { x: 420, y: 166, width: 344, height: 170, zIndex: 4, visible: true },
      { backgroundColor: 'rgba(43, 19, 23, 0.9)', fontColor: '#ffe4e6', accentColor: '#f43f5e' },
    ),
    chartComponent(
      'quality-freshness-area',
      'area-chart',
      bigScreenText.components.defaults.freshnessTrend,
      bigScreenText.components.defaults.freshnessTrend,
      'quality-freshness-trend',
      { x: 52, y: 382, width: 764, height: 392, zIndex: 5, visible: true },
      { backgroundColor: 'rgba(8, 28, 25, 0.9)', fontColor: '#d1fae5', accentColor: '#22c55e' },
    ),
    chartComponent(
      'quality-error-bars',
      'bar-chart',
      bigScreenText.components.defaults.sourceErrorsShort,
      bigScreenText.components.defaults.sourceErrorsBySystem,
      'quality-source-errors',
      { x: 852, y: 166, width: 500, height: 352, zIndex: 6, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.9)', fontColor: '#e2e8f0', accentColor: '#f59e0b' },
    ),
    chartComponent(
      'quality-health-radar',
      'radar-chart',
      bigScreenText.components.defaults.platformHealthShort,
      bigScreenText.components.defaults.platformHealthProfile,
      'quality-platform-health',
      { x: 1390, y: 166, width: 458, height: 352, zIndex: 7, visible: true },
      { backgroundColor: 'rgba(26, 22, 48, 0.88)', fontColor: '#ede9fe', accentColor: '#a78bfa' },
    ),
    chartComponent(
      'quality-remediation-funnel',
      'funnel-chart',
      bigScreenText.components.defaults.remediationFunnel,
      bigScreenText.components.defaults.remediationFunnel,
      'quality-remediation',
      { x: 852, y: 558, width: 500, height: 352, zIndex: 8, visible: true },
      { backgroundColor: 'rgba(37, 25, 15, 0.88)', fontColor: '#ffedd5', accentColor: '#fb7185' },
    ),
    tableComponent(
      'quality-job-table-component',
      bigScreenText.components.defaults.pipelineJobs,
      bigScreenText.components.defaults.pipelineJobs,
      'quality-job-table',
      { x: 1390, y: 558, width: 458, height: 352, zIndex: 9, visible: true },
      { backgroundColor: 'rgba(15, 23, 42, 0.9)', fontColor: '#e2e8f0', accentColor: '#38bdf8' },
    ),
  ],
}

export const bigScreenPresets: BigScreenPreset[] = [
  {
    id: 'ai-operations',
    title: bigScreenText.presets.aiOperations.name,
    description: bigScreenText.presets.aiOperations.description,
    schema: aiOperationsPreset,
  },
  {
    id: 'business-kpi',
    title: bigScreenText.presets.businessKpi.name,
    description: bigScreenText.presets.businessKpi.description,
    schema: businessKpiPreset,
  },
  {
    id: 'customer-service',
    title: bigScreenText.presets.customerService.name,
    description: bigScreenText.presets.customerService.description,
    schema: customerServicePreset,
  },
  {
    id: 'data-quality-health',
    title: bigScreenText.presets.dataQuality.name,
    description: bigScreenText.presets.dataQuality.description,
    schema: dataQualityPreset,
  },
]
