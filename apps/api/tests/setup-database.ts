import { readFile, readdir } from 'node:fs/promises'
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import type { prisma as prismaClient } from '../src/db.js'

const testDbPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'test.db')
process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, '/')}`
rmSync(testDbPath, { force: true })
rmSync(`${testDbPath}-journal`, { force: true })

let prisma: typeof prismaClient

async function applyMigrationFile(migrationPath: string) {
  const migration = await readFile(migrationPath, 'utf8')
  for (const statement of migration.split(/;\s*(?:\r?\n|$)/).map((sql) => sql.trim())) {
    if (statement.length > 0) await prisma.$executeRawUnsafe(statement)
  }
}

beforeAll(async () => {
  prisma = (await import('../src/db.js')).prisma
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'migrations')
  const migrationDirs = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const migrationDir of migrationDirs) {
    await applyMigrationFile(join(migrationsDir, migrationDir, 'migration.sql'))
  }
})

beforeEach(async () => {
  await prisma.alarm.deleteMany()
  await prisma.dataDashboard.deleteMany()
  await prisma.managedApplication.deleteMany()
  await prisma.applicationCategory.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.dashboardShareLink.deleteMany()
  await prisma.dashboardPermission.deleteMany()
  await prisma.dashboardVersion.deleteMany()
  await prisma.dashboard.deleteMany()
  await prisma.session.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
