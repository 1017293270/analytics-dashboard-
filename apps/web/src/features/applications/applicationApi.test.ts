import type {
  ApplicationCategoryRow,
  ApplicationListQuery,
  ApplicationRow,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '@analytics/shared'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { applicationApi } from './applicationApi'

const applicationRow: ApplicationRow = {
  id: 'app-governance',
  name: '教育治理看板',
  categoryId: 'data-dashboard',
  categoryName: '数据看板',
  platform: 'web',
  url: 'https://demo.school.local/governance',
  packageId: '',
  icon: 'dashboard',
  visibleRoleCodes: ['all-staff', 'electro-education-director'],
  status: 'enabled',
  sortOrder: 7,
  createdAt: '2026-07-04T08:00:00.000Z',
  updatedAt: '2026-07-04T08:00:00.000Z',
}

const categoryRows: ApplicationCategoryRow[] = [
  { id: 'teaching-tools', name: '教学工具', sortOrder: 1 },
  { id: 'management-tools', name: '管理工具', sortOrder: 2 },
]

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ success: true, data, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('applicationApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sends cookies and validates application list payloads', async () => {
    const listPayload = {
      items: [applicationRow],
      summary: { total: 8, web: 5, mobile: 3, enabled: 6 },
      filteredTotal: 1,
    }
    const query: ApplicationListQuery = {
      keyword: '治理',
      categoryId: 'data-dashboard',
      platform: 'web',
      status: 'enabled',
      visibleRoleCode: 'electro-education-director',
    }
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    await expect(applicationApi.listApplications(query)).resolves.toEqual(listPayload)

    const [url, init] = fetchMock.mock.calls[0]
    const parsedUrl = new URL(String(url), 'https://example.test')
    expect(parsedUrl.pathname).toBe('/api/applications')
    expect(Object.fromEntries(parsedUrl.searchParams)).toEqual(query)
    expect(init).toEqual(expect.objectContaining({ credentials: 'include' }))

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        items: [{ ...applicationRow, status: 'paused' }],
        summary: listPayload.summary,
        filteredTotal: 1,
      }),
    )

    await expect(applicationApi.listApplications()).rejects.toThrow('Invalid application list response')
  })

  test('accepts partial application list filters', async () => {
    const listPayload = {
      items: [applicationRow],
      summary: { total: 8, web: 5, mobile: 3, enabled: 6 },
      filteredTotal: 1,
    }
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(listPayload))
    vi.stubGlobal('fetch', fetchMock)

    await expect(applicationApi.listApplications({ status: 'enabled' })).resolves.toEqual(listPayload)

    const [url, init] = fetchMock.mock.calls[0]
    const parsedUrl = new URL(String(url), 'https://example.test')
    expect(parsedUrl.pathname).toBe('/api/applications')
    expect(Object.fromEntries(parsedUrl.searchParams)).toEqual({ status: 'enabled' })
    expect(init).toEqual(expect.objectContaining({ credentials: 'include' }))
  })

  test('validates application category rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(categoryRows))
      .mockResolvedValueOnce(new Response('{not-json', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(applicationApi.listCategories()).resolves.toEqual(categoryRows)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/application-categories',
      expect.objectContaining({ credentials: 'include' }),
    )

    fetchMock.mockResolvedValueOnce(jsonResponse([{ ...categoryRows[0], id: '' }]))

    await expect(applicationApi.listCategories()).rejects.toThrow('Invalid API response')
    await expect(applicationApi.listCategories()).rejects.toThrow('Invalid application category response')
  })

  test('create, update, uninstall, and demo reset target the exact API routes', async () => {
    const createInput: CreateApplicationInput = {
      name: '访客预约系统',
      categoryId: 'management-tools',
      platform: 'web',
      url: 'https://demo.school.local/visitor',
      packageId: '',
      icon: 'notice',
      visibleRoleCodes: ['all-staff'],
      status: 'enabled',
    }
    const updateInput: UpdateApplicationInput = {
      name: '教育治理驾驶舱',
      categoryId: 'data-dashboard',
      platform: 'web',
      url: 'https://demo.school.local/governance',
      packageId: '',
      icon: 'dashboard',
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
      status: 'disabled',
    }
    const resetPayload = {
      items: [applicationRow],
      summary: { total: 8, web: 5, mobile: 3, enabled: 6 },
      filteredTotal: 1,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(applicationRow))
      .mockResolvedValueOnce(jsonResponse({ ...applicationRow, status: 'disabled' }))
      .mockResolvedValueOnce(jsonResponse({ ...applicationRow, status: 'uninstalled' }))
      .mockResolvedValueOnce(jsonResponse(resetPayload))
    vi.stubGlobal('fetch', fetchMock)

    await applicationApi.createApplication(createInput)
    await applicationApi.updateApplication('app-governance', updateInput)
    await applicationApi.uninstallApplication('app-governance')
    await applicationApi.resetDemoApplications()

    expect(fetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit).method])).toEqual([
      ['/api/applications', 'POST'],
      ['/api/applications/app-governance', 'PATCH'],
      ['/api/applications/app-governance/uninstall', 'POST'],
      ['/api/applications/demo-reset', 'POST'],
    ])
    expect(fetchMock.mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual(createInput)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual(updateInput)
  })
})
