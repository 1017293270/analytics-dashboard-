import type { ApiResponse, DashboardSchema } from '@analytics/shared'
import { bigScreenText } from '../i18n/zh-CN'

export type DashboardRecord = {
  id: string
  name: string
  description?: string | null
  status: 'draft' | 'published' | 'archived'
  draftSchema: DashboardSchema
  publishedSchema?: DashboardSchema | null
  createdAt?: string
  updatedAt: string
  publishedAt?: string | null
}

export type WorkbenchAvailabilityCode = 'enabled' | 'disabled'

export type WorkbenchSettings = {
  dashboardId: string
  visibleRoles: string[]
  availability: WorkbenchAvailabilityCode
}

export type DashboardListItem = Omit<DashboardRecord, 'draftSchema' | 'publishedSchema'> & {
  visibleRoles?: string[]
  availability?: WorkbenchAvailabilityCode
}

export type DashboardRuntime = {
  id: string
  name: string
  schema: DashboardSchema
  publishedAt?: string | null
}

export type DashboardShareLink = {
  id: string
  dashboardId: string
  token: string
  accessScope: string
  expiresAt?: string | null
  url: string
}

export type DashboardVersion = {
  id: string
  dashboardId: string
  version: number
  publishNote?: string | null
  createdBy: string
  createdAt: string
}

export type CreateDashboardInput = {
  name: string
  description?: string
  clientReservationId?: string
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
      throw new Error(bigScreenText.common.errors.invalidApiResponse)
    }
  }

  if (!isApiResponse<T>(body)) {
    throw new Error(bigScreenText.common.errors.invalidApiResponse)
  }

  if (!body.success) {
    throw new Error(body.error.message)
  }

  return body.data
}

export const bigScreenApi = {
  listDashboards(init?: RequestInit) {
    return requestJson<DashboardListItem[]>('/api/big-screens', init)
  },
  createDashboard(input: CreateDashboardInput, init?: RequestInit) {
    return requestJson<DashboardRecord>('/api/big-screens', {
      ...init,
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  getDashboard(id: string, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}`, init)
  },
  updateDashboard(id: string, input: { name: string; expectedUpdatedAt: string }, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}`, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },
  saveDraft(id: string, draftSchema: DashboardSchema, expectedUpdatedAt: string, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/draft`, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify({ draftSchema, expectedUpdatedAt }),
    })
  },
  publish(id: string, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/publish`, {
      ...init,
      method: 'POST',
      body: JSON.stringify({ publishNote: bigScreenText.publishing.designerNote }),
    })
  },
  copyDashboard(id: string, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/copy`, {
      ...init,
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  deleteDashboard(id: string, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}`, {
      ...init,
      method: 'DELETE',
    })
  },
  unpublish(id: string, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/unpublish`, {
      ...init,
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  createShareLink(id: string, init?: RequestInit) {
    return requestJson<DashboardShareLink>(`/api/big-screens/${id}/share-links`, {
      ...init,
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  listVersions(id: string, init?: RequestInit) {
    return requestJson<DashboardVersion[]>(`/api/big-screens/${id}/versions`, init)
  },
  rollbackVersion(id: string, version: number, init?: RequestInit) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/versions/${version}/rollback`, {
      ...init,
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  updateWorkbenchSettings(id: string, input: Omit<WorkbenchSettings, 'dashboardId'>, init?: RequestInit) {
    return requestJson<WorkbenchSettings>(`/api/big-screens/${id}/workbench-settings`, {
      ...init,
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },
  getRuntime(id: string, init?: RequestInit) {
    return requestJson<DashboardRuntime>(`/api/big-screens/${id}/runtime`, init)
  },
  getSharedRuntime(token: string, init?: RequestInit) {
    return requestJson<DashboardRuntime>(`/api/public/big-screens/${token}`, init)
  },
}
