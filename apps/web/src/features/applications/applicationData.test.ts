import { describe, expect, test } from 'vitest'
import type { ApplicationRow } from '@analytics/shared'
import {
  applicationDraftToCreateInput,
  applicationDraftToUpdateInput,
  applicationSummary,
  applyApplicationFilters,
  createApplicationDraft,
  mapApplicationRow,
  seedApplications,
  validateApplicationDraft,
  type ApplicationDraft,
  type ApplicationFilters,
} from './applicationData'

describe('applicationData', () => {
  const apiRow: ApplicationRow = {
    id: 'app-notice',
    name: '校园通知发布系统',
    categoryId: 'management-tools',
    categoryName: '管理工具',
    platform: 'web',
    url: 'https://demo.school.local/notice',
    packageId: '',
    icon: 'notice',
    visibleRoleCodes: ['all-staff', 'moral-education-director'],
    status: 'enabled',
    sortOrder: 1,
    createdAt: '2026-07-04T08:00:00.000Z',
    updatedAt: '2026-07-04T08:00:00.000Z',
  }

  test('summarizes platform and enabled counts from seed records', () => {
    expect(applicationSummary(seedApplications)).toEqual({
      total: 8,
      web: 5,
      mobile: 3,
      enabled: 6,
    })
  })

  test('filters applications by keyword, category, platform, status, and role visibility', () => {
    const filters: ApplicationFilters = {
      keyword: '巡检',
      category: '管理工具',
      platform: '移动端',
      status: '已启用',
      visibleRole: '电教主任',
    }

    expect(applyApplicationFilters(seedApplications, filters).map((app) => app.name)).toEqual(['移动巡检'])
  })

  test('returns every application when filters are empty', () => {
    expect(
      applyApplicationFilters(seedApplications, {
        keyword: '',
        category: '全部',
        platform: '全部',
        status: '全部',
        visibleRole: '全部',
      }),
    ).toHaveLength(seedApplications.length)
  })

  test('returns default draft values for adding an application', () => {
    expect(createApplicationDraft()).toMatchObject({
      name: '',
      categoryId: 'management-tools',
      category: '管理工具',
      platform: '网页端',
      url: '',
      packageId: '',
      icon: 'notice',
      visibleRoles: ['全员'],
      status: '已启用',
    })
  })

  test('maps API rows to Chinese UI labels while preserving persistence identifiers', () => {
    expect(mapApplicationRow(apiRow)).toMatchObject({
      id: 'app-notice',
      categoryId: 'management-tools',
      category: '管理工具',
      platform: '网页端',
      status: '已启用',
      visibleRoleCodes: ['all-staff', 'moral-education-director'],
      visibleRoles: ['全员', '德育主任'],
    })
  })

  test('converts Chinese form drafts to API create and update payloads', () => {
    const draft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '访客预约系统',
      categoryId: 'data-dashboard',
      category: '数据看板',
      platform: '网页端',
      url: 'https://demo.school.local/visitor',
      visibleRoles: ['全员', '电教主任'],
      status: '已启用',
    }

    expect(applicationDraftToCreateInput(draft)).toEqual({
      name: '访客预约系统',
      categoryId: 'data-dashboard',
      platform: 'web',
      url: 'https://demo.school.local/visitor',
      packageId: '',
      icon: 'notice',
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
      status: 'enabled',
    })
    expect(applicationDraftToUpdateInput({ ...draft, status: '已停用' })).toEqual({
      name: '访客预约系统',
      categoryId: 'data-dashboard',
      platform: 'web',
      url: 'https://demo.school.local/visitor',
      packageId: '',
      icon: 'notice',
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
      status: 'disabled',
    })
  })

  test('requires url for web apps and package id for mobile apps', () => {
    const webDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '测试应用',
      platform: '网页端',
      url: '',
    }
    const mobileDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '移动应用',
      platform: '移动端',
      packageId: '',
    }

    expect(validateApplicationDraft(webDraft)).toContain('网页端应用需要填写访问地址')
    expect(validateApplicationDraft(mobileDraft)).toContain('移动端应用需要填写包标识')
  })

  test('only accepts http and https URLs for web applications', () => {
    const javascriptDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '危险链接',
      platform: '网页端',
      url: 'javascript:alert(1)',
    }
    const malformedDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '错误链接',
      platform: '网页端',
      url: 'demo.school.local/app',
    }
    const secureDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '安全链接',
      platform: '网页端',
      url: 'https://demo.school.local/app',
    }

    expect(validateApplicationDraft(javascriptDraft)).toContain('网页端应用访问地址必须以 http:// 或 https:// 开头')
    expect(validateApplicationDraft(malformedDraft)).toContain('网页端应用访问地址必须以 http:// 或 https:// 开头')
    expect(validateApplicationDraft(secureDraft)).not.toContain('网页端应用访问地址必须以 http:// 或 https:// 开头')
  })
})
