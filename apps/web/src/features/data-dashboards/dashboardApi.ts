import {
  createDataDashboardInputValidator,
  dataDashboardListQueryValidator,
  dataDashboardRowValidator,
  updateDataDashboardInputValidator,
  type ApiResponse,
  type CreateDataDashboardInput,
  type DataDashboardListQuery,
  type DataDashboardRow,
  type UpdateDataDashboardInput,
} from '@analytics/shared'

export type DataDashboardListSummary = {
  total: number
  default: number
  embedded: number
}

export type DataDashboardListPayload = {
  items: DataDashboardRow[]
  summary: DataDashboardListSummary
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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function parseDataDashboardSummary(value: unknown): DataDashboardListSummary {
  if (!isRecord(value)) throw new Error('Invalid data dashboard list response')
  if (!isNonNegativeInteger(value.total)) throw new Error('Invalid data dashboard list response')
  if (!isNonNegativeInteger(value.default)) throw new Error('Invalid data dashboard list response')
  if (!isNonNegativeInteger(value.embedded)) throw new Error('Invalid data dashboard list response')

  return {
    total: value.total,
    default: value.default,
    embedded: value.embedded,
  }
}

function parseDataDashboardRow(value: unknown, message = 'Invalid data dashboard response'): DataDashboardRow {
  const parsed = dataDashboardRowValidator.safeParse(value)
  if (!parsed.success) throw new Error(message)
  return parsed.data
}

function parseDataDashboardListPayload(value: unknown): DataDashboardListPayload {
  if (!isRecord(value) || !Array.isArray(value.items)) throw new Error('Invalid data dashboard list response')
  if (!isNonNegativeInteger(value.filteredTotal)) throw new Error('Invalid data dashboard list response')

  return {
    items: value.items.map((item) => parseDataDashboardRow(item, 'Invalid data dashboard list response')),
    summary: parseDataDashboardSummary(value.summary),
    filteredTotal: value.filteredTotal,
  }
}

async function requestDashboardJson<T>(url: string, init?: RequestInit): Promise<T> {
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

function dataDashboardsUrl(query: Partial<DataDashboardListQuery> = {}): string {
  const parsed = dataDashboardListQueryValidator.parse(query)
  const params = new URLSearchParams()

  if (parsed.keyword.trim().length > 0) params.set('keyword', parsed.keyword.trim())
  if (parsed.type) params.set('type', parsed.type)
  if (parsed.source) params.set('source', parsed.source)
  if (parsed.status) params.set('status', parsed.status)
  if (parsed.roleCode) params.set('roleCode', parsed.roleCode)

  const queryString = params.toString()
  return queryString ? `/api/data-dashboards?${queryString}` : '/api/data-dashboards'
}

export const dashboardApi = {
  async listDashboards(query?: Partial<DataDashboardListQuery>, init?: RequestInit) {
    return parseDataDashboardListPayload(await requestDashboardJson<unknown>(dataDashboardsUrl(query), init))
  },
  async createDashboard(input: CreateDataDashboardInput, init?: RequestInit) {
    const body = createDataDashboardInputValidator.parse(input)
    return parseDataDashboardRow(
      await requestDashboardJson<unknown>('/api/data-dashboards', {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  },
  async updateDashboard(id: string, input: UpdateDataDashboardInput, init?: RequestInit) {
    const body = updateDataDashboardInputValidator.parse(input)
    return parseDataDashboardRow(
      await requestDashboardJson<unknown>(`/api/data-dashboards/${encodeURIComponent(id)}`, {
        ...init,
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    )
  },
  async resetDemoDashboards(init?: RequestInit) {
    return parseDataDashboardListPayload(
      await requestDashboardJson<unknown>('/api/data-dashboards/demo-reset', {
        ...init,
        method: 'POST',
      }),
    )
  },
}
