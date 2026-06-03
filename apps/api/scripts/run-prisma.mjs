import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const prismaCli = join(workspaceRoot, 'node_modules', 'prisma', 'build', 'index.js')

const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
