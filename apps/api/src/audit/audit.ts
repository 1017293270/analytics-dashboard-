import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

export async function recordAudit(
  action: string,
  resourceId: string,
  actorId: string,
  metadata: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: { id: nanoid(), action, resourceId, actorId, metadata: JSON.stringify(metadata) },
  })
}
