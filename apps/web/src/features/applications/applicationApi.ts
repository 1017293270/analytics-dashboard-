import {
  applicationCategoryRowValidator,
  applicationListQueryValidator,
  applicationRowValidator,
  createApplicationInputValidator,
  updateApplicationInputValidator,
  type ApiResponse,
  type ApplicationCategoryRow,
  type ApplicationListQuery,
  type ApplicationRow,
  type CreateApplicationInput,
  type UpdateApplicationInput,
} from '@analytics/shared'

export type ApplicationSummary = {
  total: number
  web: number
  mobile: number
  enabled: number
}

export type ApplicationListPayload = {
  items: ApplicationRow[]
  summary: ApplicationSummary
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

function parseSummary(value: unknown): ApplicationSummary {
  if (!isRecord(value)) throw new Error('Invalid application list response')
  if (
    !isNonnegativeInteger(value.total) ||
    !isNonnegativeInteger(value.web) ||
    !isNonnegativeInteger(value.mobile) ||
    !isNonnegativeInteger(value.enabled)
  ) {
    throw new Error('Invalid application list response')
  }

  return {
    total: value.total,
    web: value.web,
    mobile: value.mobile,
    enabled: value.enabled,
  }
}

function parseApplicationRow(value: unknown): ApplicationRow {
  const parsed = applicationRowValidator.safeParse(value)
  if (!parsed.success) throw new Error('Invalid application response')
  return parsed.data
}

function parseApplicationListPayload(value: unknown): ApplicationListPayload {
  if (!isRecord(value)) throw new Error('Invalid application list response')
  const items = applicationRowValidator.array().safeParse(value.items)
  if (!items.success || !isNonnegativeInteger(value.filteredTotal)) {
    throw new Error('Invalid application list response')
  }

  return {
    items: items.data,
    summary: parseSummary(value.summary),
    filteredTotal: value.filteredTotal,
  }
}

function parseCategoryList(value: unknown): ApplicationCategoryRow[] {
  const parsed = applicationCategoryRowValidator.array().safeParse(value)
  if (!parsed.success) throw new Error('Invalid application category response')
  return parsed.data
}

async function requestApplicationJson<T>(url: string, init?: RequestInit): Promise<T> {
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

function applicationsUrl(query?: Partial<ApplicationListQuery>): string {
  if (query === undefined) return '/api/applications'

  const parsed = applicationListQueryValidator.parse(query)
  const params = new URLSearchParams()
  if (parsed.keyword) params.set('keyword', parsed.keyword)
  if (parsed.categoryId) params.set('categoryId', parsed.categoryId)
  if (parsed.platform) params.set('platform', parsed.platform)
  if (parsed.status) params.set('status', parsed.status)
  if (parsed.visibleRoleCode) params.set('visibleRoleCode', parsed.visibleRoleCode)

  const queryString = params.toString()
  return queryString ? `/api/applications?${queryString}` : '/api/applications'
}

export const applicationApi = {
  async listApplications(query?: Partial<ApplicationListQuery>, init?: RequestInit) {
    return parseApplicationListPayload(await requestApplicationJson<unknown>(applicationsUrl(query), init))
  },
  async listCategories(init?: RequestInit) {
    return parseCategoryList(await requestApplicationJson<unknown>('/api/application-categories', init))
  },
  async createApplication(input: CreateApplicationInput, init?: RequestInit) {
    const body = createApplicationInputValidator.parse(input)
    return parseApplicationRow(
      await requestApplicationJson<unknown>('/api/applications', {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  },
  async updateApplication(id: string, input: UpdateApplicationInput, init?: RequestInit) {
    const body = updateApplicationInputValidator.parse(input)
    return parseApplicationRow(
      await requestApplicationJson<unknown>(`/api/applications/${encodeURIComponent(id)}`, {
        ...init,
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    )
  },
  async uninstallApplication(id: string, init?: RequestInit) {
    return parseApplicationRow(
      await requestApplicationJson<unknown>(`/api/applications/${encodeURIComponent(id)}/uninstall`, {
        ...init,
        method: 'POST',
      }),
    )
  },
  async resetDemoApplications(init?: RequestInit) {
    return parseApplicationListPayload(
      await requestApplicationJson<unknown>('/api/applications/demo-reset', {
        ...init,
        method: 'POST',
      }),
    )
  },
}
