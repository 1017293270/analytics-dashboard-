import { describe, expect, test } from 'vitest'
import { getMockData } from '../src/data/mock-data.js'
import { createEducationWorkbenchSchema } from '../src/dashboards/dashboard.repository.js'

describe('education mock data', () => {
  test('returns education metric data for role workbench KPI cards', () => {
    expect(getMockData({ metrics: ['school_device_online_rate'] })).toEqual({
      kind: 'metric',
      value: 98.6,
      label: '设备在线率',
      trend: 1.2,
    })
  })

  test('returns education category rows for device status charts', () => {
    expect(getMockData({ dimensions: ['category'], metrics: ['device_type_status'] })).toEqual({
      kind: 'category',
      rows: [
        { category: '智慧黑板', value: 286 },
        { category: '交互平板', value: 218 },
        { category: '录播主机', value: 42 },
        { category: '班牌终端', value: 96 },
      ],
    })
  })

  test('returns education table rows with requested limit', () => {
    expect(getMockData({ dimensions: ['table'], metrics: ['device_repair_orders'], limit: 2 })).toEqual({
      kind: 'table',
      columns: ['设备', '位置', '状态', '责任人'],
      rows: [
        { 设备: 'HB-3F-021', 位置: '教学楼 3 楼 302 教室', 状态: '处理中', 责任人: '王工' },
        { 设备: 'PAD-2F-118', 位置: '教学楼 2 楼 218 教室', 状态: '待上门', 责任人: '李工' },
      ],
    })
  })

  test('keeps the legacy teacher research task key on education data', () => {
    expect(getMockData({ metrics: ['teacher_research_tasks'] })).toEqual({
      kind: 'metric',
      value: 24,
      label: '教研任务',
      trend: 9.1,
    })
    expect(getMockData({ dimensions: ['table'], metrics: ['teacher_research_tasks'], limit: 1 })).toEqual({
      kind: 'table',
      columns: ['教研组', '任务', '进度', '负责人'],
      rows: [{ 教研组: '语文组', 任务: '智慧课堂同课异构', 进度: '进行中', 负责人: '周老师' }],
    })
  })

  test('serves data for every default education workbench binding', () => {
    for (const id of ['dashboard-all', 'dashboard-electro', 'dashboard-moral', 'dashboard-research']) {
      const schema = createEducationWorkbenchSchema(id)

      for (const binding of Object.values(schema.dataBindings)) {
        const result = getMockData(binding.query)
        if (binding.query.dimensions?.includes('category')) {
          expect(result.kind).toBe('category')
          if (result.kind === 'category') expect(result.rows.map((row) => row.category)).not.toContain('SQL')
        } else if (binding.query.dimensions?.includes('date')) {
          expect(result.kind).toBe('time-series')
          if (result.kind === 'time-series') expect(result.rows[0].date).toMatch(/^07-/)
        } else if (binding.query.dimensions?.includes('table')) {
          expect(result.kind).toBe('table')
          if (result.kind === 'table') expect(result.columns).not.toEqual(['name', 'count', 'owner'])
        } else {
          expect(result.kind).toBe('metric')
          if (result.kind === 'metric') expect(result.label).not.toBe('Total Q&A Requests')
        }
      }
    }
  })
})
