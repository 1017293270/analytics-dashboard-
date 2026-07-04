import {
  accountRowValidator,
  createAccountInputValidator,
  resetPasswordInputValidator,
  roleCodeValidator,
  updateAccountInputValidator,
  type AccountRow,
  type ApiResponse,
  type CreateAccountInput,
  type ResetPasswordInput,
  type RoleCode,
  type UpdateAccountInput,
} from '@analytics/shared'

export type AccountRoleRow = {
  id: string
  code: RoleCode
  name: string
  description: string
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

function parseAccountRoleRow(value: unknown): AccountRoleRow | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || value.id.length === 0) return null
  const code = roleCodeValidator.safeParse(value.code)
  if (!code.success) return null
  if (typeof value.name !== 'string' || value.name.length === 0) return null
  if (typeof value.description !== 'string') return null

  return {
    id: value.id,
    code: code.data,
    name: value.name,
    description: value.description,
  }
}

function parseAccountRoleList(value: unknown): AccountRoleRow[] {
  if (!Array.isArray(value)) throw new Error('Invalid role list response')
  const rows = value.map(parseAccountRoleRow)
  if (rows.some((row) => row === null)) throw new Error('Invalid role list response')
  return rows as AccountRoleRow[]
}

async function requestAccountJson<T>(url: string, init?: RequestInit): Promise<T> {
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

function parseAccountRow(value: unknown): AccountRow {
  const parsed = accountRowValidator.safeParse(value)
  if (!parsed.success) throw new Error('Invalid account response')
  return parsed.data
}

function parseAccountList(value: unknown): AccountRow[] {
  const parsed = accountRowValidator.array().safeParse(value)
  if (!parsed.success) throw new Error('Invalid account list response')
  return parsed.data
}

export const accountApi = {
  async listAccounts(init?: RequestInit) {
    return parseAccountList(await requestAccountJson<unknown>('/api/accounts', init))
  },
  async listRoles(init?: RequestInit) {
    return parseAccountRoleList(await requestAccountJson<unknown>('/api/roles', init))
  },
  async createAccount(input: CreateAccountInput, init?: RequestInit) {
    const body = createAccountInputValidator.parse(input)
    return parseAccountRow(
      await requestAccountJson<unknown>('/api/accounts', {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  },
  async updateAccount(id: string, input: UpdateAccountInput, init?: RequestInit) {
    const body = updateAccountInputValidator.parse(input)
    return parseAccountRow(
      await requestAccountJson<unknown>(`/api/accounts/${encodeURIComponent(id)}`, {
        ...init,
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    )
  },
  async resetPassword(id: string, input: ResetPasswordInput, init?: RequestInit) {
    const body = resetPasswordInputValidator.parse(input)
    return parseAccountRow(
      await requestAccountJson<unknown>(`/api/accounts/${encodeURIComponent(id)}/reset-password`, {
        ...init,
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  },
  async resetDemoAccounts(init?: RequestInit) {
    return parseAccountList(
      await requestAccountJson<unknown>('/api/accounts/demo-reset', {
        ...init,
        method: 'POST',
      }),
    )
  },
}
