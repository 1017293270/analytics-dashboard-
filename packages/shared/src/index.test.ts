import { describe, expect, test } from 'vitest'
import { sharedVersion } from './index.js'

describe('shared package', () => {
  test('exposes package version', () => {
    expect(sharedVersion).toBe('0.1.0')
  })
})
