import { describe, expect, test } from 'vitest'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'
import { hashPassword } from '../src/auth/password.js'
import { prisma } from '../src/db.js'

describe('auth seed', () => {
  test('seeds demo account phone fields in demo order', async () => {
    await ensureDemoAuthSeed()

    const rows = await prisma.$queryRaw<Array<{ username: string; phone: string | null }>>`
      SELECT "username", "phone"
      FROM "User"
      ORDER BY CASE "username"
        WHEN 'admin' THEN 1
        WHEN 'all_staff' THEN 2
        WHEN 'electro_director' THEN 3
        WHEN 'moral_director' THEN 4
        WHEN 'research_director' THEN 5
        ELSE 99
      END
    `

    expect(rows).toEqual([
      { username: 'admin', phone: '13800000001' },
      { username: 'all_staff', phone: '13800000002' },
      { username: 'electro_director', phone: '13800000003' },
      { username: 'moral_director', phone: '13800000004' },
      { username: 'research_director', phone: '13800000005' },
    ])
  })

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
