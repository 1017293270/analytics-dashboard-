import { describe, expect, test } from 'vitest'
import { buildTextStyle } from './textRenderer.helpers'

describe('textRenderer helpers', () => {
  test('clamps huge font size', () => {
    expect(buildTextStyle({ fontSize: 400 }).fontSize).toBe('96px')
  })

  test('applies text badge border styling from schema styles', () => {
    expect(buildTextStyle({ borderColor: 'rgba(167, 243, 208, 0.26)' })).toMatchObject({
      borderColor: 'rgba(167, 243, 208, 0.26)',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderRadius: '4px',
    })
  })
})
