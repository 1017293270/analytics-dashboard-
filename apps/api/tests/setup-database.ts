import { beforeAll } from 'vitest'
import { prisma } from '../src/db.js'

beforeAll(async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Dashboard" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "ownerId" TEXT NOT NULL,
      "workspaceId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "draftSchema" TEXT NOT NULL,
      "publishedSchema" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "publishedAt" DATETIME
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DashboardVersion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "dashboardId" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "schema" TEXT NOT NULL,
      "publishNote" TEXT,
      "createdBy" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DashboardVersion_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DashboardPermission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "dashboardId" TEXT NOT NULL,
      "subjectType" TEXT NOT NULL,
      "subjectId" TEXT NOT NULL,
      "permission" TEXT NOT NULL,
      CONSTRAINT "DashboardPermission_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DashboardShareLink" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "dashboardId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "accessScope" TEXT NOT NULL,
      "expiresAt" DATETIME,
      "isEnabled" BOOLEAN NOT NULL DEFAULT true,
      CONSTRAINT "DashboardShareLink_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "actorId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "resourceId" TEXT NOT NULL,
      "metadata" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "DashboardVersion_dashboardId_version_key" ON "DashboardVersion"("dashboardId", "version")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "DashboardPermission_dashboardId_subjectType_subjectId_idx" ON "DashboardPermission"("dashboardId", "subjectType", "subjectId")',
  )
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "DashboardShareLink_token_key" ON "DashboardShareLink"("token")',
  )
})
