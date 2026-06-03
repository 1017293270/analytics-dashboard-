import { readFile } from 'node:fs/promises'
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

beforeAll(async () => {
  prisma = (await import('../src/db.js')).prisma
  const migrationPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'prisma',
    'migrations',
    '20260603062100_init',
    'migration.sql',
  )
  const migration = await readFile(migrationPath, 'utf8')
  for (const statement of migration.split(/;\s*(?:\r?\n|$)/).map((sql) => sql.trim())) {
    if (statement.length > 0) await prisma.$executeRawUnsafe(statement)
  }
})

beforeEach(async () => {
  await prisma.auditLog.deleteMany()
  await prisma.dashboardShareLink.deleteMany()
  await prisma.dashboardPermission.deleteMany()
  await prisma.dashboardVersion.deleteMany()
  await prisma.dashboard.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
