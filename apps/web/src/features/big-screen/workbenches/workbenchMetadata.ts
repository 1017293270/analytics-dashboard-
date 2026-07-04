export type WorkbenchAvailability = '已启用' | '已停用'
export type WorkbenchAvailabilityCode = 'enabled' | 'disabled'

export type WorkbenchMetadata = {
  id: string
  name: string
  visibleRoles: string[]
  visibleRoleCodes: string[]
  availability: WorkbenchAvailability
  availabilityCode: WorkbenchAvailabilityCode
}

export type WorkbenchMetadataInput = {
  id: string
  name: string
  visibleRoles?: string[]
  availability?: WorkbenchAvailability | WorkbenchAvailabilityCode
}

const administratorRole = '系统管理员'

const roleNameByCode: Record<string, string> = {
  'system-admin': '系统管理员',
  'all-staff': '全员',
  'electro-education-director': '电教主任',
  'moral-education-director': '德育主任',
  'teaching-research-director': '教研主任',
}

const roleCodeByName = Object.fromEntries(Object.entries(roleNameByCode).map(([code, name]) => [name, code]))

const defaultRoleCodeByWorkbenchName: Record<string, string> = {
  全员工作台: 'all-staff',
  电教主任工作台: 'electro-education-director',
  德育主任工作台: 'moral-education-director',
  教研主任工作台: 'teaching-research-director',
}

export function getRoleName(roleCode: string) {
  return roleNameByCode[roleCode] ?? roleCode
}

export function getRoleCode(roleNameOrCode: string) {
  return roleCodeByName[roleNameOrCode] ?? roleNameOrCode
}

export function getAvailabilityLabel(availability?: WorkbenchAvailability | WorkbenchAvailabilityCode) {
  return availability === 'disabled' || availability === '已停用' ? '已停用' : '已启用'
}

export function getAvailabilityCode(availability?: WorkbenchAvailability | WorkbenchAvailabilityCode): WorkbenchAvailabilityCode {
  return availability === 'disabled' || availability === '已停用' ? 'disabled' : 'enabled'
}

export function createWorkbenchMetadata(input: WorkbenchMetadataInput): WorkbenchMetadata {
  const visibleRoleValues = input.visibleRoles ?? [defaultRoleCodeByWorkbenchName[input.name] ?? 'all-staff']
  const availability = getAvailabilityLabel(input.availability)

  return {
    id: input.id,
    name: input.name,
    visibleRoles: visibleRoleValues.map(getRoleName),
    visibleRoleCodes: visibleRoleValues.map(getRoleCode),
    availability,
    availabilityCode: getAvailabilityCode(availability),
  }
}

export const defaultWorkbenchMetadata: WorkbenchMetadata[] = [
  createWorkbenchMetadata({ id: 'dashboard-all', name: '全员工作台' }),
  createWorkbenchMetadata({ id: 'dashboard-electro', name: '电教主任工作台' }),
  createWorkbenchMetadata({ id: 'dashboard-moral', name: '德育主任工作台' }),
  createWorkbenchMetadata({ id: 'dashboard-research', name: '教研主任工作台' }),
]

export function isWorkbenchAvailable(workbench: WorkbenchMetadata, roles: string[]) {
  if (roles.includes(administratorRole)) return true
  if (workbench.availability !== '已启用') return false

  return workbench.visibleRoles.some((role) => roles.includes(role))
}

export function getVisibleWorkbenches(workbenches: WorkbenchMetadata[], roles: string[]) {
  return workbenches.filter((workbench) => isWorkbenchAvailable(workbench, roles))
}

export function toggleWorkbenchAvailability(workbench: WorkbenchMetadata): WorkbenchMetadata {
  const nextAvailability = getAvailabilityCode(workbench.availability) === 'enabled' ? 'disabled' : 'enabled'

  return {
    ...workbench,
    availability: getAvailabilityLabel(nextAvailability),
    availabilityCode: nextAvailability,
  }
}

export function updateWorkbenchVisibleRoles(workbench: WorkbenchMetadata, visibleRoles: string[]): WorkbenchMetadata {
  if (visibleRoles.length === 0) {
    throw new Error('至少选择一个可见角色')
  }

  return {
    ...workbench,
    visibleRoles: visibleRoles.map(getRoleName),
    visibleRoleCodes: visibleRoles.map(getRoleCode),
  }
}
