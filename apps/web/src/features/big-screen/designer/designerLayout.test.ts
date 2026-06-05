import type { DashboardComponent } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { bigScreenText } from '../i18n/zh-CN'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { clampLayout, clampZoom, createDesignerComponent, parseBoundedNumber } from './designerLayout'

const canvas = createDefaultDashboardSchema().canvas

describe('designerLayout', () => {
  test('clamps component layout inside the dashboard canvas', () => {
    const layout: DashboardComponent['layout'] = {
      x: -100,
      y: 2000,
      width: 4000,
      height: 10,
      zIndex: 12000,
    }

    expect(clampLayout(layout, canvas)).toMatchObject({
      x: 0,
      y: 1056,
      width: 1920,
      height: 24,
      zIndex: 10000,
      visible: true,
    })
  })

  test('creates a component at the next stable designer position', () => {
    const schema = createDefaultDashboardSchema()
    schema.components = [createDesignerComponent('metric-card', schema)]

    const component = createDesignerComponent('text', schema)

    expect(component.type).toBe('text')
    expect(component.name).toBe(bigScreenText.components.names.text)
    expect(component.layout).toMatchObject({ x: 100, y: 100, zIndex: 2, visible: true })
  })

  test('normalizes bounded numeric input and zoom values', () => {
    expect(parseBoundedNumber('41.8', 0, { min: 0, max: 50 })).toBe(42)
    expect(parseBoundedNumber('bad', 12, { min: 0, max: 50 })).toBe(12)
    expect(parseBoundedNumber('', 12, { min: 0, max: 50 })).toBe(12)
    expect(parseBoundedNumber('   ', 12, { min: 0, max: 50 })).toBe(12)
    expect(clampZoom(9)).toBe(2)
    expect(clampZoom(0.05)).toBe(0.25)
  })
})
