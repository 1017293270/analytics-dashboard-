import { describe, expect, test } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('password helpers', () => {
  test('hashes and verifies a password', () => {
    const hash = hashPassword('Admin@123')

    expect(hash).toMatch(/^scrypt\$/)
    expect(verifyPassword('Admin@123', hash)).toBe(true)
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })

  test('rejects malformed hashes', () => {
    expect(verifyPassword('Admin@123', 'not-a-valid-hash')).toBe(false)
    expect(verifyPassword('Admin@123', 'scrypt$bad$8$1$salt$hash')).toBe(false)
  })
})
