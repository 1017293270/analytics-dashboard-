import type { Prisma, PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

type AuditClient = PrismaClient | Prisma.TransactionClient

export async function recordAudit(
  action: string,
  resourceId: string,
  actorId: string,
  metadata: Record<string, unknown>,
  client: AuditClient = prisma,
) {
  await client.auditLog.create({
    data: { id: nanoid(), action, resourceId, actorId, metadata: JSON.stringify(metadata) },
  })
}
