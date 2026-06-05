import { dashboardComponentValidator, type ComponentType } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { componentRegistry, createComponent } from './registry'

const componentTypes: ComponentType[] = [
  'metric-card',
  'line-chart',
  'area-chart',
  'bar-chart',
  'pie-chart',
  'radar-chart',
  'funnel-chart',
  'table',
  'text',
  'image',
  'decoration',
]

describe('componentRegistry', () => {
  test('defines every supported big screen component type', () => {
    expect(Object.keys(componentRegistry).sort()).toEqual([...componentTypes].sort())
  })

  test('createComponent returns a valid visible dashboard component with cloned defaults', () => {
    const first = createComponent('metric-card', 120, 160, 4)
    const second = createComponent('metric-card')

    expect(dashboardComponentValidator.safeParse(first).success).toBe(true)
    expect(first.layout).toMatchObject({ x: 120, y: 160, zIndex: 4, visible: true })
    expect(first.props).not.toBe(componentRegistry['metric-card'].defaultProps)
    expect(first.style).not.toBe(componentRegistry['metric-card'].defaultStyle)
    expect(first.id).not.toBe(second.id)
  })
})
