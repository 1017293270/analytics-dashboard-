import cors from 'cors'
import express from 'express'
import { ok } from '@analytics/shared'
import { dashboardRoutes } from './dashboards/dashboard.routes.js'
import { dataRoutes } from './data/data.routes.js'
import { env } from './env.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.WEB_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json(ok({ status: 'ok' }))
  })
  app.use('/api', dashboardRoutes)
  app.use('/api', dataRoutes)

  return app
}
