import { spawnSync } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const prismaCli = join(workspaceRoot, 'node_modules', 'prisma', 'build', 'index.js')
const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const prismaArgs = process.argv.slice(2)

function ensureSqliteFile(url) {
  if (!url.startsWith('file:')) return
  const rawPath = url.slice('file:'.length)
  if (!rawPath || rawPath === ':memory:' || rawPath.startsWith('memory:')) return

  const normalizedPath = rawPath.replace(/\?.*$/, '')
  const databasePath = isAbsolute(normalizedPath)
    ? normalizedPath
    : resolve(apiRoot, 'prisma', normalizedPath)
  if (existsSync(databasePath)) return

  mkdirSync(dirname(databasePath), { recursive: true })
  closeSync(openSync(databasePath, 'a'))
}

if (prismaArgs[0] === 'migrate' || prismaArgs[0] === 'db') {
  ensureSqliteFile(databaseUrl)
}

const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
