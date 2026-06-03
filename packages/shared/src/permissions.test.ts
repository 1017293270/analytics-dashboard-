import { describe, expect, test } from 'vitest'
import { canEdit, canPublish } from './permissions.js'

describe('dashboard permission helpers', () => {
  test('canEdit only allows edit and owner permissions', () => {
    expect(canEdit('view')).toBe(false)
    expect(canEdit('edit')).toBe(true)
    expect(canEdit('owner')).toBe(true)
  })

  test('canPublish only allows owner permission', () => {
    expect(canPublish('edit')).toBe(false)
    expect(canPublish('owner')).toBe(true)
  })
})
