import cors from 'cors'
import express from 'express'
import { ok } from '@analytics/shared'
import { authRoutes } from './auth/auth.routes.js'
import { roleRoutes } from './auth/role.routes.js'
import { attachAuthContext } from './auth/session.js'
import { dashboardRoutes } from './dashboards/dashboard.routes.js'
import { dataRoutes } from './data/data.routes.js'
import { env } from './env.js'
import { errorMiddleware } from './errors.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(attachAuthContext)

  app.get('/api/health', (_req, res) => {
    res.json(ok({ status: 'ok' }))
  })
  app.use('/api', authRoutes)
  app.use('/api', roleRoutes)
  app.use('/api', dashboardRoutes)
  app.use('/api', dataRoutes)
  app.use(errorMiddleware)

  return app
}
