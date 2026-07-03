import { describe, expect, test } from 'vitest'
import { toCurrentUser } from './session.js'

describe('session current-user conversion', () => {
  test('rejects database roles outside the shared auth contract', () => {
    expect(() => toCurrentUser({
      id: 'user-invalid',
      username: 'invalid',
      displayName: 'Invalid User',
      status: 'active',
      roles: [{ role: { id: 'role-guest', code: 'guest', name: 'Guest' } }],
    })).toThrow()
  })
})
