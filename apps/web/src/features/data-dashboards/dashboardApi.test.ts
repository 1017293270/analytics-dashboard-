import type {
  CreateDataDashboardInput,
  DataDashboardListQuery,
  DataDashboardRow,
  UpdateDataDashboardInput,
} from '@analytics/shared'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { dashboardApi } from './dashboardApi'

const dashboardRow: DataDashboardRow = {
  id: 'dashboard-alarm',
  name: '告警态势',
  type: '告警态势',
  source: 'embedded',
  embedUrl: 'https://demo.school.local/alarm-bi',
  isDefault: false,
  visibleRoleCodes: ['electro-education-director'],
  status: 'disabled',
  metrics: [{ label: '今日告警', value: '8', trend: '未处理 4' }],
  createdAt: '2026-07-09T08:58:00.000Z',
  updatedAt: '2026-07-09T08:58:00.000Z',
}

function listPayload(items: unknown) {
  return {
    items,
    summary: {
      total: 6,
      default: 3,
      embedded: 2,
    },
    filteredTotal: Array.isArray(items) ? items.length : 0,
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data, error: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('dashboardApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sends cookies and validates list payload rows and summary counts', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(listPayload([dashboardRow])))
    vi.stubGlobal('fetch', fetchMock)

    await expect(dashboardApi.listDashboards()).resolves.toEqual(listPayload([dashboardRow]))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/data-dashboards',
      expect.objectContaining({ credentials: 'include' }),
    )

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        listPayload([
          {
            ...dashboardRow,
            status: 'paused',
          },
        ]),
      ),
    )

    await expect(dashboardApi.listDashboards()).rejects.toThrow('Invalid data dashboard list response')

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        ...listPayload([dashboardRow]),
        summary: { total: 6, defaults: 3, embedded: 2 },
      }),
    )

    await expect(dashboardApi.listDashboards()).rejects.toThrow('Invalid data dashboard list response')
  })

  test('serializes list query params before loading dashboard rows', async () => {
    const query: Partial<DataDashboardListQuery> = {
      keyword: '告警',
      type: '告警态势',
      source: 'embedded',
      status: 'disabled',
      roleCode: 'electro-education-director',
    }
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(listPayload([dashboardRow])))
    vi.stubGlobal('fetch', fetchMock)

    await expect(dashboardApi.listDashboards(query)).resolves.toEqual(listPayload([dashboardRow]))

    const [url, init] = fetchMock.mock.calls[0]
    const parsedUrl = new URL(String(url), 'https://example.test')
    expect(parsedUrl.pathname).toBe('/api/data-dashboards')
    expect(Object.fromEntries(parsedUrl.searchParams)).toEqual(query)
    expect(init).toEqual(expect.objectContaining({ credentials: 'include' }))
  })

  test('create, update, and reset target the exact dashboard routes', async () => {
    const createInput: CreateDataDashboardInput = {
      name: '资产态势',
      type: '设备运维',
      source: 'embedded',
      embedUrl: 'https://demo.school.local/assets',
      isDefault: false,
      visibleRoleCodes: ['electro-education-director'],
      status: 'enabled',
      metrics: [{ label: '外部指标', value: '已接入', trend: '第三方链接' }],
    }
    const updateInput: UpdateDataDashboardInput = {
      name: '告警态势',
      type: '告警态势',
      source: 'embedded',
      embedUrl: 'https://demo.school.local/alarm-bi',
      isDefault: false,
      visibleRoleCodes: ['electro-education-director'],
      status: 'enabled',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(dashboardRow, 201))
      .mockResolvedValueOnce(jsonResponse({ ...dashboardRow, status: 'enabled' }))
      .mockResolvedValueOnce(jsonResponse(listPayload([dashboardRow])))
    vi.stubGlobal('fetch', fetchMock)

    await dashboardApi.createDashboard(createInput)
    await dashboardApi.updateDashboard('dashboard-alarm', updateInput)
    await dashboardApi.resetDemoDashboards()

    expect(fetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit).method])).toEqual([
      ['/api/data-dashboards', 'POST'],
      ['/api/data-dashboards/dashboard-alarm', 'PATCH'],
      ['/api/data-dashboards/demo-reset', 'POST'],
    ])
    expect(fetchMock.mock.calls.every(([, init]) => (init as RequestInit).credentials === 'include')).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual(createInput)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual(updateInput)
  })

  test('rejects invalid API envelopes and propagates API failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [dashboardRow] })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            data: null,
            error: { code: 'DATA_DASHBOARD_FORBIDDEN', message: 'Only system administrators can manage data dashboards' },
          }),
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(dashboardApi.listDashboards()).rejects.toThrow('Invalid API response')
    await expect(dashboardApi.listDashboards()).rejects.toThrow(
      'Only system administrators can manage data dashboards',
    )
  })
})
