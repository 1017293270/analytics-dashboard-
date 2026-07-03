import { describe, expect, test } from 'vitest'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'
import { hashPassword } from '../src/auth/password.js'
import { prisma } from '../src/db.js'

describe('auth seed', () => {
  test('assigns roles to an existing demo username without assuming the seed user id', async () => {
    await prisma.user.create({
      data: {
        id: 'existing-all-staff',
        username: 'all_staff',
        displayName: 'Existing All Staff',
        passwordHash: hashPassword('Demo@123'),
        status: 'active',
      },
    })

    await expect(ensureDemoAuthSeed()).resolves.toBeUndefined()

    const user = await prisma.user.findUnique({
      where: { username: 'all_staff' },
      include: { roles: { include: { role: true } } },
    })

    expect(user?.id).toBe('existing-all-staff')
    expect(user?.roles.map(({ role }) => role.code)).toContain('all-staff')
  })
})
