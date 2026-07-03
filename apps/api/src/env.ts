import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5174'),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
})

export const env = envSchema.parse(process.env)
