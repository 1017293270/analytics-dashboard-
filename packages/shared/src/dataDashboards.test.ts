import { describe, expect, test } from 'vitest'
import {
  createDataDashboardInputValidator,
  dataDashboardListQueryValidator,
  dataDashboardRowValidator,
  updateDataDashboardInputValidator,
} from './dataDashboards.js'
import * as sharedIndex from './index.js'

describe('data dashboard shared contract', () => {
  test('data dashboard row validator accepts builtin and embedded dashboards', () => {
    expect(
      dataDashboardRowValidator.parse({
        id: 'dashboard-app-usage',
        name: '应用使用',
        type: '应用使用',
        source: 'embedded',
        embedUrl: 'https://demo.school.local/app-usage',
        isDefault: false,
        visibleRoleCodes: ['all-staff', 'electro-education-director'],
        status: 'enabled',
        metrics: [
          { label: '启用应用', value: '6', trend: '网页端 5' },
          { label: '今日访问', value: '2,418', trend: '高峰 10:00' },
        ],
        createdAt: '2026-07-04T05:30:00.000Z',
        updatedAt: '2026-07-04T05:30:00.000Z',
      }),
    ).toMatchObject({
      id: 'dashboard-app-usage',
      source: 'embedded',
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
    })
  })

  test('data dashboard input validators require embedUrl for embedded dashboards', () => {
    expect(
      createDataDashboardInputValidator.parse({
        name: '告警态势',
        type: '告警态势',
        source: 'embedded',
        embedUrl: 'https://demo.school.local/alarm-bi',
        visibleRoleCodes: ['electro-education-director'],
        status: 'disabled',
      }),
    ).toMatchObject({ source: 'embedded', embedUrl: 'https://demo.school.local/alarm-bi' })

    expect(
      createDataDashboardInputValidator.safeParse({
        name: '缺少地址的嵌入看板',
        type: '告警态势',
        source: 'embedded',
        visibleRoleCodes: ['electro-education-director'],
        status: 'enabled',
      }).success,
    ).toBe(false)
  })

  test('data dashboard update and list query validators accept role-aware filters', () => {
    expect(
      updateDataDashboardInputValidator.parse({
        status: 'disabled',
        isDefault: true,
        metrics: [{ label: '治理事项', value: '128', trend: '本周 +12' }],
      }),
    ).toEqual({
      status: 'disabled',
      isDefault: true,
      metrics: [{ label: '治理事项', value: '128', trend: '本周 +12' }],
    })

    expect(
      dataDashboardListQueryValidator.parse({
        keyword: '设备',
        type: '设备运维',
        source: 'builtin',
        status: 'enabled',
        roleCode: 'electro-education-director',
      }),
    ).toMatchObject({ keyword: '设备', source: 'builtin' })
  })

  test('index exports data dashboard validators', () => {
    expect(sharedIndex.dataDashboardRowValidator).toBe(dataDashboardRowValidator)
    expect(sharedIndex.createDataDashboardInputValidator).toBe(createDataDashboardInputValidator)
    expect(sharedIndex.updateDataDashboardInputValidator).toBe(updateDataDashboardInputValidator)
  })
})
