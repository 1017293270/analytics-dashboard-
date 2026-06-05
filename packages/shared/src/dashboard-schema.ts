import { z } from 'zod'

export const componentTypeValidator = z.enum([
  'metric-card',
  'line-chart',
  'area-chart',
  'bar-chart',
  'pie-chart',
  'radar-chart',
  'funnel-chart',
  'table',
  'text',
  'image',
  'decoration',
])

export type ComponentType = z.infer<typeof componentTypeValidator>

export const backgroundConfigValidator = z.union([
  z.object({ type: z.literal('color'), value: z.string().min(1).max(80) }),
  z.object({ type: z.literal('image'), assetId: z.string().min(1), fit: z.enum(['cover', 'contain', 'fill']) }),
])

export const componentLayoutValidator = z.object({
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
  width: z.number().min(24).max(10000),
  height: z.number().min(24).max(10000),
  zIndex: z.number().int().min(0).max(10000),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
})

export const dashboardComponentValidator = z.object({
  id: z.string().min(1).max(80),
  type: componentTypeValidator,
  name: z.string().min(1).max(120),
  layout: componentLayoutValidator,
  props: z.record(z.unknown()).default({}),
  style: z.record(z.unknown()).default({}),
  dataBindingId: z.string().min(1).max(80).optional(),
})

export const dataBindingValidator = z.object({
  id: z.string().min(1).max(80),
  sourceType: z.enum(['mock', 'dataset', 'ai-question', 'sql']),
  sourceId: z.string().min(1).max(120).optional(),
  query: z.object({
    dimensions: z.array(z.string().min(1).max(80)).optional(),
    metrics: z.array(z.string().min(1).max(80)).optional(),
    filters: z.array(z.unknown()).optional(),
    sort: z.array(z.unknown()).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    question: z.string().max(1000).optional(),
  }),
  refreshSeconds: z.number().int().min(5).max(86400).optional(),
})

export const dashboardSchemaValidator = z
  .object({
    version: z.literal('1.0'),
    canvas: z.object({
      width: z.number().int().min(320).max(7680),
      height: z.number().int().min(240).max(4320),
      background: backgroundConfigValidator,
      scaleMode: z.enum(['fit-screen', 'fit-width', 'fixed']),
    }),
    theme: z.object({
      name: z.string().min(1).max(80),
      colors: z.array(z.string().min(1).max(80)).min(1).max(12),
      fontFamily: z.string().min(1).max(120),
    }),
    components: z.array(dashboardComponentValidator).max(200),
    dataBindings: z.record(dataBindingValidator),
    refresh: z.object({
      mode: z.enum(['manual', 'interval']),
      intervalSeconds: z.number().int().min(5).max(86400).optional(),
    }),
  })
  .superRefine((schema, ctx) => {
    const componentIds = new Set<string>()
    for (const component of schema.components) {
      if (componentIds.has(component.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['components'],
          message: `Duplicate component id: ${component.id}`,
        })
      }
      componentIds.add(component.id)

      if (
        component.dataBindingId &&
        !Object.prototype.hasOwnProperty.call(schema.dataBindings, component.dataBindingId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['components', component.id, 'dataBindingId'],
          message: `Missing data binding: ${component.dataBindingId}`,
        })
      }
    }

    const bindingIds = new Set<string>()
    for (const [key, binding] of Object.entries(schema.dataBindings)) {
      if (key !== binding.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dataBindings', key],
          message: `Data binding key must match id: ${binding.id}`,
        })
      }
      if (bindingIds.has(binding.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dataBindings'],
          message: `Duplicate data binding id: ${binding.id}`,
        })
      }
      bindingIds.add(binding.id)
    }
  })

export type DashboardSchema = z.infer<typeof dashboardSchemaValidator>
export type DashboardComponent = z.infer<typeof dashboardComponentValidator>
export type DataBinding = z.infer<typeof dataBindingValidator>
export type BackgroundConfig = z.infer<typeof backgroundConfigValidator>
