import type { DataDashboardRow } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, test, vi } from 'vitest'
import DataDashboardsView from './DataDashboardsView.vue'

const elementStubs = {
  ElSelect: {
    props: ['modelValue'],
    template: '<select><slot /></select>',
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

const demoDashboardRows: DataDashboardRow[] = [
  {
    id: 'dashboard-governance',
    name: '教育治理',
    type: '治理分析',
    source: 'builtin',
    embedUrl: '',
    isDefault: true,
    visibleRoleCodes: ['all-staff', 'electro-education-director'],
    status: 'enabled',
    metrics: [
      { label: '治理事项', value: '128', trend: '本周 +12' },
      { label: '完成率', value: '93.6%', trend: '较昨日 +2.1%' },
      { label: '校区覆盖', value: '4', trend: '全部在线' },
    ],
    createdAt: '2026-07-09T10:10:00.000Z',
    updatedAt: '2026-07-09T10:10:00.000Z',
  },
  {
    id: 'dashboard-teacher',
    name: '教师发展',
    type: '教师发展',
    source: 'builtin',
    embedUrl: '',
    isDefault: true,
    visibleRoleCodes: ['teaching-research-director'],
    status: 'enabled',
    metrics: [{ label: '教研活动', value: '36', trend: '本月 +6' }],
    createdAt: '2026-07-09T09:42:00.000Z',
    updatedAt: '2026-07-09T09:42:00.000Z',
  },
  {
    id: 'dashboard-student',
    name: '学生成长',
    type: '学生成长',
    source: 'builtin',
    embedUrl: '',
    isDefault: true,
    visibleRoleCodes: ['moral-education-director'],
    status: 'enabled',
    metrics: [{ label: '成长档案', value: '1,286', trend: '全量同步' }],
    createdAt: '2026-07-09T09:20:00.000Z',
    updatedAt: '2026-07-09T09:20:00.000Z',
  },
  {
    id: 'dashboard-device',
    name: '设备运维',
    type: '设备运维',
    source: 'builtin',
    embedUrl: '',
    isDefault: false,
    visibleRoleCodes: ['electro-education-director'],
    status: 'enabled',
    metrics: [{ label: '在线设备', value: '642', trend: '在线率 98.6%' }],
    createdAt: '2026-07-09T09:05:00.000Z',
    updatedAt: '2026-07-09T09:05:00.000Z',
  },
  {
    id: 'dashboard-alarm',
    name: '告警态势',
    type: '告警态势',
    source: 'embedded',
    embedUrl: 'https://demo.school.local/alarm-bi',
    isDefault: false,
    visibleRoleCodes: ['electro-education-director'],
    status: 'disabled',
    metrics: [
      { label: '今日告警', value: '8', trend: '未处理 4' },
      { label: '平均响应', value: '6m', trend: '较昨日 -1m' },
      { label: '设备离线', value: '3', trend: '处理中' },
    ],
    createdAt: '2026-07-09T08:58:00.000Z',
    updatedAt: '2026-07-09T08:58:00.000Z',
  },
  {
    id: 'dashboard-app-usage',
    name: '应用使用',
    type: '应用使用',
    source: 'embedded',
    embedUrl: 'https://demo.school.local/app-usage',
    isDefault: false,
    visibleRoleCodes: ['all-staff', 'electro-education-director'],
    status: 'enabled',
    metrics: [{ label: '启用应用', value: '6', trend: '网页端 5' }],
    createdAt: '2026-07-09T08:45:00.000Z',
    updatedAt: '2026-07-09T08:45:00.000Z',
  },
]

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
    },
  }
})

function cloneDashboardRows(rows = demoDashboardRows): DataDashboardRow[] {
  return rows.map((row) => ({
    ...row,
    visibleRoleCodes: [...row.visibleRoleCodes],
    metrics: row.metrics.map((metric) => ({ ...metric })),
  }))
}

function listPayload(rows: DataDashboardRow[]) {
  return {
    items: cloneDashboardRows(rows),
    summary: {
      total: rows.length,
      default: rows.filter((row) => row.isDefault).length,
      embedded: rows.filter((row) => row.source === 'embedded').length,
    },
    filteredTotal: rows.length,
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data, error: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createDashboardFetchMock(initialRows = demoDashboardRows) {
  let rows = cloneDashboardRows(initialRows)

  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const requestUrl = String(url)
    const parsedUrl = new URL(requestUrl, 'https://example.test')
    const method = (init?.method ?? 'GET').toUpperCase()

    if (parsedUrl.pathname === '/api/data-dashboards' && method === 'GET') {
      const keyword = parsedUrl.searchParams.get('keyword')?.toLowerCase() ?? ''
      const type = parsedUrl.searchParams.get('type')
      const source = parsedUrl.searchParams.get('source')
      const status = parsedUrl.searchParams.get('status')
      const roleCode = parsedUrl.searchParams.get('roleCode')
      const filteredRows = rows.filter((row) => {
        const searchableText = [row.name, row.type, row.source, row.embedUrl].join(' ').toLowerCase()
        return (
          (!keyword || searchableText.includes(keyword)) &&
          (!type || row.type === type) &&
          (!source || row.source === source) &&
          (!status || row.status === status) &&
          (!roleCode || row.visibleRoleCodes.includes(roleCode as never))
        )
      })
      return jsonResponse(listPayload(filteredRows))
    }

    if (parsedUrl.pathname === '/api/data-dashboards' && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as Partial<DataDashboardRow>
      const created: DataDashboardRow = {
        id: 'dashboard-assets',
        name: body.name ?? '资产态势',
        type: body.type ?? '设备运维',
        source: body.source ?? 'embedded',
        embedUrl: body.embedUrl ?? '',
        isDefault: body.isDefault ?? false,
        visibleRoleCodes: body.visibleRoleCodes ?? ['electro-education-director'],
        status: body.status ?? 'enabled',
        metrics: body.metrics ?? [],
        createdAt: '2026-07-09T11:00:00.000Z',
        updatedAt: '2026-07-09T11:00:00.000Z',
      }
      rows = [...rows, created]
      return jsonResponse(created, 201)
    }

    if (parsedUrl.pathname === '/api/data-dashboards/demo-reset' && method === 'POST') {
      rows = cloneDashboardRows()
      return jsonResponse(listPayload(rows))
    }

    if (parsedUrl.pathname.startsWith('/api/data-dashboards/') && method === 'PATCH') {
      const id = decodeURIComponent(parsedUrl.pathname.replace('/api/data-dashboards/', ''))
      const body = JSON.parse(String(init?.body)) as Partial<DataDashboardRow>
      const current = rows.find((row) => row.id === id)
      if (!current) throw new Error(`Unknown dashboard id: ${id}`)
      const updated: DataDashboardRow = {
        ...current,
        ...body,
        updatedAt: '2026-07-09T11:05:00.000Z',
      }
      rows = rows.map((row) => (row.id === id ? updated : row))
      return jsonResponse(updated)
    }

    throw new Error(`Unhandled fetch: ${method} ${requestUrl}`)
  })
}

async function mountDashboardView(fetchMock = createDashboardFetchMock()) {
  vi.stubGlobal('fetch', fetchMock)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/data-dashboards', component: DataDashboardsView }],
  })
  await router.push('/data-dashboards')
  await router.isReady()

  const wrapper = mount(DataDashboardsView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return { wrapper, fetchMock }
}

describe('DataDashboardsView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('loads dashboards from the API and renders summary, filters, and table columns', async () => {
    const { wrapper, fetchMock } = await mountDashboardView()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/data-dashboards',
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(wrapper.get('[data-testid="dashboard-summary-total"]').text()).toBe('6')
    expect(wrapper.get('[data-testid="dashboard-summary-defaults"]').text()).toBe('3')
    expect(wrapper.get('[data-testid="dashboard-summary-embedded"]').text()).toBe('2')
    expect(wrapper.text()).toContain('数据看板')
    expect(wrapper.text()).toContain('看板名称')
    expect(wrapper.text()).toContain('来源')
    const columnLabels = wrapper.findAllComponents({ name: 'ElTableColumn' }).map((column) => column.props('label'))
    expect(columnLabels).toEqual(
      expect.arrayContaining(['看板名称', '看板类型', '使用角色', '来源', '状态', '更新时间', '操作']),
    )
    expect(wrapper.text()).toContain('教育治理')
    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).toContain('内置看板')
    expect(wrapper.text()).toContain('第三方嵌入')
    expect(wrapper.text()).not.toContain('本地演示状态')
  })

  test('filters dashboards by keyword and resets the table without replacing API state', async () => {
    const { wrapper, fetchMock } = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-keyword-input"]').setValue('告警')
    await wrapper.get('[data-testid="dashboard-search-button"]').trigger('click')
    await flushPromises()

    const searchCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/data-dashboards?'))
    expect(Object.fromEntries(new URL(String(searchCall?.[0]), 'https://example.test').searchParams)).toEqual({
      keyword: '告警',
    })
    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).not.toContain('教育治理')

    await wrapper.get('[data-testid="dashboard-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).toContain('教育治理')
  })

  test('opens the alarm preview with the API url and locked alarm metrics', async () => {
    const { wrapper } = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-preview-dashboard-alarm"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('配置数据看板')
    expect(wrapper.findComponent({ name: 'ElRadioGroup' }).props('disabled')).toBe(true)
    expect(wrapper.get('[data-testid="dashboard-status-control"]').text()).toContain('已停用')
    expect(wrapper.text()).toContain('https://demo.school.local/alarm-bi')
    const metrics = wrapper.get('[data-testid="dashboard-embed-metrics"]').text()
    expect(metrics).toContain('今日告警')
    expect(metrics).toContain('8')
    expect(metrics).toContain('未处理 4')
  })

  test('toggles dashboard status through PATCH and updates the table from the API response', async () => {
    const { wrapper, fetchMock } = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-toggle-dashboard-device"]').trigger('click')
    await flushPromises()

    const patchCall = fetchMock.mock.calls.find(([url]) => url === '/api/data-dashboards/dashboard-device')
    expect(patchCall).toBeTruthy()
    expect((patchCall?.[1] as RequestInit).method).toBe('PATCH')
    expect(JSON.parse((patchCall?.[1] as RequestInit).body as string)).toEqual({ status: 'disabled' })

    const dashboards = wrapper.findComponent({ name: 'ElTable' }).props('data') as Array<{
      id: string
      status: string
    }>
    expect(dashboards.find((dashboard) => dashboard.id === 'dashboard-device')?.status).toBe('已停用')
  })

  test('saves existing dashboard configuration through PATCH with API field names', async () => {
    const { wrapper, fetchMock } = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-preview-dashboard-governance"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('教育治理中枢')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    const patchCall = fetchMock.mock.calls.find(([url]) => url === '/api/data-dashboards/dashboard-governance')
    expect(JSON.parse((patchCall?.[1] as RequestInit).body as string)).toEqual({
      name: '教育治理中枢',
      type: '治理分析',
      source: 'builtin',
      embedUrl: '',
      isDefault: true,
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
      status: 'enabled',
    })
    expect(wrapper.text()).toContain('教育治理中枢')
  })

  test('validates and creates a third-party dashboard through POST', async () => {
    const { wrapper, fetchMock } = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-add-embed-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('看板名称不能为空')

    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('资产态势')
    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('javascript:alert(1)')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('第三方看板链接必须以 http:// 或 https:// 开头')

    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('https://demo.school.local/assets')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    const postCall = fetchMock.mock.calls.find(([url, init]) => {
      return url === '/api/data-dashboards' && (init as RequestInit).method === 'POST'
    })
    expect(JSON.parse((postCall?.[1] as RequestInit).body as string)).toMatchObject({
      name: '资产态势',
      type: '告警态势',
      source: 'embedded',
      embedUrl: 'https://demo.school.local/assets',
      isDefault: false,
      visibleRoleCodes: ['electro-education-director'],
      status: 'enabled',
    })
    expect(wrapper.text()).toContain('资产态势')
    expect(wrapper.text()).toContain('https://demo.school.local/assets')
  })

  test('resets demo dashboards through the API response', async () => {
    const { wrapper, fetchMock } = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-add-embed-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('资产态势')
    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('https://demo.school.local/assets')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('资产态势')

    await wrapper.get('[data-testid="dashboard-demo-reset-button"]').trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.some(([url, init]) => {
      return url === '/api/data-dashboards/demo-reset' && (init as RequestInit).method === 'POST'
    })).toBe(true)
    expect(wrapper.get('[data-testid="dashboard-summary-total"]').text()).toBe('6')
    expect(wrapper.get('[data-testid="dashboard-summary-defaults"]').text()).toBe('3')
    expect(wrapper.get('[data-testid="dashboard-summary-embedded"]').text()).toBe('2')
    expect(wrapper.text()).not.toContain('资产态势')
  })
})
