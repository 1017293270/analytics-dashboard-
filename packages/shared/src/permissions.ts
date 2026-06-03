import { z } from 'zod'

export const dashboardPermissionValidator = z.enum(['view', 'edit', 'owner'])
export type DashboardPermission = z.infer<typeof dashboardPermissionValidator>

export function canEdit(permission: DashboardPermission): boolean {
  return permission === 'edit' || permission === 'owner'
}

export function canPublish(permission: DashboardPermission): boolean {
  return permission === 'owner'
}
