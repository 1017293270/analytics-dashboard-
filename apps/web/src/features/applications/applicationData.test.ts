import { describe, expect, test } from 'vitest'
import {
  applicationSummary,
  applyApplicationFilters,
  createApplicationDraft,
  seedApplications,
  validateApplicationDraft,
  type ApplicationDraft,
  type ApplicationFilters,
} from './applicationData'

describe('applicationData', () => {
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
      category: '管理工具',
      platform: '网页端',
      url: '',
      packageId: '',
      icon: 'notice',
      visibleRoles: ['全员'],
      status: '已启用',
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
})
