import { describe, expect, test } from 'vitest'
import {
  currentUserValidator,
  hasRole,
  isSystemAdmin,
  roleCodeValidator,
  userStatusValidator,
  type CurrentUser,
} from './auth.js'

describe('auth shared contract', () => {
  test('validates supported smart education role codes', () => {
    expect(roleCodeValidator.parse('system-admin')).toBe('system-admin')
    expect(roleCodeValidator.parse('all-staff')).toBe('all-staff')
    expect(roleCodeValidator.parse('electro-education-director')).toBe('electro-education-director')
    expect(roleCodeValidator.parse('moral-education-director')).toBe('moral-education-director')
    expect(roleCodeValidator.parse('teaching-research-director')).toBe('teaching-research-director')
    expect(() => roleCodeValidator.parse('guest')).toThrow()
  })

  test('validates active and disabled user statuses', () => {
    expect(userStatusValidator.parse('active')).toBe('active')
    expect(userStatusValidator.parse('disabled')).toBe('disabled')
    expect(() => userStatusValidator.parse('locked')).toThrow()
  })

  test('validates the current user response shape', () => {
    const parsed = currentUserValidator.parse({
      id: 'user-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-admin', code: 'system-admin', name: '系统管理员' }],
    })

    expect(parsed.roles[0]?.code).toBe('system-admin')
  })

  test('checks role membership helpers', () => {
    const user: CurrentUser = {
      id: 'user-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-admin', code: 'system-admin', name: '系统管理员' }],
    }

    expect(hasRole(user, 'system-admin')).toBe(true)
    expect(hasRole(user, 'all-staff')).toBe(false)
    expect(isSystemAdmin(user)).toBe(true)
  })
})
