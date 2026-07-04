import { describe, expect, test } from 'vitest'
import {
  createWorkbenchMetadata,
  defaultWorkbenchMetadata,
  getVisibleWorkbenches,
  isWorkbenchAvailable,
  toggleWorkbenchAvailability,
  updateWorkbenchVisibleRoles,
} from './workbenchMetadata'

describe('workbench metadata', () => {
  test('defines the required default role workbenches', () => {
    expect(defaultWorkbenchMetadata.map((workbench) => workbench.name)).toEqual([
      '全员工作台',
      '电教主任工作台',
      '德育主任工作台',
      '教研主任工作台',
    ])
  })

  test('checks availability by role and enabled state', () => {
    const workbench = createWorkbenchMetadata({ id: 'dashboard-electro', name: '电教主任工作台' })

    expect(isWorkbenchAvailable(workbench, ['电教主任'])).toBe(true)
    expect(isWorkbenchAvailable(workbench, ['德育主任'])).toBe(false)
    expect(isWorkbenchAvailable({ ...workbench, availability: '已停用' }, ['电教主任'])).toBe(false)
    expect(isWorkbenchAvailable({ ...workbench, availability: '已停用' }, ['系统管理员'])).toBe(true)
  })

  test('filters role-visible workbenches while letting administrators see all rows', () => {
    const workbenches = [
      createWorkbenchMetadata({ id: 'dashboard-all', name: '全员工作台' }),
      createWorkbenchMetadata({ id: 'dashboard-electro', name: '电教主任工作台' }),
      { ...createWorkbenchMetadata({ id: 'dashboard-moral', name: '德育主任工作台' }), availability: '已停用' as const },
    ]

    expect(getVisibleWorkbenches(workbenches, ['电教主任']).map((workbench) => workbench.name)).toEqual([
      '电教主任工作台',
    ])
    expect(getVisibleWorkbenches(workbenches, ['系统管理员']).map((workbench) => workbench.name)).toEqual([
      '全员工作台',
      '电教主任工作台',
      '德育主任工作台',
    ])
  })

  test('toggles availability and rejects empty visible roles', () => {
    const workbench = createWorkbenchMetadata({ id: 'dashboard-1', name: 'Operations Board' })

    expect(toggleWorkbenchAvailability(workbench).availability).toBe('已停用')
    expect(toggleWorkbenchAvailability({ ...workbench, availability: '已停用' }).availability).toBe('已启用')
    expect(() => updateWorkbenchVisibleRoles(workbench, [])).toThrow('至少选择一个可见角色')
    expect(updateWorkbenchVisibleRoles(workbench, ['全员', '教研主任']).visibleRoles).toEqual(['全员', '教研主任'])
  })
})
