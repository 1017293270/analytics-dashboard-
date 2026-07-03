import { describe, expect, test } from 'vitest'
import {
  applyDashboardFilters,
  createDashboardDraft,
  dashboardSummary,
  seedDashboards,
  validateDashboardDraft,
  type DashboardDraft,
  type DashboardFilters,
} from './dashboardData'

describe('dashboardData', () => {
  test('summarizes total, enabled, default, and embedded dashboards', () => {
    expect(dashboardSummary(seedDashboards)).toEqual({
      total: 6,
      enabled: 5,
      defaults: 3,
      embedded: 2,
    })
  })

  test('filters dashboards by keyword, type, role, status, and source', () => {
    const filters: DashboardFilters = {
      keyword: '告警',
      type: '告警态势',
      visibleRole: '电教主任',
      status: '已停用',
      source: '第三方嵌入',
    }

    expect(applyDashboardFilters(seedDashboards, filters).map((dashboard) => dashboard.name)).toEqual(['告警态势'])
  })

  test('returns all dashboards when filters are empty', () => {
    expect(
      applyDashboardFilters(seedDashboards, {
        keyword: '',
        type: '全部',
        visibleRole: '全部',
        status: '全部',
        source: '全部',
      }),
    ).toHaveLength(seedDashboards.length)
  })

  test('creates built-in and third-party dashboard drafts', () => {
    expect(createDashboardDraft()).toMatchObject({
      name: '',
      type: '治理分析',
      source: '内置看板',
      url: '',
      isDefault: false,
      visibleRoles: ['全员'],
      status: '已启用',
    })
    expect(createDashboardDraft('第三方嵌入')).toMatchObject({
      source: '第三方嵌入',
      visibleRoles: ['电教主任'],
      status: '已启用',
    })
  })

  test('validates required fields and third-party URLs', () => {
    const missingName: DashboardDraft = {
      ...createDashboardDraft(),
      name: '',
    }
    const missingRole: DashboardDraft = {
      ...createDashboardDraft(),
      name: '测试看板',
      visibleRoles: [],
    }
    const missingUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: '',
    }
    const invalidUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: 'javascript:alert(1)',
    }
    const missingSlashesUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: 'https:demo.school.local/board',
    }
    const validUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: 'https://demo.school.local/board',
    }

    expect(validateDashboardDraft(missingName)).toContain('看板名称不能为空')
    expect(validateDashboardDraft(missingRole)).toContain('至少选择一个可见角色')
    expect(validateDashboardDraft(missingUrl)).toContain('第三方看板需要填写链接')
    expect(validateDashboardDraft(invalidUrl)).toContain('第三方看板链接必须以 http:// 或 https:// 开头')
    expect(validateDashboardDraft(missingSlashesUrl)).toContain('第三方看板链接必须以 http:// 或 https:// 开头')
    expect(validateDashboardDraft(validUrl)).toEqual([])
  })
})
