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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringNumberRecord(value: unknown): value is Record<string, string | number> {
  return isRecord(value) && Object.values(value).every((field) => typeof field === 'string' || isFiniteNumber(field))
}

export function isMetricData(value: unknown): value is MetricData {
  return (
    isRecord(value) &&
    value.kind === 'metric' &&
    isFiniteNumber(value.value) &&
    typeof value.label === 'string' &&
    isFiniteNumber(value.trend)
  )
}

export function isTimeSeriesData(value: unknown): value is TimeSeriesData {
  return (
    isRecord(value) &&
    value.kind === 'time-series' &&
    Array.isArray(value.rows) &&
    value.rows.every((row) => isRecord(row) && typeof row.date === 'string' && isFiniteNumber(row.count))
  )
}

export function isCategoryData(value: unknown): value is CategoryData {
  return (
    isRecord(value) &&
    value.kind === 'category' &&
    Array.isArray(value.rows) &&
    value.rows.every((row) => isRecord(row) && typeof row.category === 'string' && isFiniteNumber(row.value))
  )
}

export function isTableData(value: unknown): value is TableData {
  return (
    isRecord(value) &&
    value.kind === 'table' &&
    Array.isArray(value.columns) &&
    value.columns.every((column) => typeof column === 'string') &&
    Array.isArray(value.rows) &&
    value.rows.every(isStringNumberRecord)
  )
}

export function isComponentData(value: unknown): value is ComponentData {
  return isMetricData(value) || isTimeSeriesData(value) || isCategoryData(value) || isTableData(value)
}
