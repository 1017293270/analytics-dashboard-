import { z } from 'zod'
import { roleCodeValidator } from './auth.js'

export const dataDashboardSourceValidator = z.enum(['builtin', 'embedded'])
export type DataDashboardSource = z.infer<typeof dataDashboardSourceValidator>

export const dataDashboardStatusValidator = z.enum(['enabled', 'disabled'])
export type DataDashboardStatus = z.infer<typeof dataDashboardStatusValidator>

const nonEmptyText = z.string().trim().min(1)
const roleCodesValidator = z.array(roleCodeValidator).min(1)

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const dataDashboardMetricValidator = z.object({
  label: nonEmptyText.max(80),
  value: nonEmptyText.max(80),
  trend: z.string().trim().max(120),
})

export type DataDashboardMetric = z.infer<typeof dataDashboardMetricValidator>

export const dataDashboardRowValidator = z.object({
  id: nonEmptyText.max(128),
  name: nonEmptyText.max(120),
  type: nonEmptyText.max(80),
  source: dataDashboardSourceValidator,
  embedUrl: z.string(),
  isDefault: z.boolean(),
  visibleRoleCodes: roleCodesValidator,
  status: dataDashboardStatusValidator,
  metrics: z.array(dataDashboardMetricValidator),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type DataDashboardRow = z.infer<typeof dataDashboardRowValidator>

export const createDataDashboardInputValidator = z
  .object({
    name: nonEmptyText.max(120),
    type: nonEmptyText.max(80),
    source: dataDashboardSourceValidator,
    embedUrl: z.string().trim().max(500).optional().default(''),
    isDefault: z.boolean().optional().default(false),
    visibleRoleCodes: roleCodesValidator,
    status: dataDashboardStatusValidator.optional().default('enabled'),
    metrics: z.array(dataDashboardMetricValidator).optional().default([]),
  })
  .superRefine((value, context) => {
    if (value.source === 'embedded' && !isValidHttpUrl(value.embedUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['embedUrl'],
        message: 'Embedded dashboards require an http(s) url',
      })
    }
  })

export type CreateDataDashboardInput = z.infer<typeof createDataDashboardInputValidator>

export const updateDataDashboardInputValidator = z
  .object({
    name: nonEmptyText.max(120).optional(),
    type: nonEmptyText.max(80).optional(),
    source: dataDashboardSourceValidator.optional(),
    embedUrl: z.string().trim().max(500).optional(),
    isDefault: z.boolean().optional(),
    visibleRoleCodes: roleCodesValidator.optional(),
    status: dataDashboardStatusValidator.optional(),
    metrics: z.array(dataDashboardMetricValidator).optional(),
  })
  .superRefine((value, context) => {
    if (value.embedUrl !== undefined && value.embedUrl.length > 0 && !isValidHttpUrl(value.embedUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['embedUrl'],
        message: 'Dashboard embedUrl must be http(s)',
      })
    }
  })

export type UpdateDataDashboardInput = z.infer<typeof updateDataDashboardInputValidator>

export const dataDashboardListQueryValidator = z.object({
  keyword: z.string().trim().optional().default(''),
  type: z.string().trim().min(1).optional(),
  source: dataDashboardSourceValidator.optional(),
  status: dataDashboardStatusValidator.optional(),
  roleCode: roleCodeValidator.optional(),
})

export type DataDashboardListQuery = z.infer<typeof dataDashboardListQueryValidator>
