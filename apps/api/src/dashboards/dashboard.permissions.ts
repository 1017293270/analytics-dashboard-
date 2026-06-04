import { canEdit, canPublish, dashboardPermissionValidator, type DashboardPermission } from '@analytics/shared'
import { prisma } from '../db.js'
import { DEFAULT_ACTOR_ID } from './dashboard.repository.js'

export async function getDashboardPermission(dashboardId: string, actorId = DEFAULT_ACTOR_ID) {
  const permission = await prisma.dashboardPermission.findFirst({
    where: { dashboardId, subjectType: 'user', subjectId: actorId },
  })

  if (!permission) return null
  const parsedPermission = dashboardPermissionValidator.safeParse(permission.permission)
  return parsedPermission.success ? parsedPermission.data : null
}

export function hasViewPermission(permission: DashboardPermission | null): boolean {
  return permission !== null
}

export function hasEditPermission(permission: DashboardPermission | null): boolean {
  return permission !== null && canEdit(permission)
}

export function hasPublishPermission(permission: DashboardPermission | null): boolean {
  return permission !== null && canPublish(permission)
}
