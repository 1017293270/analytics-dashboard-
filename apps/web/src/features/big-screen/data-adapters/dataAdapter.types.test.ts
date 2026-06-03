import { describe, expect, test } from 'vitest'
import { isComponentData } from './dataAdapter.types'

describe('isComponentData', () => {
  test('accepts valid component data shapes', () => {
    expect(isComponentData({ kind: 'metric', value: 42, label: 'Requests', trend: 3.5 })).toBe(true)
    expect(isComponentData({ kind: 'time-series', rows: [{ date: '2026-06-03', count: 12 }] })).toBe(true)
    expect(isComponentData({ kind: 'category', rows: [{ category: 'SQL', value: 8 }] })).toBe(true)
    expect(isComponentData({ kind: 'table', columns: ['name', 'count'], rows: [{ name: 'Open', count: 2 }] })).toBe(true)
  })

  test('rejects malformed metric data missing trend', () => {
    expect(isComponentData({ kind: 'metric', value: 42, label: 'Requests' })).toBe(false)
  })
})
