import type { ApiResponse, CurrentUser } from '@analytics/shared'

export type LoginInput = {
  username: string
  password: string
}

export type LogoutResult = {
  loggedOut: boolean
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

async function requestAuthJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init?.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })
  const text = await response.text()
  const body = text ? (JSON.parse(text) as unknown) : null

  if (!isApiResponse<T>(body)) throw new Error('Invalid API response')
  if (!body.success) throw new Error(body.error.message)

  return body.data
}

export const authApi = {
  login(input: LoginInput, init?: RequestInit) {
    return requestAuthJson<CurrentUser>('/api/auth/login', {
      ...init,
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  logout(init?: RequestInit) {
    return requestAuthJson<LogoutResult>('/api/auth/logout', {
      ...init,
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  getCurrentUser(init?: RequestInit) {
    return requestAuthJson<CurrentUser>('/api/auth/me', init)
  },
}
