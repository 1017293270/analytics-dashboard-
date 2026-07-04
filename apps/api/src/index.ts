import { createApp } from './app.js'
import { env } from './env.js'
import { attachTeachingRealtimeServer } from './teaching/teachingRealtime.js'

const app = createApp()

const server = app.listen(env.API_PORT, () => {
  console.log(`API listening on http://localhost:${env.API_PORT}`)
})

attachTeachingRealtimeServer(server)
