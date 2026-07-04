import { prisma } from '../db.js'
import type { PrismaClient } from '@prisma/client'
import { hashPassword } from './password.js'

type RoleCode =
  | 'system-admin'
  | 'all-staff'
  | 'electro-education-director'
  | 'moral-education-director'
  | 'teaching-research-director'

type DemoRole = {
  id: string
  code: RoleCode
  name: string
  description: string
}

type DemoUser = {
  id: string
  username: string
  displayName: string
  phone: string
  password: string
  roleCodes: RoleCode[]
}

type DemoSeedClient = Pick<PrismaClient, 'role' | 'session' | 'user' | 'userRole'>

export const demoRoles: DemoRole[] = [
  { id: 'role-system-admin', code: 'system-admin', name: '系统管理员', description: '平台配置与演示管理账号' },
  { id: 'role-all-staff', code: 'all-staff', name: '全员', description: '全校教职工默认角色' },
  {
    id: 'role-electro-education-director',
    code: 'electro-education-director',
    name: '电教主任',
    description: '负责电教设备、应用与运维告警',
  },
  {
    id: 'role-moral-education-director',
    code: 'moral-education-director',
    name: '德育主任',
    description: '负责德育与学生成长相关看板',
  },
  {
    id: 'role-teaching-research-director',
    code: 'teaching-research-director',
    name: '教研主任',
    description: '负责教研与教师发展相关看板',
  },
]

export const demoUsers: DemoUser[] = [
  {
    id: 'user-system-admin',
    username: 'admin',
    displayName: '系统管理员',
    phone: '13800000001',
    password: 'Admin@123',
    roleCodes: ['system-admin'],
  },
  {
    id: 'user-all-staff',
    username: 'all_staff',
    displayName: '全员演示账号',
    phone: '13800000002',
    password: 'Demo@123',
    roleCodes: ['all-staff'],
  },
  {
    id: 'user-electro-director',
    username: 'electro_director',
    displayName: '电教主任',
    phone: '13800000003',
    password: 'Demo@123',
    roleCodes: ['electro-education-director'],
  },
  {
    id: 'user-moral-director',
    username: 'moral_director',
    displayName: '德育主任',
    phone: '13800000004',
    password: 'Demo@123',
    roleCodes: ['moral-education-director'],
  },
  {
    id: 'user-research-director',
    username: 'research_director',
    displayName: '教研主任',
    phone: '13800000005',
    password: 'Demo@123',
    roleCodes: ['teaching-research-director'],
  },
]

async function upsertDemoRoles(client: DemoSeedClient) {
  for (const role of demoRoles) {
    await client.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    })
  }
}

async function bindDemoUserRoles(client: DemoSeedClient, userId: string, roleCodes: RoleCode[]) {
  await client.userRole.deleteMany({ where: { userId } })
  for (const roleCode of roleCodes) {
    const role = await client.role.findUniqueOrThrow({ where: { code: roleCode } })
    await client.userRole.create({
      data: {
        id: `user-role-${userId}-${role.id}`,
        userId,
        roleId: role.id,
      },
    })
  }
}

export async function ensureDemoAuthSeed() {
  await upsertDemoRoles(prisma)

  for (const user of demoUsers) {
    const seededUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        phone: user.phone,
      },
      create: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        phone: user.phone,
        passwordHash: hashPassword(user.password),
        status: 'active',
      },
    })

    for (const roleCode of user.roleCodes) {
      const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } })
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: seededUser.id, roleId: role.id } },
        update: {},
        create: {
          id: `user-role-${seededUser.id}-${role.id}`,
          userId: seededUser.id,
          roleId: role.id,
        },
      })
    }
  }
}

export async function resetDemoAuthSeed() {
  const demoUsernames = demoUsers.map((user) => user.username)

  await prisma.$transaction(async (tx) => {
    await upsertDemoRoles(tx)

    const removableUsers = await tx.user.findMany({
      where: { username: { notIn: demoUsernames } },
      select: { id: true },
    })
    const removableUserIds = removableUsers.map((user) => user.id)

    if (removableUserIds.length > 0) {
      await tx.session.deleteMany({ where: { userId: { in: removableUserIds } } })
      await tx.userRole.deleteMany({ where: { userId: { in: removableUserIds } } })
      await tx.user.deleteMany({ where: { id: { in: removableUserIds } } })
    }

    for (const user of demoUsers) {
      const seededUser = await tx.user.upsert({
        where: { username: user.username },
        update: {
          displayName: user.displayName,
          phone: user.phone,
          passwordHash: hashPassword(user.password),
          status: 'active',
          lastLoginAt: null,
        },
        create: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          phone: user.phone,
          passwordHash: hashPassword(user.password),
          status: 'active',
          lastLoginAt: null,
        },
      })

      await bindDemoUserRoles(tx, seededUser.id, user.roleCodes)
    }
  })
}
