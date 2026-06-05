import { describe, expect, test } from 'vitest'
import { buildBackdropBlurStyle, normalizeBackgroundBlur } from './rendererStyle.helpers'

describe('rendererStyle helpers', () => {
  test('normalizes background blur values', () => {
    expect(normalizeBackgroundBlur(-10)).toBe(0)
    expect(normalizeBackgroundBlur(12.4)).toBe(12)
    expect(normalizeBackgroundBlur(240)).toBe(100)
    expect(normalizeBackgroundBlur('20')).toBe(0)
  })

  test('builds backdrop blur styles only when blur is positive', () => {
    expect(buildBackdropBlurStyle({ backgroundBlur: 0 })).toEqual({})
    expect(buildBackdropBlurStyle({ backgroundBlur: 12 })).toEqual({
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    })
  })
})
