import type { AccountRow, CreateAccountInput, UpdateAccountInput } from '@analytics/shared'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { accountApi } from './accountApi'

const accountRow: AccountRow = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  phone: '13800000001',
  status: 'active',
  roleCodes: ['system-admin'],
  lastLoginAt: '2026-07-03T09:18:00.000Z',
}

const roleRow = {
  id: 'role-system-admin',
  code: 'system-admin',
  name: '系统管理员',
  description: '平台配置与演示管理账号',
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, data, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('accountApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sends cookies and validates account list rows', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([accountRow]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(accountApi.listAccounts()).resolves.toEqual([accountRow])

    expect(fetchMock).toHaveBeenCalledWith('/api/accounts', expect.objectContaining({ credentials: 'include' }))

    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...accountRow, status: 'paused' }]))

    await expect(accountApi.listAccounts()).rejects.toThrow('Invalid account list response')
  })

  test('validates the read-only role list response', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse([roleRow]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(accountApi.listRoles()).resolves.toEqual([roleRow])

    expect(fetchMock).toHaveBeenCalledWith('/api/roles', expect.objectContaining({ credentials: 'include' }))

    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...roleRow, code: 'guest' }]))

    await expect(accountApi.listRoles()).rejects.toThrow('Invalid role list response')
  })

  test('create, update, and reset target the exact account routes', async () => {
    const createInput: CreateAccountInput = {
      username: 'demo_teacher',
      displayName: '演示教师',
      phone: '13800000006',
      password: 'Demo@123',
      roleCodes: ['all-staff'],
    }
    const updateInput: UpdateAccountInput = {
      displayName: '演示教师',
      phone: '13800000007',
      roleCodes: ['all-staff'],
      status: 'disabled',
    }
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(accountRow)))
    vi.stubGlobal('fetch', fetchMock)

    await accountApi.createAccount(createInput)
    await accountApi.updateAccount('user-system-admin', updateInput)
    await accountApi.resetPassword('user-system-admin', { password: 'Demo@123' })

    expect(fetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit).method])).toEqual([
      ['/api/accounts', 'POST'],
      ['/api/accounts/user-system-admin', 'PATCH'],
      ['/api/accounts/user-system-admin/reset-password', 'POST'],
    ])
    expect(fetchMock.mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual(createInput)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual(updateInput)
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual({ password: 'Demo@123' })
  })
})
