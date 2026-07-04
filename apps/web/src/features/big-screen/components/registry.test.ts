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
  'web-embed',
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

  test('creates a valid third-party web embed component', () => {
    const component = createComponent('web-embed', 40, 60, 2)

    expect(dashboardComponentValidator.safeParse(component).success).toBe(true)
    expect(component).toMatchObject({
      type: 'web-embed',
      name: '第三方网页',
      layout: { x: 40, y: 60, zIndex: 2, visible: true },
      props: {
        title: '第三方数据看板',
        url: 'https://demo.school.local/alarm-bi',
      },
    })
  })
})
