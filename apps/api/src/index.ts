import { createApp } from './app.js'
import { env } from './env.js'

const app = createApp()

app.listen(env.API_PORT, () => {
  console.log(`API listening on http://localhost:${env.API_PORT}`)
})
