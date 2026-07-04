import type { ComponentType, DashboardComponent, DashboardSchema } from '@analytics/shared'
import { createComponent } from './registry'

export type WorkbenchPaletteGroup =
  | '数据指标'
  | '图表组件'
  | '设备状态'
  | '告警组件'
  | '应用入口'
  | '表格组件'
  | '文本图片'
  | '第三方网页'

export interface WorkbenchPaletteEntry {
  id: string
  group: WorkbenchPaletteGroup
  title: string
  description: string
  type: ComponentType
  defaultLayout?: Partial<DashboardComponent['layout']>
  defaultProps?: Record<string, unknown>
  defaultStyle?: Record<string, unknown>
}

const entries: WorkbenchPaletteEntry[] = [
  {
    id: 'today-alarms',
    group: '数据指标',
    title: '今日告警',
    description: '告警数量指标',
    type: 'metric-card',
    defaultProps: { title: '今日告警', valueSuffix: '条', precision: 0 },
    defaultStyle: { accentColor: '#ef4444' },
  },
  {
    id: 'device-online-rate',
    group: '数据指标',
    title: '设备在线率',
    description: '在线率百分比',
    type: 'metric-card',
    defaultProps: { title: '设备在线率', valueSuffix: '%', precision: 1 },
    defaultStyle: { accentColor: '#22c55e' },
  },
  {
    id: 'teacher-development-index',
    group: '数据指标',
    title: '教师发展指数',
    description: '教研成长指标',
    type: 'metric-card',
    defaultProps: { title: '教师发展指数', precision: 1 },
    defaultStyle: { accentColor: '#2563eb' },
  },
  {
    id: 'student-growth-index',
    group: '数据指标',
    title: '学生成长指数',
    description: '学生成长指标',
    type: 'metric-card',
    defaultProps: { title: '学生成长指数', precision: 1 },
    defaultStyle: { accentColor: '#f59e0b' },
  },
  {
    id: 'enabled-app-count',
    group: '数据指标',
    title: '启用应用数',
    description: '应用启用统计',
    type: 'metric-card',
    defaultProps: { title: '启用应用数', valueSuffix: '个', precision: 0 },
    defaultStyle: { accentColor: '#38bdf8' },
  },
  {
    id: 'line-trend',
    group: '图表组件',
    title: '趋势折线图',
    description: '时间趋势分析',
    type: 'line-chart',
    defaultProps: { title: '趋势折线图', chartType: 'line', variant: 'line-smooth' },
  },
  {
    id: 'area-trend',
    group: '图表组件',
    title: '面积趋势图',
    description: '趋势面积分析',
    type: 'area-chart',
    defaultProps: { title: '面积趋势图', chartType: 'area', variant: 'area-bold' },
  },
  {
    id: 'category-bar',
    group: '图表组件',
    title: '分类柱状图',
    description: '分类对比分析',
    type: 'bar-chart',
    defaultProps: { title: '分类柱状图', chartType: 'bar', variant: 'bar-vertical' },
  },
  {
    id: 'ranking-bar',
    group: '图表组件',
    title: '横向排行图',
    description: '排行对比分析',
    type: 'bar-chart',
    defaultProps: { title: '横向排行图', chartType: 'bar', variant: 'bar-horizontal' },
  },
  {
    id: 'donut-share',
    group: '图表组件',
    title: '环形占比图',
    description: '占比结构分析',
    type: 'pie-chart',
    defaultProps: { title: '环形占比图', chartType: 'pie', variant: 'pie-donut' },
  },
  {
    id: 'rose-share',
    group: '图表组件',
    title: '玫瑰占比图',
    description: '重点占比展示',
    type: 'pie-chart',
    defaultProps: { title: '玫瑰占比图', chartType: 'pie', variant: 'pie-rose' },
  },
  {
    id: 'capability-radar',
    group: '图表组件',
    title: '雷达能力图',
    description: '多维能力画像',
    type: 'radar-chart',
    defaultProps: { title: '雷达能力图', chartType: 'radar', variant: 'radar-filled' },
  },
  {
    id: 'conversion-funnel',
    group: '图表组件',
    title: '漏斗转化图',
    description: '流程转化分析',
    type: 'funnel-chart',
    defaultProps: { title: '漏斗转化图', chartType: 'funnel', variant: 'funnel-standard' },
  },
  {
    id: 'device-health-card',
    group: '设备状态',
    title: '设备健康卡',
    description: '设备状态概览',
    type: 'metric-card',
    defaultProps: { title: '设备健康卡', valueSuffix: '台', precision: 0 },
    defaultStyle: { accentColor: '#22c55e' },
  },
  {
    id: 'device-status-table',
    group: '设备状态',
    title: '设备状态表',
    description: '设备列表状态',
    type: 'table',
    defaultProps: { title: '设备状态表' },
  },
  {
    id: 'classroom-device-map',
    group: '设备状态',
    title: '教室设备分布',
    description: '教室点位展示',
    type: 'image',
    defaultProps: { src: '', objectFit: 'cover' },
  },
  {
    id: 'online-offline-summary',
    group: '设备状态',
    title: '在线离线汇总',
    description: '设备在线概览',
    type: 'pie-chart',
    defaultProps: { title: '在线离线汇总', chartType: 'pie', variant: 'pie-donut' },
    defaultStyle: { accentColor: '#22c55e' },
  },
  {
    id: 'alarm-count-card',
    group: '告警组件',
    title: '告警数量卡',
    description: '事件数量汇总',
    type: 'metric-card',
    defaultProps: { title: '告警数量卡', valueSuffix: '条', precision: 0 },
    defaultStyle: { accentColor: '#ef4444' },
  },
  {
    id: 'alarm-trend',
    group: '告警组件',
    title: '告警趋势图',
    description: '告警时间趋势',
    type: 'line-chart',
    defaultProps: { title: '告警趋势图', chartType: 'line', variant: 'line-stepped' },
    defaultStyle: { accentColor: '#ef4444' },
  },
  {
    id: 'alarm-level-distribution',
    group: '告警组件',
    title: '告警等级分布',
    description: '告警等级占比',
    type: 'pie-chart',
    defaultProps: { title: '告警等级分布', chartType: 'pie', variant: 'pie-solid' },
    defaultStyle: { accentColor: '#f59e0b' },
  },
  {
    id: 'latest-alarm-list',
    group: '告警组件',
    title: '最新告警列表',
    description: '最近事件队列',
    type: 'table',
    defaultProps: { title: '最新告警列表' },
  },
  {
    id: 'disposal-progress-table',
    group: '告警组件',
    title: '处置进度表',
    description: '事件处置进度',
    type: 'table',
    defaultProps: { title: '处置进度表' },
  },
  {
    id: 'app-shortcut-grid',
    group: '应用入口',
    title: '应用快捷入口',
    description: '常用应用入口',
    type: 'table',
    defaultProps: { title: '应用快捷入口' },
  },
  {
    id: 'app-category-list',
    group: '应用入口',
    title: '应用分类列表',
    description: '应用分类统计',
    type: 'bar-chart',
    defaultProps: { title: '应用分类列表', chartType: 'bar', variant: 'bar-horizontal' },
  },
  {
    id: 'mobile-app-status',
    group: '应用入口',
    title: '移动端应用状态',
    description: '移动端应用管理',
    type: 'metric-card',
    defaultProps: { title: '移动端应用状态', valueSuffix: '个', precision: 0 },
  },
  {
    id: 'standard-table',
    group: '表格组件',
    title: '标准数据表',
    description: '通用数据表格',
    type: 'table',
    defaultProps: { title: '标准数据表' },
  },
  {
    id: 'ranking-table',
    group: '表格组件',
    title: '排名表',
    description: '排名明细表',
    type: 'table',
    defaultProps: { title: '排名表' },
  },
  {
    id: 'event-detail-table',
    group: '表格组件',
    title: '事件明细表',
    description: '事件列表明细',
    type: 'table',
    defaultProps: { title: '事件明细表' },
  },
  {
    id: 'text',
    group: '文本图片',
    title: '文本',
    description: '通用文本模块',
    type: 'text',
    defaultProps: { text: '输入工作台说明文字' },
  },
  {
    id: 'heading-text',
    group: '文本图片',
    title: '标题文本',
    description: '页面主标题',
    type: 'text',
    defaultLayout: { width: 520, height: 88 },
    defaultProps: { text: '智慧教育数据中心' },
    defaultStyle: { fontSize: 34, fontWeight: 900 },
  },
  {
    id: 'paragraph-text',
    group: '文本图片',
    title: '段落说明',
    description: '辅助说明文字',
    type: 'text',
    defaultProps: { text: '展示学校治理、教学、应用与设备运行情况。' },
    defaultStyle: { fontSize: 20, fontWeight: 600 },
  },
  {
    id: 'image',
    group: '文本图片',
    title: '图片',
    description: '图片展示',
    type: 'image',
    defaultProps: { src: '', objectFit: 'cover' },
  },
  {
    id: 'decoration',
    group: '文本图片',
    title: '装饰边框',
    description: '画布结构装饰',
    type: 'decoration',
    defaultProps: { variant: 'frame' },
  },
  {
    id: 'third-party-web',
    group: '第三方网页',
    title: '第三方网页',
    description: '嵌入外部数据看板',
    type: 'web-embed',
    defaultLayout: { width: 720, height: 420 },
    defaultProps: { title: '第三方数据看板', url: 'https://demo.school.local/alarm-bi' },
  },
]

function cloneRecord(value: Record<string, unknown> | undefined): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value ?? {})) as Record<string, unknown>
}

function findEntry(entryId: string): WorkbenchPaletteEntry {
  const entry = entries.find((candidate) => candidate.id === entryId)
  if (!entry) {
    throw new Error(`Unknown workbench palette entry: ${entryId}`)
  }

  return entry
}

function getNextZIndex(schema: DashboardSchema): number {
  return Math.min(
    schema.components.reduce((max, component) => Math.max(max, component.layout.zIndex), 0) + 1,
    10000,
  )
}

function clampLayoutToCanvas(
  layout: DashboardComponent['layout'],
  canvas: DashboardSchema['canvas'],
): DashboardComponent['layout'] {
  const width = Math.min(Math.max(Math.round(layout.width), 24), canvas.width)
  const height = Math.min(Math.max(Math.round(layout.height), 24), canvas.height)
  const x = Math.min(Math.max(Math.round(layout.x), 0), Math.max(0, canvas.width - width))
  const y = Math.min(Math.max(Math.round(layout.y), 0), Math.max(0, canvas.height - height))

  return {
    ...layout,
    x,
    y,
    width,
    height,
    zIndex: Math.min(Math.max(Math.round(layout.zIndex), 0), 10000),
    visible: layout.visible ?? true,
  }
}

export function getWorkbenchPaletteEntries(): WorkbenchPaletteEntry[] {
  return entries.map((entry) => ({
    ...entry,
    defaultLayout: entry.defaultLayout ? { ...entry.defaultLayout } : undefined,
    defaultProps: cloneRecord(entry.defaultProps),
    defaultStyle: cloneRecord(entry.defaultStyle),
  }))
}

export function createComponentFromPaletteEntry(entryId: string, schema: DashboardSchema): DashboardComponent {
  const entry = findEntry(entryId)
  const index = schema.components.length
  const base = createComponent(entry.type, 64 + (index % 8) * 36, 64 + (index % 6) * 36, getNextZIndex(schema))

  return {
    ...base,
    name: entry.title,
    layout: clampLayoutToCanvas({ ...base.layout, ...entry.defaultLayout }, schema.canvas),
    props: { ...base.props, ...cloneRecord(entry.defaultProps) },
    style: { ...base.style, ...cloneRecord(entry.defaultStyle) },
  }
}
