import { describe, expect, test } from 'vitest'
import { buildTextStyle } from './textRenderer.helpers'

describe('textRenderer helpers', () => {
  test('clamps huge font size', () => {
    expect(buildTextStyle({ fontSize: 400 }).fontSize).toBe('96px')
  })
})
