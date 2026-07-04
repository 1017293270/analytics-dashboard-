import { describe, expect, test } from 'vitest'
import {
  applicationCategoryRowValidator,
  applicationListQueryValidator,
  applicationRowValidator,
  createApplicationInputValidator,
  updateApplicationInputValidator,
} from './applications.js'
import * as sharedIndex from './index.js'

describe('application shared contract', () => {
  test('application row validator accepts persisted management rows', () => {
    expect(
      applicationRowValidator.parse({
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
        createdAt: '2026-07-04T05:30:00.000Z',
        updatedAt: '2026-07-04T05:30:00.000Z',
      }),
    ).toMatchObject({
      id: 'app-governance',
      platform: 'web',
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
      status: 'enabled',
    })
  })

  test('application input validators enforce platform-specific launch targets', () => {
    expect(
      createApplicationInputValidator.parse({
        name: '移动巡检',
        categoryId: 'management-tools',
        platform: 'mobile',
        packageId: 'com.school.inspection',
        icon: 'shield',
        visibleRoleCodes: ['electro-education-director'],
        status: 'enabled',
      }),
    ).toMatchObject({
      platform: 'mobile',
      url: '',
      packageId: 'com.school.inspection',
    })

    expect(
      createApplicationInputValidator.safeParse({
        name: '缺少地址的网页应用',
        categoryId: 'management-tools',
        platform: 'web',
        visibleRoleCodes: ['all-staff'],
        status: 'enabled',
      }).success,
    ).toBe(false)
    expect(
      createApplicationInputValidator.safeParse({
        name: '缺少包名的移动应用',
        categoryId: 'mobile-service',
        platform: 'mobile',
        visibleRoleCodes: ['all-staff'],
        status: 'enabled',
      }).success,
    ).toBe(false)
  })

  test('application update and list query validators accept management filters', () => {
    expect(
      updateApplicationInputValidator.parse({
        name: '智慧黑板工具',
        status: 'disabled',
        visibleRoleCodes: ['all-staff', 'teaching-research-director'],
      }),
    ).toEqual({
      name: '智慧黑板工具',
      status: 'disabled',
      visibleRoleCodes: ['all-staff', 'teaching-research-director'],
    })

    expect(
      applicationListQueryValidator.parse({
        keyword: '治理',
        categoryId: 'data-dashboard',
        platform: 'web',
        status: 'enabled',
        visibleRoleCode: 'electro-education-director',
      }),
    ).toMatchObject({ keyword: '治理', platform: 'web' })
  })

  test('application category rows and index exports are available', () => {
    expect(applicationCategoryRowValidator.parse({ id: 'management-tools', name: '管理工具', sortOrder: 1 })).toEqual({
      id: 'management-tools',
      name: '管理工具',
      sortOrder: 1,
    })
    expect(sharedIndex.applicationRowValidator).toBe(applicationRowValidator)
    expect(sharedIndex.createApplicationInputValidator).toBe(createApplicationInputValidator)
    expect(sharedIndex.updateApplicationInputValidator).toBe(updateApplicationInputValidator)
  })
})
