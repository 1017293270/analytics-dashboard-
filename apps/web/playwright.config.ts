import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const reuseExistingServer = !process.env.CI

export default defineConfig({
  testDir: './e2e',
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm --workspace apps/api run prisma:migrate && npm --workspace apps/api run dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer,
      timeout: 120_000,
      cwd: workspaceRoot,
    },
    {
      command: 'npm --workspace apps/web run dev',
      url: 'http://localhost:5174',
      reuseExistingServer,
      timeout: 120_000,
      cwd: workspaceRoot,
    },
  ],
  projects: [
    {
      name: 'Desktop Chrome 1366x768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'Large Screen Chrome 1920x1080',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
})
