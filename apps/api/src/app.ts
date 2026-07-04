import cors from 'cors'
import express from 'express'
import { ok } from '@analytics/shared'
import { alarmRoutes } from './alarms/alarm.routes.js'
import { accountRoutes } from './auth/account.routes.js'
import { authRoutes } from './auth/auth.routes.js'
import { roleRoutes } from './auth/role.routes.js'
import { attachAuthContext } from './auth/session.js'
import { applicationRoutes } from './applications/application.routes.js'
import { dashboardRoutes } from './dashboards/dashboard.routes.js'
import { dataDashboardRoutes } from './data-dashboards/dataDashboard.routes.js'
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
  app.use('/api', accountRoutes)
  app.use('/api', roleRoutes)
  app.use('/api', applicationRoutes)
  app.use('/api', dataDashboardRoutes)
  app.use('/api', alarmRoutes)
  app.use('/api', dataRoutes)
  app.use('/api', dashboardRoutes)
  app.use(errorMiddleware)

  return app
}
