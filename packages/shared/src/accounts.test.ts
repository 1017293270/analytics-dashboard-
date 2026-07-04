import { describe, expect, test } from 'vitest'
import {
  accountRowValidator,
  createAccountInputValidator,
  resetPasswordInputValidator,
  updateAccountInputValidator,
} from './accounts.js'
import * as sharedIndex from './index.js'

describe('account shared contract', () => {
  test('account row validator accepts profile, role, status, and nullable login fields', () => {
    expect(
      accountRowValidator.parse({
        id: 'user-system-admin',
        username: 'admin',
        displayName: '系统管理员',
        phone: '13800000001',
        status: 'active',
        roleCodes: ['system-admin'],
        lastLoginAt: null,
      }),
    ).toMatchObject({
      username: 'admin',
      phone: '13800000001',
      roleCodes: ['system-admin'],
      lastLoginAt: null,
    })

    expect(
      accountRowValidator.parse({
        id: 'user-all-staff',
        username: 'all_staff',
        displayName: '全员演示账号',
        phone: '',
        status: 'disabled',
        roleCodes: ['all-staff'],
        lastLoginAt: '2026-07-04T03:00:00.000Z',
      }).lastLoginAt,
    ).toBe('2026-07-04T03:00:00.000Z')
  })

  test('create input requires username, displayName, password, and at least one role', () => {
    expect(
      createAccountInputValidator.parse({
        username: 'demo_teacher',
        displayName: '演示教师',
        password: 'Demo@123',
        roleCodes: ['all-staff'],
      }),
    ).toMatchObject({
      username: 'demo_teacher',
      displayName: '演示教师',
      roleCodes: ['all-staff'],
    })

    expect(createAccountInputValidator.safeParse({}).success).toBe(false)
    expect(
      createAccountInputValidator.safeParse({
        username: 'demo_teacher',
        displayName: '演示教师',
        password: 'Demo@123',
        roleCodes: [],
      }).success,
    ).toBe(false)
  })

  test('update input permits mutable profile fields and rejects empty roleCodes', () => {
    expect(
      updateAccountInputValidator.parse({
        displayName: '更新后的教师',
        phone: '13800000006',
        status: 'disabled',
        roleCodes: ['all-staff', 'moral-education-director'],
      }),
    ).toEqual({
      displayName: '更新后的教师',
      phone: '13800000006',
      status: 'disabled',
      roleCodes: ['all-staff', 'moral-education-director'],
    })

    expect(updateAccountInputValidator.safeParse({ roleCodes: [] }).success).toBe(false)
  })

  test('reset password input validates non-empty passwords', () => {
    expect(resetPasswordInputValidator.parse({ password: 'NewPass@123' })).toEqual({ password: 'NewPass@123' })
    expect(resetPasswordInputValidator.safeParse({ password: '' }).success).toBe(false)
  })

  test('index exports account validators', () => {
    expect(sharedIndex.accountRowValidator).toBe(accountRowValidator)
    expect(sharedIndex.createAccountInputValidator).toBe(createAccountInputValidator)
    expect(sharedIndex.updateAccountInputValidator).toBe(updateAccountInputValidator)
    expect(sharedIndex.resetPasswordInputValidator).toBe(resetPasswordInputValidator)
  })
})
