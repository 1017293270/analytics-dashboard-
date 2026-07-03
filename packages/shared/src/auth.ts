import { z } from 'zod'

export const roleCodeValidator = z.enum([
  'system-admin',
  'all-staff',
  'electro-education-director',
  'moral-education-director',
  'teaching-research-director',
])

export type RoleCode = z.infer<typeof roleCodeValidator>

export const userStatusValidator = z.enum(['active', 'disabled'])
export type UserStatus = z.infer<typeof userStatusValidator>

export const currentUserRoleValidator = z.object({
  id: z.string().min(1),
  code: roleCodeValidator,
  name: z.string().min(1),
})

export type CurrentUserRole = z.infer<typeof currentUserRoleValidator>

export const currentUserValidator = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  status: userStatusValidator,
  roles: z.array(currentUserRoleValidator),
})

export type CurrentUser = z.infer<typeof currentUserValidator>

export function hasRole(user: CurrentUser | null, roleCode: RoleCode): boolean {
  return Boolean(user?.roles.some((role) => role.code === roleCode))
}

export function isSystemAdmin(user: CurrentUser | null): boolean {
  return hasRole(user, 'system-admin')
}
