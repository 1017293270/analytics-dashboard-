import type { DataBinding } from '@analytics/shared'

export type MetricData = { kind: 'metric'; value: number; label: string; trend: number }
export type TimeSeriesData = { kind: 'time-series'; rows: Array<{ date: string; count: number }> }
export type CategoryData = { kind: 'category'; rows: Array<{ category: string; value: number }> }
export type TableData = { kind: 'table'; columns: string[]; rows: Array<Record<string, string | number>> }
export type ComponentData = MetricData | TimeSeriesData | CategoryData | TableData

export type DataLoadState =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: ComponentData | null; error: null }
  | { status: 'success'; data: ComponentData; error: null }
  | { status: 'empty'; data: null; error: null }
  | { status: 'error'; data: ComponentData | null; error: string }

export interface DataAdapter {
  query(binding: DataBinding): Promise<ComponentData>
}
