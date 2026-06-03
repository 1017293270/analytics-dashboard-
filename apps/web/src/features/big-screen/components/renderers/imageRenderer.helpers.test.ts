import { describe, expect, test } from 'vitest'
import { isAllowedImageSource } from './imageRenderer.helpers'

describe('isAllowedImageSource', () => {
  test('rejects javascript URLs', () => {
    expect(isAllowedImageSource('javascript:alert(1)')).toBe(false)
  })

  test('accepts same-origin paths and HTTPS URLs', () => {
    expect(isAllowedImageSource('/assets/a.png')).toBe(true)
    expect(isAllowedImageSource('https://example.com/a.png')).toBe(true)
  })
})
