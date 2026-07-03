import { describe, expect, test } from 'vitest'
import { prisma } from '../src/db.js'

describe('auth persistence schema', () => {
  test('can create users, roles, user-role assignments, and sessions', async () => {
    const user = await prisma.user.create({
      data: {
        id: 'user-admin',
        username: 'admin',
        displayName: '系统管理员',
        passwordHash: 'hash-value',
        status: 'active',
      },
    })
    const role = await prisma.role.create({
      data: {
        id: 'role-admin',
        code: 'system-admin',
        name: '系统管理员',
        description: '平台管理账号',
      },
    })
    await prisma.userRole.create({
      data: {
        id: 'user-role-admin',
        userId: user.id,
        roleId: role.id,
      },
    })
    await prisma.session.create({
      data: {
        id: 'session-admin',
        tokenHash: 'token-hash',
        userId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })

    const loaded = await prisma.user.findUnique({
      where: { username: 'admin' },
      include: { roles: { include: { role: true } }, sessions: true },
    })

    expect(loaded?.roles[0]?.role.code).toBe('system-admin')
    expect(loaded?.sessions[0]?.tokenHash).toBe('token-hash')
  })
})
