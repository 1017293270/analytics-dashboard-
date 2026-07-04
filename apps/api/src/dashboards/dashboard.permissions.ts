import { canEdit, canPublish, dashboardPermissionValidator, type DashboardPermission } from '@analytics/shared'
import { prisma } from '../db.js'

export type DashboardActor = {
  actorId: string
  roleCodes: string[]
  isSystemAdmin: boolean
}

const permissionStrength: Record<DashboardPermission, number> = {
  view: 1,
  edit: 2,
  owner: 3,
}

export function getDashboardPermissionSubjects(actor: DashboardActor) {
  return [
    { subjectType: 'user', subjectId: actor.actorId },
    ...actor.roleCodes.map((roleCode) => ({ subjectType: 'role', subjectId: roleCode })),
  ]
}

export async function getDashboardPermission(dashboardId: string, actor: DashboardActor) {
  if (actor.isSystemAdmin) return 'owner'

  const permissions = await prisma.dashboardPermission.findMany({
    where: {
      dashboardId,
      OR: getDashboardPermissionSubjects(actor),
    },
  })

  let strongestPermission: DashboardPermission | null = null
  for (const permission of permissions) {
    const parsedPermission = dashboardPermissionValidator.safeParse(permission.permission)
    if (!parsedPermission.success) continue
    if (!strongestPermission || permissionStrength[parsedPermission.data] > permissionStrength[strongestPermission]) {
      strongestPermission = parsedPermission.data
    }
  }

  return strongestPermission
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
