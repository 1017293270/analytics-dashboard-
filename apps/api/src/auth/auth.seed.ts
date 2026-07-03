import { prisma } from '../db.js'
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
  password: string
  roleCodes: RoleCode[]
}

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
    password: 'Admin@123',
    roleCodes: ['system-admin'],
  },
  {
    id: 'user-all-staff',
    username: 'all_staff',
    displayName: '全员演示账号',
    password: 'Demo@123',
    roleCodes: ['all-staff'],
  },
  {
    id: 'user-electro-director',
    username: 'electro_director',
    displayName: '电教主任',
    password: 'Demo@123',
    roleCodes: ['electro-education-director'],
  },
  {
    id: 'user-moral-director',
    username: 'moral_director',
    displayName: '德育主任',
    password: 'Demo@123',
    roleCodes: ['moral-education-director'],
  },
  {
    id: 'user-research-director',
    username: 'research_director',
    displayName: '教研主任',
    password: 'Demo@123',
    roleCodes: ['teaching-research-director'],
  },
]

export async function ensureDemoAuthSeed() {
  for (const role of demoRoles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    })
  }

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        status: 'active',
      },
      create: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        passwordHash: hashPassword(user.password),
        status: 'active',
      },
    })

    for (const roleCode of user.roleCodes) {
      const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } })
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: {
          id: `user-role-${user.id}-${role.id}`,
          userId: user.id,
          roleId: role.id,
        },
      })
    }
  }
}
