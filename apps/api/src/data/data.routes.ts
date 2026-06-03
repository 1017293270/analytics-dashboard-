import { ok } from '@analytics/shared'
import { Router } from 'express'
import { z } from 'zod'
import { sendBadRequest } from '../errors.js'
import { getMockData } from './mock-data.js'

const dataQueryBody = z.object({
  sourceType: z.literal('mock'),
  query: z.object({ dimensions: z.array(z.string()).optional(), metrics: z.array(z.string()).optional() }),
})

export const dataRoutes = Router()

dataRoutes.post('/big-screens/data/query', (req, res) => {
  const body = dataQueryBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'DATA_QUERY_INVALID', 'Mock data query is invalid')
  res.json(ok(getMockData(body.data.query)))
})
