import { describe, expect, test } from 'vitest'
import { colorToCssValue, hexToRgb, hsvToRgb, parseColorValue, rgbToHex, rgbToHsv } from './colorUtils'

describe('colorUtils', () => {
  test('parses hex colors and normalizes shorthand', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColorValue('#0ea5e9')).toMatchObject({
      rgb: { r: 14, g: 165, b: 233 },
      alpha: 1,
      hex: '#0EA5E9',
      cssValue: '#0EA5E9',
      isParsed: true,
    })
  })

  test('parses rgb, rgba, and transparent values', () => {
    expect(parseColorValue('rgb(12, 34, 56)')).toMatchObject({
      rgb: { r: 12, g: 34, b: 56 },
      alpha: 1,
      hex: '#0C2238',
      cssValue: '#0C2238',
    })
    expect(parseColorValue('rgba(12, 34, 56, 0.4)')).toMatchObject({
      rgb: { r: 12, g: 34, b: 56 },
      alpha: 0.4,
      hex: '#0C2238',
      cssValue: 'rgba(12, 34, 56, 0.4)',
    })
    expect(parseColorValue('transparent')).toMatchObject({
      alpha: 0,
      cssValue: 'transparent',
      isTransparent: true,
    })
  })

  test('keeps unsupported css strings while using fallback controls', () => {
    expect(parseColorValue('var(--brand)', '#112233')).toMatchObject({
      rgb: { r: 17, g: 34, b: 51 },
      alpha: 1,
      hex: '#112233',
      cssValue: 'var(--brand)',
      isParsed: false,
    })
  })

  test('formats colors from channels and converts hsv round trip', () => {
    expect(rgbToHex({ r: 14, g: 165, b: 233 })).toBe('#0EA5E9')
    expect(colorToCssValue({ r: 12, g: 34, b: 56 }, 0.25)).toBe('rgba(12, 34, 56, 0.25)')

    const hsv = rgbToHsv({ r: 14, g: 165, b: 233 })
    const roundTrip = hsvToRgb(hsv)
    expect(Math.abs(roundTrip.r - 14)).toBeLessThanOrEqual(3)
    expect(Math.abs(roundTrip.g - 165)).toBeLessThanOrEqual(3)
    expect(Math.abs(roundTrip.b - 233)).toBeLessThanOrEqual(3)
  })
})
