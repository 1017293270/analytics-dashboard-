import type { ApiResponse, DashboardSchema } from '@analytics/shared'

export type DashboardRecord = {
  id: string
  name: string
  description?: string | null
  status: 'draft' | 'published' | 'archived'
  draftSchema: DashboardSchema
  publishedSchema?: DashboardSchema | null
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isRecord(value)) return false

  if (value.success === true) {
    return Object.prototype.hasOwnProperty.call(value, 'data')
  }

  if (value.success === false) {
    const error = value.error
    return isRecord(error) && typeof error.code === 'string' && typeof error.message === 'string'
  }

  return false
}

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...init,
    headers,
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

  if (!isApiResponse<T>(body)) {
    throw new Error('Invalid API response')
  }

  if (!body.success) {
    throw new Error(body.error.message)
  }

  return body.data
}

export const bigScreenApi = {
  createDashboard(input: { name: string; description?: string }) {
    return requestJson<DashboardRecord>('/api/big-screens', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  getDashboard(id: string) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}`)
  },
  saveDraft(id: string, draftSchema: DashboardSchema) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ draftSchema }),
    })
  },
  publish(id: string) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publishNote: 'Published from designer' }),
    })
  },
  getRuntime(id: string) {
    return requestJson<{ id: string; name: string; schema: DashboardSchema; publishedAt?: string | null }>(
      `/api/big-screens/${id}/runtime`,
    )
  },
}
