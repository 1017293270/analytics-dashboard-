import { z } from 'zod'
import { roleCodeValidator } from './auth.js'

export const applicationPlatformValidator = z.enum(['web', 'mobile'])
export type ApplicationPlatform = z.infer<typeof applicationPlatformValidator>

export const applicationStatusValidator = z.enum(['enabled', 'disabled', 'uninstalled'])
export type ApplicationStatus = z.infer<typeof applicationStatusValidator>

const nonEmptyText = z.string().trim().min(1)
const optionalText = z.string().trim().max(500).optional().default('')
const roleCodesValidator = z.array(roleCodeValidator).min(1)

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const applicationCategoryRowValidator = z.object({
  id: nonEmptyText.max(80),
  name: nonEmptyText.max(80),
  sortOrder: z.number().int().nonnegative(),
})

export type ApplicationCategoryRow = z.infer<typeof applicationCategoryRowValidator>

export const applicationRowValidator = z.object({
  id: nonEmptyText.max(128),
  name: nonEmptyText.max(120),
  categoryId: nonEmptyText.max(80),
  categoryName: nonEmptyText.max(80),
  platform: applicationPlatformValidator,
  url: z.string(),
  packageId: z.string(),
  icon: nonEmptyText.max(80),
  visibleRoleCodes: roleCodesValidator,
  status: applicationStatusValidator,
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ApplicationRow = z.infer<typeof applicationRowValidator>

export const createApplicationInputValidator = z
  .object({
    name: nonEmptyText.max(120),
    categoryId: nonEmptyText.max(80),
    platform: applicationPlatformValidator,
    url: optionalText,
    packageId: optionalText,
    icon: z.string().trim().min(1).max(80).optional().default('dashboard'),
    visibleRoleCodes: roleCodesValidator,
    status: applicationStatusValidator.optional().default('enabled'),
    sortOrder: z.number().int().nonnegative().optional(),
  })
  .superRefine((value, context) => {
    if (value.platform === 'web' && !isValidHttpUrl(value.url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Web applications require an http(s) url',
      })
    }
    if (value.platform === 'mobile' && value.packageId.trim().length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['packageId'],
        message: 'Mobile applications require a package id',
      })
    }
  })

export type CreateApplicationInput = z.infer<typeof createApplicationInputValidator>

export const updateApplicationInputValidator = z
  .object({
    name: nonEmptyText.max(120).optional(),
    categoryId: nonEmptyText.max(80).optional(),
    platform: applicationPlatformValidator.optional(),
    url: z.string().trim().max(500).optional(),
    packageId: z.string().trim().max(500).optional(),
    icon: z.string().trim().min(1).max(80).optional(),
    visibleRoleCodes: roleCodesValidator.optional(),
    status: applicationStatusValidator.optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  })
  .superRefine((value, context) => {
    if (value.url !== undefined && value.url.length > 0 && !isValidHttpUrl(value.url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Application url must be http(s)',
      })
    }
    if (value.platform === 'mobile' && value.packageId !== undefined && value.packageId.trim().length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['packageId'],
        message: 'Mobile applications require a package id',
      })
    }
  })

export type UpdateApplicationInput = z.infer<typeof updateApplicationInputValidator>

export const applicationListQueryValidator = z.object({
  keyword: z.string().trim().optional().default(''),
  categoryId: z.string().trim().min(1).optional(),
  platform: applicationPlatformValidator.optional(),
  status: applicationStatusValidator.optional(),
  visibleRoleCode: roleCodeValidator.optional(),
})

export type ApplicationListQuery = z.infer<typeof applicationListQueryValidator>
