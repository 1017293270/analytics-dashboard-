import cors from 'cors'
import express from 'express'
import { env } from './env.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.WEB_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, error: null })
  })

  return app
}
