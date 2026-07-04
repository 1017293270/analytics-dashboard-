export type WorkbenchAvailability = '已启用' | '已停用'

export type WorkbenchMetadata = {
  id: string
  name: string
  visibleRoles: string[]
  availability: WorkbenchAvailability
}

export type WorkbenchMetadataInput = {
  id: string
  name: string
  visibleRoles?: string[]
  availability?: WorkbenchAvailability
}

const administratorRole = '系统管理员'

const roleByWorkbenchName: Record<string, string> = {
  全员工作台: '全员',
  电教主任工作台: '电教主任',
  德育主任工作台: '德育主任',
  教研主任工作台: '教研主任',
}

export function createWorkbenchMetadata(input: WorkbenchMetadataInput): WorkbenchMetadata {
  return {
    id: input.id,
    name: input.name,
    visibleRoles: input.visibleRoles ? [...input.visibleRoles] : [roleByWorkbenchName[input.name] ?? '全员'],
    availability: input.availability ?? '已启用',
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
  return {
    ...workbench,
    availability: workbench.availability === '已启用' ? '已停用' : '已启用',
  }
}

export function updateWorkbenchVisibleRoles(workbench: WorkbenchMetadata, visibleRoles: string[]): WorkbenchMetadata {
  if (visibleRoles.length === 0) {
    throw new Error('至少选择一个可见角色')
  }

  return {
    ...workbench,
    visibleRoles: [...visibleRoles],
  }
}
