import {
  alarmDetailValidator,
  alarmListQueryValidator,
  alarmStatusActionInputValidator,
  createAlarmDisposalRecordInputValidator,
  type AlarmDetail,
  type AlarmListQuery,
  type AlarmStatusActionInput,
  type ApiResponse,
  type CreateAlarmDisposalRecordInput,
} from '@analytics/shared'

export type AlarmSummaryPayload = {
  total: number
  unhandled: number
  processing: number
  resolved: number
}

export type AlarmListPayload = {
  items: AlarmDetail[]
  summary: AlarmSummaryPayload
  filteredTotal: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isRecord(value)) return false
  if (value.success === true) return Object.prototype.hasOwnProperty.call(value, 'data')
  if (value.success === false) {
    const error = value.error
    return isRecord(error) && typeof error.code === 'string' && typeof error.message === 'string'
  }

  return false
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

async function requestAlarmJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init?.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })
  const text = await response.text()
  let body: unknown = null

  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      throw new Error('Invalid API response')
    }
  }

  if (!isApiResponse<T>(body)) throw new Error('Invalid API response')
  if (!body.success) throw new Error(body.error.message)

  return body.data
}

function parseAlarmDetail(value: unknown): AlarmDetail {
  const parsed = alarmDetailValidator.safeParse(value)
  if (!parsed.success) throw new Error('Invalid alarm response')
  return parsed.data
}

function parseAlarmSummary(value: unknown): AlarmSummaryPayload | null {
  if (!isRecord(value)) return null
  const { total, unhandled, processing, resolved } = value
  if (
    !isNonnegativeInteger(total) ||
    !isNonnegativeInteger(unhandled) ||
    !isNonnegativeInteger(processing) ||
    !isNonnegativeInteger(resolved)
  ) {
    return null
  }

  return { total, unhandled, processing, resolved }
}

function parseAlarmListPayload(value: unknown): AlarmListPayload {
  if (!isRecord(value)) throw new Error('Invalid alarm list response')
  const items = alarmDetailValidator.array().safeParse(value.items)
  const summary = parseAlarmSummary(value.summary)

  if (!items.success || summary === null || !isNonnegativeInteger(value.filteredTotal)) {
    throw new Error('Invalid alarm list response')
  }

  return {
    items: items.data,
    summary,
    filteredTotal: value.filteredTotal,
  }
}

function buildAlarmListUrl(query: Partial<AlarmListQuery> = {}) {
  const parsed = alarmListQueryValidator.parse(query)
  const params = new URLSearchParams()

  if (parsed.keyword.trim().length > 0) params.set('keyword', parsed.keyword.trim())
  if (parsed.status) params.set('status', parsed.status)
  if (parsed.triggerMethod) params.set('triggerMethod', parsed.triggerMethod)
  if (parsed.reportedFrom) params.set('reportedFrom', parsed.reportedFrom)
  if (parsed.reportedTo) params.set('reportedTo', parsed.reportedTo)
  if (parsed.deviceIdentifier) params.set('deviceIdentifier', parsed.deviceIdentifier)

  return params.size > 0 ? `/api/alarms?${params.toString()}` : '/api/alarms'
}

export const alarmApi = {
  async listAlarms(query?: Partial<AlarmListQuery>, init?: RequestInit) {
    return parseAlarmListPayload(await requestAlarmJson<unknown>(buildAlarmListUrl(query), init))
  },
  async getAlarm(id: string, init?: RequestInit) {
    return parseAlarmDetail(await requestAlarmJson<unknown>(`/api/alarms/${encodeURIComponent(id)}`, init))
  },
  async updateAlarmStatus(id: string, input: AlarmStatusActionInput, init?: RequestInit) {
    const body = alarmStatusActionInputValidator.parse(input)
    return parseAlarmDetail(
      await requestAlarmJson<unknown>(`/api/alarms/${encodeURIComponent(id)}/status`, {
        ...init,
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    )
  },
  async createDisposalRecord(id: string, input: CreateAlarmDisposalRecordInput, init?: RequestInit) {
    const body = createAlarmDisposalRecordInputValidator.parse(input)
    return parseAlarmDetail(
      await requestAlarmJson<unknown>(`/api/alarms/${encodeURIComponent(id)}/disposal-records`, {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  },
  async resetDemoAlarms(init?: RequestInit) {
    return parseAlarmListPayload(
      await requestAlarmJson<unknown>('/api/alarms/demo-reset', {
        ...init,
        method: 'POST',
      }),
    )
  },
}
