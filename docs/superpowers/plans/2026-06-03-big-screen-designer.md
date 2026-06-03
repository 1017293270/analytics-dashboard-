# Big Screen Designer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 embeddable big-screen dashboard designer with a free 16:9 canvas, mock data, persistence, publishing, permissions, and a read-only runtime renderer.

**Architecture:** Use an npm workspace monorepo with `apps/web`, `apps/api`, and `packages/shared`. The web app owns designer/runtime UI, the API owns persistence and permissions, and the shared package owns Dashboard Schema types and Zod validators used by both sides.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Vue Router, ECharts, vue-echarts, Moveable, Express, Prisma, SQLite, Zod, Vitest, Playwright.

---

## File Structure

Create this repository structure:

```text
package.json
tsconfig.base.json
.gitignore
.env.example
apps/
  api/
    package.json
    tsconfig.json
    prisma/
      schema.prisma
    src/
      index.ts
      app.ts
      env.ts
      db.ts
      errors.ts
      audit/audit.ts
      dashboards/dashboard.repository.ts
      dashboards/dashboard.routes.ts
      data/mock-data.ts
      data/data.routes.ts
    tests/
      dashboard.routes.test.ts
      data.routes.test.ts
  web/
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    src/
      main.ts
      App.vue
      router.ts
      styles/tokens.css
      styles/global.css
      features/big-screen/
        api/bigScreenApi.ts
        schema/defaults.ts
        stores/useDashboardDesignerStore.ts
        stores/useDashboardHistoryStore.ts
        data-adapters/dataAdapter.types.ts
        data-adapters/mockDataAdapter.ts
        components/registry.ts
        components/renderers/MetricCardRenderer.vue
        components/renderers/EChartRenderer.vue
        components/renderers/TableRenderer.vue
        components/renderers/TextRenderer.vue
        components/renderers/ImageRenderer.vue
        components/renderers/DecorationRenderer.vue
        designer/DesignerShell.vue
        designer/DesignerToolbar.vue
        designer/ComponentPanel.vue
        designer/CanvasStage.vue
        designer/CanvasComponent.vue
        designer/PropertyPanel.vue
        runtime/RuntimeScreen.vue
        runtime/RuntimeScaler.vue
        runtime/RuntimeComponent.vue
        presets/presets.ts
    tests/
      schema-defaults.test.ts
      runtime-scaler.test.ts
    e2e/
      big-screen-flow.spec.ts
packages/
  shared/
    package.json
    tsconfig.json
    src/
      index.ts
      dashboard-schema.ts
      api.ts
      permissions.ts
```

Responsibilities:

- `packages/shared`: shared types, schemas, API envelopes, permissions.
- `apps/api`: dashboard CRUD, draft save, publish, versions, share links, mock data.
- `apps/web`: Vue app, designer, runtime, component registry, mock data rendering.
- `docs/superpowers/specs`: approved design specs.
- `docs/superpowers/plans`: implementation plans.

---

## Task 1: Initialize Workspace, Tooling, and Project Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.ts`
- Create: `apps/web/src/App.vue`
- Create: `apps/web/src/router.ts`
- Create: `apps/web/src/styles/tokens.css`
- Create: `apps/web/src/styles/global.css`
- Create: `apps/web/src/smoke.test.ts`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/tests/health.test.ts`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/index.test.ts`

- [ ] **Step 1: Create root workspace files**

Create `package.json`:

```json
{
  "name": "analytics-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm-run-all --parallel dev:web dev:api",
    "dev:web": "npm --workspace apps/web run dev",
    "dev:api": "npm --workspace apps/api run dev",
    "build": "npm-run-all build:shared build:web build:api",
    "build:shared": "npm --workspace packages/shared run build",
    "build:web": "npm --workspace apps/web run build",
    "build:api": "npm --workspace apps/api run build",
    "test": "npm-run-all test:shared test:web test:api",
    "test:shared": "npm --workspace packages/shared run test",
    "test:web": "npm --workspace apps/web run test",
    "test:api": "npm --workspace apps/api run test",
    "e2e": "npm --workspace apps/web run e2e",
    "lint": "npm-run-all lint:shared lint:web lint:api"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "npm-run-all": "^4.1.5",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@analytics/shared": ["packages/shared/src/index.ts"]
    }
  }
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
.env
.env.local
apps/api/prisma/dev.db
apps/api/prisma/dev.db-journal
apps/api/.prisma/
coverage/
playwright-report/
test-results/
.superpowers/
```

Create `.env.example`:

```text
API_PORT=4000
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=file:./dev.db
```

- [ ] **Step 2: Create web app skeleton**

Create `apps/web/package.json`:

```json
{
  "name": "@analytics/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "lint": "vue-tsc -b --pretty false"
  },
  "dependencies": {
    "@analytics/shared": "file:../../packages/shared",
    "@daybrush/vue3-moveable": "^0.27.0",
    "@vitejs/plugin-vue": "^5.0.5",
    "echarts": "^5.5.0",
    "nanoid": "^5.0.7",
    "pinia": "^2.1.7",
    "vue": "^3.4.27",
    "vue-echarts": "^6.7.0",
    "vue-router": "^4.3.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^24.1.0",
    "typescript": "^5.5.0",
    "vite": "^5.2.0",
    "vitest": "^1.6.0",
    "vue-tsc": "^2.0.19"
  }
}
```

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"],
    "jsx": "preserve"
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts", "e2e/**/*.ts"]
}
```

Create `apps/web/vite.config.ts`:

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
```

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Data Big Screen Designer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `apps/web/src/main.ts`:

```ts
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/tokens.css'
import './styles/global.css'

createApp(App).use(createPinia()).use(router).mount('#app')
```

Create `apps/web/src/App.vue`:

```vue
<template>
  <RouterView />
</template>
```

Create `apps/web/src/router.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/big-screens/new',
    },
    {
      path: '/big-screens/:id',
      component: () => import('./features/big-screen/designer/DesignerShell.vue'),
    },
    {
      path: '/runtime/:id',
      component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
    },
    {
      path: '/share/:token',
      component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
    },
  ],
})
```

Create `apps/web/src/styles/tokens.css`:

```css
:root {
  --color-page: #eef2f7;
  --color-panel: #ffffff;
  --color-panel-muted: #f8fafc;
  --color-border: #d8e2f3;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-accent: #2563eb;
  --color-accent-soft: #dbeafe;
  --color-danger: #dc2626;
  --color-success: #16a34a;
  --shadow-panel: 0 18px 45px rgba(15, 23, 42, 0.12);
  --radius-panel: 8px;
  --motion-fast: 120ms;
  --motion-medium: 250ms;
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Create `apps/web/src/styles/global.css`:

```css
* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  background: var(--color-page);
  color: var(--color-text);
  font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

Create `apps/web/src/smoke.test.ts`:

```ts
import { describe, expect, test } from 'vitest'

describe('web smoke test', () => {
  test('loads test runtime', () => {
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 3: Create API and shared package skeletons**

Create `apps/api/package.json`:

```json
{
  "name": "@analytics/api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --pretty false",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@analytics/shared": "file:../../packages/shared",
    "@prisma/client": "^5.15.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "nanoid": "^5.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "prisma": "^5.15.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "tsx": "^4.15.7",
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

Create `apps/api/src/index.ts`:

```ts
import { createApp } from './app.js'
import { env } from './env.js'

const app = createApp()

app.listen(env.API_PORT, () => {
  console.log(`API listening on http://localhost:${env.API_PORT}`)
})
```

Create `apps/api/src/app.ts`:

```ts
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
```

Create `apps/api/tests/health.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'

describe('health route', () => {
  test('returns ok status', async () => {
    const response = await request(createApp()).get('/api/health').expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('ok')
  })
})
```

Create `packages/shared/package.json`:

```json
{
  "name": "@analytics/shared",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --pretty false"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^1.6.0"
  }
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*.ts"]
}
```

Create `packages/shared/src/index.ts`:

```ts
export const sharedVersion = '0.1.0'
```

Create `packages/shared/src/index.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { sharedVersion } from './index.js'

describe('shared package', () => {
  test('exposes package version', () => {
    expect(sharedVersion).toBe('0.1.0')
  })
})
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: npm installs workspace dependencies and creates `package-lock.json`.

- [ ] **Step 5: Create local environment file**

Run in PowerShell:

```powershell
Copy-Item .env.example .env
```

Expected: `.env` exists locally and remains ignored by Git.

- [ ] **Step 6: Verify the skeleton**

Run:

```bash
npm run build
npm run test
```

Expected: shared, web, and API TypeScript builds pass; smoke tests pass in all workspaces.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json .gitignore .env.example apps packages
git commit -m "chore: initialize big screen workspace"
```

---

## Task 2: Define Shared Schema, API Envelope, and Permissions

**Files:**
- Create: `packages/shared/src/dashboard-schema.ts`
- Create: `packages/shared/src/api.ts`
- Create: `packages/shared/src/permissions.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/dashboard-schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create `packages/shared/src/dashboard-schema.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { dashboardSchemaValidator } from './dashboard-schema.js'

describe('dashboardSchemaValidator', () => {
  test('accepts a valid empty dashboard schema', () => {
    const result = dashboardSchemaValidator.safeParse({
      version: '1.0',
      canvas: {
        width: 1920,
        height: 1080,
        background: { type: 'color', value: '#0b1220' },
        scaleMode: 'fit-screen',
      },
      theme: {
        name: 'Command Center',
        colors: ['#2563eb', '#22c55e'],
        fontFamily: 'Inter',
      },
      components: [],
      dataBindings: {},
      refresh: { mode: 'manual' },
    })

    expect(result.success).toBe(true)
  })

  test('rejects an unknown component type', () => {
    const result = dashboardSchemaValidator.safeParse({
      version: '1.0',
      canvas: {
        width: 1920,
        height: 1080,
        background: { type: 'color', value: '#0b1220' },
        scaleMode: 'fit-screen',
      },
      theme: {
        name: 'Command Center',
        colors: ['#2563eb'],
        fontFamily: 'Inter',
      },
      components: [
        {
          id: 'component-1',
          type: 'unknown-chart',
          name: 'Unknown',
          layout: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          props: {},
          style: {},
        },
      ],
      dataBindings: {},
      refresh: { mode: 'manual' },
    })

    expect(result.success).toBe(false)
  })

  test('rejects duplicate component ids', () => {
    const component = {
      id: 'component-1',
      type: 'metric-card',
      name: 'Metric',
      layout: { x: 0, y: 0, width: 320, height: 160, zIndex: 1 },
      props: {},
      style: {},
    }

    const result = dashboardSchemaValidator.safeParse({
      version: '1.0',
      canvas: {
        width: 1920,
        height: 1080,
        background: { type: 'color', value: '#0b1220' },
        scaleMode: 'fit-screen',
      },
      theme: {
        name: 'Command Center',
        colors: ['#2563eb'],
        fontFamily: 'Inter',
      },
      components: [component, component],
      dataBindings: {},
      refresh: { mode: 'manual' },
    })

    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm --workspace packages/shared run test -- dashboard-schema
```

Expected: FAIL because `dashboard-schema.ts` does not exist.

- [ ] **Step 3: Implement shared schema**

Create `packages/shared/src/dashboard-schema.ts`:

```ts
import { z } from 'zod'

export const componentTypeValidator = z.enum([
  'metric-card',
  'line-chart',
  'bar-chart',
  'pie-chart',
  'table',
  'text',
  'image',
  'decoration',
])

export type ComponentType = z.infer<typeof componentTypeValidator>

export const backgroundConfigValidator = z.union([
  z.object({ type: z.literal('color'), value: z.string().min(1).max(80) }),
  z.object({ type: z.literal('image'), assetId: z.string().min(1), fit: z.enum(['cover', 'contain', 'fill']) }),
])

export const componentLayoutValidator = z.object({
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
  width: z.number().min(24).max(10000),
  height: z.number().min(24).max(10000),
  zIndex: z.number().int().min(0).max(10000),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
})

export const dashboardComponentValidator = z.object({
  id: z.string().min(1).max(80),
  type: componentTypeValidator,
  name: z.string().min(1).max(120),
  layout: componentLayoutValidator,
  props: z.record(z.unknown()).default({}),
  style: z.record(z.unknown()).default({}),
  dataBindingId: z.string().min(1).max(80).optional(),
})

export const dataBindingValidator = z.object({
  id: z.string().min(1).max(80),
  sourceType: z.enum(['mock', 'dataset', 'ai-question', 'sql']),
  sourceId: z.string().min(1).max(120).optional(),
  query: z.object({
    dimensions: z.array(z.string().min(1).max(80)).optional(),
    metrics: z.array(z.string().min(1).max(80)).optional(),
    filters: z.array(z.unknown()).optional(),
    sort: z.array(z.unknown()).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    question: z.string().max(1000).optional(),
  }),
  refreshSeconds: z.number().int().min(5).max(86400).optional(),
})

export const dashboardSchemaValidator = z
  .object({
    version: z.literal('1.0'),
    canvas: z.object({
      width: z.number().int().min(320).max(7680),
      height: z.number().int().min(240).max(4320),
      background: backgroundConfigValidator,
      scaleMode: z.enum(['fit-screen', 'fit-width', 'fixed']),
    }),
    theme: z.object({
      name: z.string().min(1).max(80),
      colors: z.array(z.string().min(1).max(80)).min(1).max(12),
      fontFamily: z.string().min(1).max(120),
    }),
    components: z.array(dashboardComponentValidator).max(200),
    dataBindings: z.record(dataBindingValidator),
    refresh: z.object({
      mode: z.enum(['manual', 'interval']),
      intervalSeconds: z.number().int().min(5).max(86400).optional(),
    }),
  })
  .superRefine((schema, ctx) => {
    const componentIds = new Set<string>()
    for (const component of schema.components) {
      if (componentIds.has(component.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['components'],
          message: `Duplicate component id: ${component.id}`,
        })
      }
      componentIds.add(component.id)

      if (component.dataBindingId && !schema.dataBindings[component.dataBindingId]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['components', component.id, 'dataBindingId'],
          message: `Missing data binding: ${component.dataBindingId}`,
        })
      }
    }

    const bindingIds = new Set<string>()
    for (const [key, binding] of Object.entries(schema.dataBindings)) {
      if (key !== binding.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dataBindings', key],
          message: `Data binding key must match id: ${binding.id}`,
        })
      }
      if (bindingIds.has(binding.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dataBindings'],
          message: `Duplicate data binding id: ${binding.id}`,
        })
      }
      bindingIds.add(binding.id)
    }
  })

export type DashboardSchema = z.infer<typeof dashboardSchemaValidator>
export type DashboardComponent = z.infer<typeof dashboardComponentValidator>
export type DataBinding = z.infer<typeof dataBindingValidator>
export type BackgroundConfig = z.infer<typeof backgroundConfigValidator>
```

Create `packages/shared/src/api.ts`:

```ts
export type ApiSuccess<T> = {
  success: true
  data: T
  error: null
  meta?: Record<string, unknown>
}

export type ApiFailure = {
  success: false
  data: null
  error: {
    code: string
    message: string
  }
  meta?: Record<string, unknown>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { success: true, data, error: null, meta }
}

export function fail(code: string, message: string, meta?: Record<string, unknown>): ApiFailure {
  return { success: false, data: null, error: { code, message }, meta }
}
```

Create `packages/shared/src/permissions.ts`:

```ts
import { z } from 'zod'

export const dashboardPermissionValidator = z.enum(['view', 'edit', 'owner'])
export type DashboardPermission = z.infer<typeof dashboardPermissionValidator>

export function canEdit(permission: DashboardPermission): boolean {
  return permission === 'edit' || permission === 'owner'
}

export function canPublish(permission: DashboardPermission): boolean {
  return permission === 'owner'
}
```

Modify `packages/shared/src/index.ts`:

```ts
export const sharedVersion = '0.1.0'
export * from './api.js'
export * from './dashboard-schema.js'
export * from './permissions.js'
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
npm --workspace packages/shared run test -- dashboard-schema
npm --workspace packages/shared run build
```

Expected: all tests pass and shared package builds.

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat: add dashboard schema contract"
```

---

## Task 3: Implement API Persistence, Routes, Permissions, and Mock Data

**Files:**
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/errors.ts`
- Create: `apps/api/src/audit/audit.ts`
- Create: `apps/api/src/dashboards/dashboard.repository.ts`
- Create: `apps/api/src/dashboards/dashboard.routes.ts`
- Create: `apps/api/src/data/mock-data.ts`
- Create: `apps/api/src/data/data.routes.ts`
- Create: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/dashboard.routes.test.ts`
- Test: `apps/api/tests/data.routes.test.ts`

- [ ] **Step 1: Write route tests**

Create `apps/api/tests/dashboard.routes.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'

describe('dashboard routes', () => {
  test('creates and fetches a dashboard draft', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Operations Overview', description: 'AI Q&A operations' })
      .expect(201)

    expect(created.body.success).toBe(true)
    expect(created.body.data.name).toBe('Operations Overview')

    const fetched = await request(app)
      .get(`/api/big-screens/${created.body.data.id}`)
      .expect(200)

    expect(fetched.body.data.id).toBe(created.body.data.id)
    expect(fetched.body.data.draftSchema.version).toBe('1.0')
  })

  test('rejects invalid draft schema', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Invalid Schema Screen' })
      .expect(201)

    const response = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: { version: 'bad' } })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('SCHEMA_INVALID')
  })
})
```

Create `apps/api/tests/data.routes.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'

describe('mock data routes', () => {
  test('returns time-series mock data', async () => {
    const app = createApp()

    const response = await request(app)
      .post('/api/big-screens/data/query')
      .send({
        sourceType: 'mock',
        query: { dimensions: ['date'], metrics: ['count'] },
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data.kind).toBe('time-series')
    expect(response.body.data.rows.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm --workspace apps/api run test -- dashboard.routes data.routes
```

Expected: FAIL because routes and API modules are not defined.

- [ ] **Step 3: Implement Prisma schema**

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Dashboard {
  id              String   @id
  name            String
  description     String?
  ownerId         String
  workspaceId     String
  status          String
  draftSchema     String
  publishedSchema String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  publishedAt     DateTime?

  versions    DashboardVersion[]
  permissions DashboardPermission[]
  shareLinks  DashboardShareLink[]
}

model DashboardVersion {
  id          String   @id
  dashboardId String
  version     Int
  schema      String
  publishNote String?
  createdBy   String
  createdAt   DateTime @default(now())

  dashboard Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  @@unique([dashboardId, version])
}

model DashboardPermission {
  id          String @id
  dashboardId String
  subjectType String
  subjectId   String
  permission  String

  dashboard Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  @@index([dashboardId, subjectType, subjectId])
}

model DashboardShareLink {
  id          String   @id
  dashboardId String
  token       String   @unique
  accessScope String
  expiresAt   DateTime?
  isEnabled   Boolean  @default(true)

  dashboard Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id          String   @id
  actorId     String
  action      String
  resourceId  String
  metadata    String
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 4: Implement API infrastructure**

Create `apps/api/src/env.ts`:

```ts
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
})

export const env = envSchema.parse(process.env)
```

Create `apps/api/src/db.ts`:

```ts
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
```

Create `apps/api/src/errors.ts`:

```ts
import type { Response } from 'express'
import { fail } from '@analytics/shared'

export function sendBadRequest(res: Response, code: string, message: string) {
  return res.status(400).json(fail(code, message))
}

export function sendForbidden(res: Response, message = 'You do not have permission for this dashboard') {
  return res.status(403).json(fail('FORBIDDEN', message))
}

export function sendNotFound(res: Response, message = 'Dashboard not found') {
  return res.status(404).json(fail('NOT_FOUND', message))
}
```

Create `apps/api/src/audit/audit.ts`:

```ts
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

export async function recordAudit(action: string, resourceId: string, actorId: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      id: nanoid(),
      action,
      resourceId,
      actorId,
      metadata: JSON.stringify(metadata),
    },
  })
}
```

- [ ] **Step 5: Implement repository and routes**

Create `apps/api/src/dashboards/dashboard.repository.ts`:

```ts
import { dashboardSchemaValidator, type DashboardSchema } from '@analytics/shared'
import { nanoid } from 'nanoid'
import { prisma } from '../db.js'

export const DEFAULT_ACTOR_ID = 'demo-user'
export const DEFAULT_WORKSPACE_ID = 'demo-workspace'

export function createDefaultSchema(): DashboardSchema {
  return {
    version: '1.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: { type: 'color', value: '#0b1220' },
      scaleMode: 'fit-screen',
    },
    theme: {
      name: 'Command Center',
      colors: ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'],
      fontFamily: 'Inter',
    },
    components: [],
    dataBindings: {},
    refresh: { mode: 'manual' },
  }
}

export function parseSchema(value: string): DashboardSchema {
  return dashboardSchemaValidator.parse(JSON.parse(value))
}

export async function createDashboard(input: { name: string; description?: string }) {
  const schema = createDefaultSchema()
  const dashboard = await prisma.dashboard.create({
    data: {
      id: nanoid(),
      name: input.name,
      description: input.description ?? null,
      ownerId: DEFAULT_ACTOR_ID,
      workspaceId: DEFAULT_WORKSPACE_ID,
      status: 'draft',
      draftSchema: JSON.stringify(schema),
      permissions: {
        create: {
          id: nanoid(),
          subjectType: 'user',
          subjectId: DEFAULT_ACTOR_ID,
          permission: 'owner',
        },
      },
    },
  })

  return { ...dashboard, draftSchema: schema, publishedSchema: null }
}

export async function getDashboard(id: string) {
  const dashboard = await prisma.dashboard.findUnique({ where: { id } })
  if (!dashboard) return null
  return {
    ...dashboard,
    draftSchema: parseSchema(dashboard.draftSchema),
    publishedSchema: dashboard.publishedSchema ? parseSchema(dashboard.publishedSchema) : null,
  }
}
```

Create `apps/api/src/dashboards/dashboard.routes.ts`:

```ts
import { dashboardSchemaValidator, ok } from '@analytics/shared'
import { Router } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { recordAudit } from '../audit/audit.js'
import { prisma } from '../db.js'
import { sendBadRequest, sendNotFound } from '../errors.js'
import { createDashboard, DEFAULT_ACTOR_ID, getDashboard, parseSchema } from './dashboard.repository.js'

const createDashboardBody = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
})

export const dashboardRoutes = Router()

dashboardRoutes.get('/big-screens', async (_req, res) => {
  const dashboards = await prisma.dashboard.findMany({ orderBy: { updatedAt: 'desc' } })
  res.json(
    ok(
      dashboards.map((dashboard) => ({
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        status: dashboard.status,
        updatedAt: dashboard.updatedAt,
        publishedAt: dashboard.publishedAt,
      })),
    ),
  )
})

dashboardRoutes.post('/big-screens', async (req, res) => {
  const body = createDashboardBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'REQUEST_INVALID', 'Dashboard name is required')
  const dashboard = await createDashboard(body.data)
  await recordAudit('dashboard.create', dashboard.id, DEFAULT_ACTOR_ID, { name: dashboard.name })
  res.status(201).json(ok(dashboard))
})

dashboardRoutes.get('/big-screens/:id', async (req, res) => {
  const dashboard = await getDashboard(req.params.id)
  if (!dashboard) return sendNotFound(res)
  res.json(ok(dashboard))
})

dashboardRoutes.patch('/big-screens/:id/draft', async (req, res) => {
  const parsed = dashboardSchemaValidator.safeParse(req.body.draftSchema)
  if (!parsed.success) return sendBadRequest(res, 'SCHEMA_INVALID', 'Dashboard schema failed validation')

  const exists = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!exists) return sendNotFound(res)

  await prisma.dashboard.update({
    where: { id: req.params.id },
    data: { draftSchema: JSON.stringify(parsed.data) },
  })
  await recordAudit('dashboard.draft.update', req.params.id, DEFAULT_ACTOR_ID, { componentCount: parsed.data.components.length })

  const updated = await getDashboard(req.params.id)
  res.json(ok(updated))
})

dashboardRoutes.post('/big-screens/:id/publish', async (req, res) => {
  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id }, include: { versions: true } })
  if (!dashboard) return sendNotFound(res)

  const schema = parseSchema(dashboard.draftSchema)
  const nextVersion = dashboard.versions.length + 1

  await prisma.dashboard.update({
    where: { id: dashboard.id },
    data: {
      status: 'published',
      publishedSchema: JSON.stringify(schema),
      publishedAt: new Date(),
      versions: {
        create: {
          id: nanoid(),
          version: nextVersion,
          schema: JSON.stringify(schema),
          publishNote: typeof req.body.publishNote === 'string' ? req.body.publishNote.slice(0, 500) : null,
          createdBy: DEFAULT_ACTOR_ID,
        },
      },
    },
  })
  await recordAudit('dashboard.publish', dashboard.id, DEFAULT_ACTOR_ID, { version: nextVersion })

  const updated = await getDashboard(dashboard.id)
  res.json(ok(updated))
})

dashboardRoutes.get('/big-screens/:id/runtime', async (req, res) => {
  const dashboard = await getDashboard(req.params.id)
  if (!dashboard) return sendNotFound(res)
  if (!dashboard.publishedSchema) return sendBadRequest(res, 'NOT_PUBLISHED', 'Dashboard is not published')
  res.json(ok({ id: dashboard.id, name: dashboard.name, schema: dashboard.publishedSchema }))
})
```

- [ ] **Step 6: Implement mock data route**

Create `apps/api/src/data/mock-data.ts`:

```ts
export type MockDataResult =
  | { kind: 'metric'; value: number; label: string; trend: number }
  | { kind: 'time-series'; rows: Array<{ date: string; count: number }> }
  | { kind: 'category'; rows: Array<{ category: string; value: number }> }
  | { kind: 'table'; columns: string[]; rows: Array<Record<string, string | number>> }

export function getMockData(query: { dimensions?: string[]; metrics?: string[] }): MockDataResult {
  const dimensions = query.dimensions ?? []
  if (dimensions.includes('date')) {
    return {
      kind: 'time-series',
      rows: [
        { date: '2026-06-01', count: 4 },
        { date: '2026-06-02', count: 3 },
        { date: '2026-06-03', count: 3 },
      ],
    }
  }

  if (dimensions.includes('category')) {
    return {
      kind: 'category',
      rows: [
        { category: 'SQL', value: 38 },
        { category: 'Q&A', value: 26 },
        { category: 'Report', value: 18 },
      ],
    }
  }

  if (dimensions.includes('table')) {
    return {
      kind: 'table',
      columns: ['name', 'count', 'owner'],
      rows: [
        { name: 'Pending questions', count: 12, owner: 'Data team' },
        { name: 'Resolved questions', count: 86, owner: 'AI ops' },
      ],
    }
  }

  return { kind: 'metric', value: 128430, label: 'Total Q&A Requests', trend: 12.8 }
}
```

Create `apps/api/src/data/data.routes.ts`:

```ts
import { ok } from '@analytics/shared'
import { Router } from 'express'
import { z } from 'zod'
import { sendBadRequest } from '../errors.js'
import { getMockData } from './mock-data.js'

const dataQueryBody = z.object({
  sourceType: z.literal('mock'),
  query: z.object({
    dimensions: z.array(z.string()).optional(),
    metrics: z.array(z.string()).optional(),
  }),
})

export const dataRoutes = Router()

dataRoutes.post('/big-screens/data/query', (req, res) => {
  const body = dataQueryBody.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'DATA_QUERY_INVALID', 'Mock data query is invalid')
  res.json(ok(getMockData(body.data.query)))
})
```

Modify `apps/api/src/app.ts`:

```ts
import cors from 'cors'
import express from 'express'
import { dataRoutes } from './data/data.routes.js'
import { dashboardRoutes } from './dashboards/dashboard.routes.js'
import { env } from './env.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.WEB_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, error: null })
  })

  app.use('/api', dashboardRoutes)
  app.use('/api', dataRoutes)

  return app
}
```

- [ ] **Step 7: Generate Prisma client and migrate**

Run:

```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate -- --name init
```

Expected: Prisma client is generated and SQLite migration is created under `apps/api/prisma/migrations`.

- [ ] **Step 8: Run API tests**

Run:

```bash
npm --workspace apps/api run test -- dashboard.routes data.routes
npm --workspace apps/api run build
```

Expected: all API tests pass and API builds.

- [ ] **Step 9: Commit**

```bash
git add apps/api packages/shared package-lock.json
git commit -m "feat: add big screen api persistence"
```

---

## Task 4: Add Web Defaults, API Client, Stores, and History

**Files:**
- Create: `apps/web/src/features/big-screen/schema/defaults.ts`
- Create: `apps/web/src/features/big-screen/api/bigScreenApi.ts`
- Create: `apps/web/src/features/big-screen/stores/useDashboardDesignerStore.ts`
- Create: `apps/web/src/features/big-screen/stores/useDashboardHistoryStore.ts`
- Test: `apps/web/src/features/big-screen/schema/defaults.test.ts`

- [ ] **Step 1: Write failing defaults test**

Create `apps/web/src/features/big-screen/schema/defaults.test.ts`:

```ts
import { dashboardSchemaValidator } from '@analytics/shared'
import { describe, expect, test } from 'vitest'
import { createDefaultDashboardSchema } from './defaults'

describe('createDefaultDashboardSchema', () => {
  test('creates a valid 1920 by 1080 fit-screen schema', () => {
    const schema = createDefaultDashboardSchema()

    expect(schema.canvas.width).toBe(1920)
    expect(schema.canvas.height).toBe(1080)
    expect(schema.canvas.scaleMode).toBe('fit-screen')
    expect(dashboardSchemaValidator.safeParse(schema).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npm --workspace apps/web run test -- defaults
```

Expected: FAIL because `defaults.ts` does not exist.

- [ ] **Step 3: Implement defaults and API client**

Create `apps/web/src/features/big-screen/schema/defaults.ts`:

```ts
import type { DashboardSchema } from '@analytics/shared'

export function createDefaultDashboardSchema(): DashboardSchema {
  return {
    version: '1.0',
    canvas: {
      width: 1920,
      height: 1080,
      background: { type: 'color', value: '#0b1220' },
      scaleMode: 'fit-screen',
    },
    theme: {
      name: 'Command Center',
      colors: ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'],
      fontFamily: 'Inter',
    },
    components: [],
    dataBindings: {},
    refresh: { mode: 'manual' },
  }
}
```

Create `apps/web/src/features/big-screen/api/bigScreenApi.ts`:

```ts
import type { ApiResponse, DashboardSchema } from '@analytics/shared'

export type DashboardRecord = {
  id: string
  name: string
  description?: string | null
  status: 'draft' | 'published' | 'archived'
  draftSchema: DashboardSchema
  publishedSchema?: DashboardSchema | null
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const body = (await response.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.error.message)
  }
  return body.data
}

export const bigScreenApi = {
  createDashboard(input: { name: string; description?: string }) {
    return requestJson<DashboardRecord>('/api/big-screens', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  getDashboard(id: string) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}`)
  },
  saveDraft(id: string, draftSchema: DashboardSchema) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ draftSchema }),
    })
  },
  publish(id: string) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publishNote: 'Published from designer' }),
    })
  },
  getRuntime(id: string) {
    return requestJson<{ id: string; name: string; schema: DashboardSchema }>(`/api/big-screens/${id}/runtime`)
  },
}
```

- [ ] **Step 4: Implement Pinia stores**

Create `apps/web/src/features/big-screen/stores/useDashboardHistoryStore.ts`:

```ts
import type { DashboardSchema } from '@analytics/shared'
import { defineStore } from 'pinia'

type HistoryState = {
  past: DashboardSchema[]
  future: DashboardSchema[]
}

export const useDashboardHistoryStore = defineStore('dashboard-history', {
  state: (): HistoryState => ({
    past: [],
    future: [],
  }),
  actions: {
    push(previous: DashboardSchema) {
      this.past = [...this.past, structuredClone(previous)]
      this.future = []
    },
    undo(current: DashboardSchema): DashboardSchema | null {
      const previous = this.past.at(-1)
      if (!previous) return null
      this.past = this.past.slice(0, -1)
      this.future = [structuredClone(current), ...this.future]
      return structuredClone(previous)
    },
    redo(current: DashboardSchema): DashboardSchema | null {
      const next = this.future[0]
      if (!next) return null
      this.future = this.future.slice(1)
      this.past = [...this.past, structuredClone(current)]
      return structuredClone(next)
    },
  },
})
```

Create `apps/web/src/features/big-screen/stores/useDashboardDesignerStore.ts`:

```ts
import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { defineStore } from 'pinia'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import { useDashboardHistoryStore } from './useDashboardHistoryStore'

type DesignerState = {
  dashboardId: string | null
  dashboardName: string
  schema: DashboardSchema
  selectedComponentId: string | null
  zoom: number
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

export const useDashboardDesignerStore = defineStore('dashboard-designer', {
  state: (): DesignerState => ({
    dashboardId: null,
    dashboardName: 'Untitled Big Screen',
    schema: createDefaultDashboardSchema(),
    selectedComponentId: null,
    zoom: 0.75,
    isLoading: false,
    isSaving: false,
    error: null,
  }),
  getters: {
    selectedComponent(state): DashboardComponent | null {
      return state.schema.components.find((component) => component.id === state.selectedComponentId) ?? null
    },
  },
  actions: {
    applyDashboard(record: DashboardRecord) {
      this.dashboardId = record.id
      this.dashboardName = record.name
      this.schema = structuredClone(record.draftSchema)
      this.selectedComponentId = null
      this.error = null
    },
    async createDashboard() {
      this.isLoading = true
      try {
        this.applyDashboard(await bigScreenApi.createDashboard({ name: this.dashboardName }))
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create dashboard'
      } finally {
        this.isLoading = false
      }
    },
    async loadDashboard(id: string) {
      this.isLoading = true
      try {
        this.applyDashboard(await bigScreenApi.getDashboard(id))
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load dashboard'
      } finally {
        this.isLoading = false
      }
    },
    patchSchema(mutator: (schema: DashboardSchema) => DashboardSchema) {
      const history = useDashboardHistoryStore()
      history.push(this.schema)
      this.schema = mutator(structuredClone(this.schema))
    },
    addComponent(component: DashboardComponent) {
      this.patchSchema((schema) => ({
        ...schema,
        components: [...schema.components, component],
      }))
      this.selectedComponentId = component.id
    },
    updateComponent(componentId: string, patch: Partial<DashboardComponent>) {
      this.patchSchema((schema) => ({
        ...schema,
        components: schema.components.map((component) =>
          component.id === componentId ? { ...component, ...patch } : component,
        ),
      }))
    },
    removeSelectedComponent() {
      const componentId = this.selectedComponentId
      if (!componentId) return
      this.patchSchema((schema) => ({
        ...schema,
        components: schema.components.filter((component) => component.id !== componentId),
      }))
      this.selectedComponentId = null
    },
    async saveDraft() {
      if (!this.dashboardId) return
      this.isSaving = true
      try {
        this.applyDashboard(await bigScreenApi.saveDraft(this.dashboardId, this.schema))
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save dashboard'
      } finally {
        this.isSaving = false
      }
    },
    undo() {
      const history = useDashboardHistoryStore()
      const previous = history.undo(this.schema)
      if (previous) this.schema = previous
    },
    redo() {
      const history = useDashboardHistoryStore()
      const next = history.redo(this.schema)
      if (next) this.schema = next
    },
  },
})
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm --workspace apps/web run test -- defaults
npm --workspace apps/web run build
```

Expected: defaults test passes and web app builds.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/big-screen packages/shared package-lock.json
git commit -m "feat: add dashboard designer state"
```

---

## Task 5: Build Component Registry, Mock Adapter, and Renderers

**Files:**
- Create: `apps/web/src/features/big-screen/data-adapters/dataAdapter.types.ts`
- Create: `apps/web/src/features/big-screen/data-adapters/mockDataAdapter.ts`
- Create: `apps/web/src/features/big-screen/components/registry.ts`
- Create: `apps/web/src/features/big-screen/components/renderers/MetricCardRenderer.vue`
- Create: `apps/web/src/features/big-screen/components/renderers/EChartRenderer.vue`
- Create: `apps/web/src/features/big-screen/components/renderers/TableRenderer.vue`
- Create: `apps/web/src/features/big-screen/components/renderers/TextRenderer.vue`
- Create: `apps/web/src/features/big-screen/components/renderers/ImageRenderer.vue`
- Create: `apps/web/src/features/big-screen/components/renderers/DecorationRenderer.vue`

- [ ] **Step 1: Create data adapter types and mock adapter**

Create `apps/web/src/features/big-screen/data-adapters/dataAdapter.types.ts`:

```ts
import type { DataBinding } from '@analytics/shared'

export type MetricData = { kind: 'metric'; value: number; label: string; trend: number }
export type TimeSeriesData = { kind: 'time-series'; rows: Array<{ date: string; count: number }> }
export type CategoryData = { kind: 'category'; rows: Array<{ category: string; value: number }> }
export type TableData = { kind: 'table'; columns: string[]; rows: Array<Record<string, string | number>> }
export type ComponentData = MetricData | TimeSeriesData | CategoryData | TableData

export type DataLoadState =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: ComponentData | null; error: null }
  | { status: 'success'; data: ComponentData; error: null }
  | { status: 'empty'; data: null; error: null }
  | { status: 'error'; data: ComponentData | null; error: string }

export interface DataAdapter {
  query(binding: DataBinding): Promise<ComponentData>
}
```

Create `apps/web/src/features/big-screen/data-adapters/mockDataAdapter.ts`:

```ts
import type { DataBinding } from '@analytics/shared'
import type { ComponentData, DataAdapter } from './dataAdapter.types'

export const mockDataAdapter: DataAdapter = {
  async query(binding: DataBinding): Promise<ComponentData> {
    const response = await fetch('/api/big-screens/data/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceType: 'mock', query: binding.query }),
    })
    const body = await response.json()
    if (!body.success) {
      throw new Error(body.error.message)
    }
    return body.data
  },
}
```

- [ ] **Step 2: Create component registry**

Create `apps/web/src/features/big-screen/components/registry.ts`:

```ts
import type { ComponentType, DashboardComponent } from '@analytics/shared'
import { nanoid } from 'nanoid'
import DecorationRenderer from './renderers/DecorationRenderer.vue'
import EChartRenderer from './renderers/EChartRenderer.vue'
import ImageRenderer from './renderers/ImageRenderer.vue'
import MetricCardRenderer from './renderers/MetricCardRenderer.vue'
import TableRenderer from './renderers/TableRenderer.vue'
import TextRenderer from './renderers/TextRenderer.vue'

export type PropertyGroup = 'basic' | 'data' | 'style' | 'analysis'

export type ComponentDefinition = {
  type: ComponentType
  title: string
  defaultLayout: { width: number; height: number }
  defaultProps: Record<string, unknown>
  defaultStyle: Record<string, unknown>
  propertyGroups: PropertyGroup[]
  renderer: unknown
}

export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  'metric-card': {
    type: 'metric-card',
    title: 'Metric Card',
    defaultLayout: { width: 320, height: 170 },
    defaultProps: { title: 'Total Q&A Requests', valueFormat: 'number' },
    defaultStyle: { backgroundColor: '#111827', fontColor: '#e5f0ff', accentColor: '#60a5fa' },
    propertyGroups: ['basic', 'data', 'style'],
    renderer: MetricCardRenderer,
  },
  'line-chart': {
    type: 'line-chart',
    title: 'Line Chart',
    defaultLayout: { width: 560, height: 320 },
    defaultProps: { title: 'Question Trend', chartType: 'line', showLegend: true, showAxis: true, showGrid: true },
    defaultStyle: { backgroundColor: '#111827', fontColor: '#dbeafe' },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'bar-chart': {
    type: 'bar-chart',
    title: 'Bar Chart',
    defaultLayout: { width: 560, height: 320 },
    defaultProps: { title: 'Category Ranking', chartType: 'bar', showLegend: false, showAxis: true, showGrid: true },
    defaultStyle: { backgroundColor: '#111827', fontColor: '#dbeafe' },
    propertyGroups: ['basic', 'data', 'style', 'analysis'],
    renderer: EChartRenderer,
  },
  'pie-chart': {
    type: 'pie-chart',
    title: 'Pie Chart',
    defaultLayout: { width: 360, height: 300 },
    defaultProps: { title: 'Question Type Distribution', chartType: 'pie', showLegend: true },
    defaultStyle: { backgroundColor: '#111827', fontColor: '#dbeafe' },
    propertyGroups: ['basic', 'data', 'style'],
    renderer: EChartRenderer,
  },
  table: {
    type: 'table',
    title: 'Table',
    defaultLayout: { width: 640, height: 300 },
    defaultProps: { title: 'Question Details' },
    defaultStyle: { backgroundColor: '#111827', fontColor: '#dbeafe' },
    propertyGroups: ['basic', 'data', 'style'],
    renderer: TableRenderer,
  },
  text: {
    type: 'text',
    title: 'Text',
    defaultLayout: { width: 360, height: 80 },
    defaultProps: { text: 'AI Q&A Operations Screen' },
    defaultStyle: { fontSize: 32, fontColor: '#f8fafc', fontWeight: 700 },
    propertyGroups: ['basic', 'style'],
    renderer: TextRenderer,
  },
  image: {
    type: 'image',
    title: 'Image',
    defaultLayout: { width: 240, height: 160 },
    defaultProps: { src: '' },
    defaultStyle: { objectFit: 'cover' },
    propertyGroups: ['basic', 'style'],
    renderer: ImageRenderer,
  },
  decoration: {
    type: 'decoration',
    title: 'Decoration',
    defaultLayout: { width: 360, height: 180 },
    defaultProps: { variant: 'border-panel' },
    defaultStyle: { borderColor: '#38bdf8', backgroundColor: 'rgba(15, 23, 42, 0.72)' },
    propertyGroups: ['basic', 'style'],
    renderer: DecorationRenderer,
  },
}

export function createComponent(type: ComponentType, x = 80, y = 80, zIndex = 1): DashboardComponent {
  const definition = componentRegistry[type]
  return {
    id: nanoid(),
    type,
    name: definition.title,
    layout: {
      x,
      y,
      width: definition.defaultLayout.width,
      height: definition.defaultLayout.height,
      zIndex,
      visible: true,
    },
    props: structuredClone(definition.defaultProps),
    style: structuredClone(definition.defaultStyle),
  }
}
```

- [ ] **Step 3: Create renderers**

Create `apps/web/src/features/big-screen/components/renderers/MetricCardRenderer.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import type { ComponentData } from '../../data-adapters/dataAdapter.types'

defineProps<{
  component: DashboardComponent
  data: ComponentData | null
  loading?: boolean
  error?: string | null
}>()
</script>

<template>
  <section class="metric-card" :style="{ background: String(component.style.backgroundColor), color: String(component.style.fontColor) }">
    <div class="metric-title">{{ component.props.title }}</div>
    <div v-if="loading" class="metric-skeleton" />
    <div v-else-if="error" class="metric-error">{{ error }}</div>
    <template v-else-if="data?.kind === 'metric'">
      <div class="metric-value">{{ data.value.toLocaleString() }}</div>
      <div class="metric-trend">+{{ data.trend }}%</div>
    </template>
    <div v-else class="metric-empty">No data</div>
  </section>
</template>

<style scoped>
.metric-card {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  padding: 18px;
}
.metric-title {
  color: rgba(226, 232, 240, 0.78);
  font-size: 16px;
}
.metric-value {
  margin-top: 18px;
  font-size: 48px;
  font-weight: 800;
}
.metric-trend {
  margin-top: 8px;
  color: #86efac;
}
.metric-skeleton,
.metric-empty,
.metric-error {
  margin-top: 24px;
  color: rgba(226, 232, 240, 0.72);
}
.metric-skeleton {
  width: 70%;
  height: 52px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.18);
}
</style>
```

Create `apps/web/src/features/big-screen/components/renderers/EChartRenderer.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart, { THEME_KEY } from 'vue-echarts'
import { provide } from 'vue'
import { use } from 'echarts/core'
import type { ComponentData } from '../../data-adapters/dataAdapter.types'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])
provide(THEME_KEY, 'dark')

const props = defineProps<{
  component: DashboardComponent
  data: ComponentData | null
  loading?: boolean
  error?: string | null
}>()

const option = computed(() => {
  const chartType = String(props.component.props.chartType ?? props.component.type)
  if (props.data?.kind === 'time-series') {
    return {
      backgroundColor: props.component.style.backgroundColor,
      textStyle: { color: props.component.style.fontColor },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 24, top: 48, bottom: 36 },
      xAxis: { type: 'category', data: props.data.rows.map((row) => row.date) },
      yAxis: { type: 'value' },
      series: [{ type: chartType === 'bar' ? 'bar' : 'line', data: props.data.rows.map((row) => row.count), smooth: true }],
    }
  }
  if (props.data?.kind === 'category') {
    return {
      backgroundColor: props.component.style.backgroundColor,
      tooltip: { trigger: 'item' },
      legend: { bottom: 4 },
      series: [{ type: chartType === 'pie' ? 'pie' : 'bar', data: props.data.rows.map((row) => ({ name: row.category, value: row.value })) }],
    }
  }
  return { backgroundColor: props.component.style.backgroundColor, series: [] }
})
</script>

<template>
  <div class="chart-shell">
    <div class="chart-title">{{ component.props.title }}</div>
    <div v-if="loading" class="chart-state">Loading data</div>
    <div v-else-if="error" class="chart-state">{{ error }}</div>
    <VChart v-else class="chart" :option="option" autoresize />
  </div>
</template>

<style scoped>
.chart-shell {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  overflow: hidden;
  background: #111827;
}
.chart-title {
  position: absolute;
  z-index: 1;
  padding: 12px 14px;
  color: #dbeafe;
  font-weight: 700;
}
.chart {
  width: 100%;
  height: 100%;
}
.chart-state {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #cbd5e1;
}
</style>
```

Create the remaining renderers with focused display behavior:

`TableRenderer.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import type { ComponentData } from '../../data-adapters/dataAdapter.types'

defineProps<{ component: DashboardComponent; data: ComponentData | null; loading?: boolean; error?: string | null }>()
</script>

<template>
  <section class="table-panel">
    <h3>{{ component.props.title }}</h3>
    <div v-if="loading" class="state">Loading rows</div>
    <div v-else-if="error" class="state">{{ error }}</div>
    <table v-else-if="data?.kind === 'table'">
      <thead><tr><th v-for="column in data.columns" :key="column">{{ column }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, rowIndex) in data.rows" :key="rowIndex">
          <td v-for="column in data.columns" :key="column">{{ row[column] }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="state">No rows</div>
  </section>
</template>

<style scoped>
.table-panel { width: 100%; height: 100%; padding: 14px; border-radius: 8px; background: #111827; color: #dbeafe; overflow: hidden; }
h3 { margin: 0 0 12px; font-size: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 9px 10px; border-bottom: 1px solid rgba(148, 163, 184, 0.22); text-align: left; }
.state { display: grid; height: calc(100% - 32px); place-items: center; color: #94a3b8; }
</style>
```

`TextRenderer.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
defineProps<{ component: DashboardComponent }>()
</script>

<template>
  <div class="text-renderer" :style="{ color: String(component.style.fontColor), fontSize: `${component.style.fontSize}px`, fontWeight: String(component.style.fontWeight) }">
    {{ component.props.text }}
  </div>
</template>

<style scoped>
.text-renderer { width: 100%; height: 100%; display: flex; align-items: center; overflow: hidden; }
</style>
```

`ImageRenderer.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
defineProps<{ component: DashboardComponent }>()
</script>

<template>
  <div class="image-renderer">
    <img v-if="component.props.src" :src="String(component.props.src)" alt="" />
    <div v-else class="empty">Image</div>
  </div>
</template>

<style scoped>
.image-renderer { width: 100%; height: 100%; border-radius: 8px; overflow: hidden; background: rgba(148, 163, 184, 0.12); }
img { width: 100%; height: 100%; object-fit: cover; display: block; }
.empty { display: grid; width: 100%; height: 100%; place-items: center; color: #94a3b8; }
</style>
```

`DecorationRenderer.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
defineProps<{ component: DashboardComponent }>()
</script>

<template>
  <div class="decoration" :style="{ borderColor: String(component.style.borderColor), background: String(component.style.backgroundColor) }" />
</template>

<style scoped>
.decoration { width: 100%; height: 100%; border: 1px solid; border-radius: 8px; box-shadow: inset 0 0 24px rgba(56, 189, 248, 0.18); }
</style>
```

- [ ] **Step 4: Run build**

Run:

```bash
npm --workspace apps/web run build
```

Expected: web app builds with all renderer imports resolved.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/big-screen
git commit -m "feat: add big screen component registry"
```

---

## Task 6: Build Designer Shell, Canvas, Toolbar, and Property Panel

**Files:**
- Create: `apps/web/src/features/big-screen/designer/DesignerShell.vue`
- Create: `apps/web/src/features/big-screen/designer/DesignerToolbar.vue`
- Create: `apps/web/src/features/big-screen/designer/ComponentPanel.vue`
- Create: `apps/web/src/features/big-screen/designer/CanvasStage.vue`
- Create: `apps/web/src/features/big-screen/designer/CanvasComponent.vue`
- Create: `apps/web/src/features/big-screen/designer/PropertyPanel.vue`

- [ ] **Step 1: Create designer shell**

Create `apps/web/src/features/big-screen/designer/DesignerShell.vue`:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CanvasStage from './CanvasStage.vue'
import ComponentPanel from './ComponentPanel.vue'
import DesignerToolbar from './DesignerToolbar.vue'
import PropertyPanel from './PropertyPanel.vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const route = useRoute()
const store = useDashboardDesignerStore()

onMounted(async () => {
  const id = String(route.params.id)
  if (id === 'new') await store.createDashboard()
  else await store.loadDashboard(id)
})
</script>

<template>
  <main class="designer-shell">
    <DesignerToolbar />
    <section class="designer-body">
      <ComponentPanel />
      <CanvasStage />
      <PropertyPanel />
    </section>
    <div v-if="store.error" class="error-toast">{{ store.error }}</div>
  </main>
</template>

<style scoped>
.designer-shell { display: grid; grid-template-rows: 52px 1fr; height: 100vh; background: var(--color-page); }
.designer-body { display: grid; grid-template-columns: 220px 1fr 320px; min-height: 0; }
.error-toast { position: fixed; right: 18px; bottom: 18px; padding: 12px 14px; border-radius: 8px; background: #fee2e2; color: #991b1b; box-shadow: var(--shadow-panel); }
</style>
```

- [ ] **Step 2: Create toolbar and component panel**

Create `apps/web/src/features/big-screen/designer/DesignerToolbar.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const store = useDashboardDesignerStore()
const runtimeHref = computed(() => (store.dashboardId ? `/runtime/${store.dashboardId}` : '#'))
</script>

<template>
  <header class="toolbar">
    <strong>{{ store.dashboardName }}</strong>
    <div class="toolbar-actions">
      <button @click="store.saveDraft" :disabled="store.isSaving">{{ store.isSaving ? 'Saving' : 'Save' }}</button>
      <button @click="store.undo">Undo</button>
      <button @click="store.redo">Redo</button>
      <label>Zoom <input v-model.number="store.zoom" type="range" min="0.2" max="1.5" step="0.05" /></label>
      <a :href="runtimeHref" target="_blank">Preview</a>
    </div>
  </header>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-bottom: 1px solid var(--color-border); background: var(--color-panel); }
.toolbar-actions { display: flex; align-items: center; gap: 8px; }
button, a { height: 34px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 7px; background: white; color: var(--color-text); text-decoration: none; cursor: pointer; }
button:disabled { opacity: 0.55; cursor: not-allowed; }
label { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); }
</style>
```

Create `apps/web/src/features/big-screen/designer/ComponentPanel.vue`:

```vue
<script setup lang="ts">
import type { ComponentType } from '@analytics/shared'
import { computed } from 'vue'
import { componentRegistry, createComponent } from '../components/registry'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const store = useDashboardDesignerStore()
const definitions = computed(() => Object.values(componentRegistry))

function add(type: ComponentType) {
  const nextZIndex = Math.max(0, ...store.schema.components.map((component) => component.layout.zIndex)) + 1
  store.addComponent(createComponent(type, 120, 120, nextZIndex))
}
</script>

<template>
  <aside class="component-panel">
    <h2>Components</h2>
    <button v-for="definition in definitions" :key="definition.type" @click="add(definition.type)">
      {{ definition.title }}
    </button>
  </aside>
</template>

<style scoped>
.component-panel { padding: 14px; border-right: 1px solid var(--color-border); background: var(--color-panel); overflow: auto; }
h2 { margin: 0 0 12px; font-size: 15px; }
button { width: 100%; margin-bottom: 8px; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-panel-muted); text-align: left; cursor: pointer; }
button:hover, button:focus-visible { border-color: var(--color-accent); background: var(--color-accent-soft); }
</style>
```

- [ ] **Step 3: Create canvas stage and component wrapper**

Create `apps/web/src/features/big-screen/designer/CanvasStage.vue`:

```vue
<script setup lang="ts">
import CanvasComponent from './CanvasComponent.vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const store = useDashboardDesignerStore()
</script>

<template>
  <section class="canvas-workspace">
    <div
      class="canvas-stage"
      :style="{
        width: `${store.schema.canvas.width}px`,
        height: `${store.schema.canvas.height}px`,
        transform: `scale(${store.zoom})`,
        background: store.schema.canvas.background.type === 'color' ? store.schema.canvas.background.value : '#0b1220',
      }"
      @click="store.selectedComponentId = null"
    >
      <CanvasComponent v-for="component in store.schema.components" :key="component.id" :component="component" />
    </div>
  </section>
</template>

<style scoped>
.canvas-workspace { min-width: 0; min-height: 0; overflow: auto; display: grid; place-items: center; padding: 40px; background: #dfe7f2; }
.canvas-stage { position: relative; flex: none; transform-origin: center center; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24); }
</style>
```

Create `apps/web/src/features/big-screen/designer/CanvasComponent.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed } from 'vue'
import { componentRegistry } from '../components/registry'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const props = defineProps<{ component: DashboardComponent }>()
const store = useDashboardDesignerStore()
const definition = computed(() => componentRegistry[props.component.type])
const isSelected = computed(() => store.selectedComponentId === props.component.id)

function select(event: MouseEvent) {
  event.stopPropagation()
  store.selectedComponentId = props.component.id
}
</script>

<template>
  <div
    class="canvas-component"
    :class="{ selected: isSelected, locked: component.layout.locked }"
    :style="{
      left: `${component.layout.x}px`,
      top: `${component.layout.y}px`,
      width: `${component.layout.width}px`,
      height: `${component.layout.height}px`,
      zIndex: component.layout.zIndex,
    }"
    @click="select"
  >
    <component :is="definition.renderer" :component="component" :data="null" />
  </div>
</template>

<style scoped>
.canvas-component { position: absolute; cursor: move; }
.canvas-component.selected { outline: 2px solid #60a5fa; outline-offset: 2px; }
.canvas-component.locked { cursor: not-allowed; opacity: 0.85; }
</style>
```

- [ ] **Step 4: Add Moveable controls**

Modify `CanvasStage.vue` to include `Moveable` after component rendering:

```vue
<script setup lang="ts">
import Moveable from '@daybrush/vue3-moveable'
import { computed } from 'vue'
import CanvasComponent from './CanvasComponent.vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const store = useDashboardDesignerStore()
const selectedTarget = computed(() =>
  store.selectedComponentId ? `[data-component-id="${store.selectedComponentId}"]` : null,
)
</script>
```

Modify the `CanvasComponent.vue` root element to add `data-component-id`:

```vue
  <div
    class="canvas-component"
    :data-component-id="component.id"
```

Add this inside `.canvas-stage` in `CanvasStage.vue`:

```vue
      <Moveable
        v-if="selectedTarget"
        :target="selectedTarget"
        :draggable="true"
        :resizable="true"
        :snappable="true"
        :bounds="{ left: 0, top: 0, right: store.schema.canvas.width, bottom: store.schema.canvas.height }"
        @dragEnd="(event) => {
          const component = store.selectedComponent
          if (!component || component.layout.locked) return
          store.updateComponent(component.id, {
            layout: {
              ...component.layout,
              x: component.layout.x + event.lastEvent.dist[0] / store.zoom,
              y: component.layout.y + event.lastEvent.dist[1] / store.zoom,
            },
          })
        }"
        @resizeEnd="(event) => {
          const component = store.selectedComponent
          if (!component || component.layout.locked) return
          store.updateComponent(component.id, {
            layout: {
              ...component.layout,
              width: Math.max(24, event.lastEvent.width / store.zoom),
              height: Math.max(24, event.lastEvent.height / store.zoom),
            },
          })
        }"
      />
```

- [ ] **Step 5: Create property panel**

Create `apps/web/src/features/big-screen/designer/PropertyPanel.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const store = useDashboardDesignerStore()
const component = computed(() => store.selectedComponent)

function updateProps(key: string, value: unknown) {
  if (!component.value) return
  store.updateComponent(component.value.id, {
    props: { ...component.value.props, [key]: value },
  })
}

function updateStyle(key: string, value: unknown) {
  if (!component.value) return
  store.updateComponent(component.value.id, {
    style: { ...component.value.style, [key]: value },
  })
}
</script>

<template>
  <aside class="property-panel">
    <template v-if="component">
      <h2>{{ component.name }}</h2>
      <section>
        <label>Title<input :value="component.props.title ?? component.props.text ?? ''" @input="updateProps(component.type === 'text' ? 'text' : 'title', ($event.target as HTMLInputElement).value)" /></label>
        <label>Background<input type="color" :value="String(component.style.backgroundColor ?? '#111827')" @input="updateStyle('backgroundColor', ($event.target as HTMLInputElement).value)" /></label>
        <label>Font Color<input type="color" :value="String(component.style.fontColor ?? '#dbeafe')" @input="updateStyle('fontColor', ($event.target as HTMLInputElement).value)" /></label>
        <label>Locked<input type="checkbox" :checked="component.layout.locked" @change="store.updateComponent(component.id, { layout: { ...component.layout, locked: ($event.target as HTMLInputElement).checked } })" /></label>
      </section>
      <button class="danger" @click="store.removeSelectedComponent">Delete component</button>
    </template>
    <div v-else class="empty">Select a component to configure it.</div>
  </aside>
</template>

<style scoped>
.property-panel { padding: 14px; border-left: 1px solid var(--color-border); background: var(--color-panel); overflow: auto; }
h2 { margin: 0 0 14px; font-size: 16px; }
section { display: grid; gap: 12px; }
label { display: grid; gap: 6px; color: var(--color-text-muted); font-size: 13px; }
input { min-height: 34px; border: 1px solid var(--color-border); border-radius: 7px; padding: 0 8px; }
.danger { margin-top: 16px; width: 100%; height: 36px; border: 1px solid #fecaca; border-radius: 7px; background: #fff1f2; color: #be123c; }
.empty { color: var(--color-text-muted); }
</style>
```

- [ ] **Step 6: Run manual and build checks**

Run:

```bash
npm run dev
```

Open `http://localhost:5173/big-screens/new`.

Expected:

- The designer shell loads.
- Component buttons appear.
- Clicking a component adds it to the canvas.
- Selecting a component shows the property panel.
- Save button persists the draft.

Then run:

```bash
npm --workspace apps/web run build
```

Expected: web build passes.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/big-screen
git commit -m "feat: add big screen designer canvas"
```

---

## Task 7: Add Runtime Renderer and Proportional Scaling

**Files:**
- Create: `apps/web/src/features/big-screen/runtime/runtime-scale.ts`
- Create: `apps/web/src/features/big-screen/runtime/RuntimeScaler.vue`
- Create: `apps/web/src/features/big-screen/runtime/RuntimeComponent.vue`
- Create: `apps/web/src/features/big-screen/runtime/RuntimeScreen.vue`
- Test: `apps/web/src/features/big-screen/runtime/runtime-scaler.test.ts`

- [ ] **Step 1: Write scaling test**

Create `apps/web/src/features/big-screen/runtime/runtime-scaler.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { calculateFitScreenScale } from './runtime-scale'

describe('calculateFitScreenScale', () => {
  test('uses the smaller ratio to preserve the design aspect ratio', () => {
    expect(calculateFitScreenScale({ viewportWidth: 1366, viewportHeight: 768, canvasWidth: 1920, canvasHeight: 1080 })).toBeCloseTo(0.711, 2)
    expect(calculateFitScreenScale({ viewportWidth: 2560, viewportHeight: 1080, canvasWidth: 1920, canvasHeight: 1080 })).toBe(1)
  })
})
```

- [ ] **Step 2: Create scaler pure function**

Create `apps/web/src/features/big-screen/runtime/runtime-scale.ts`:

```ts
export function calculateFitScreenScale(input: {
  viewportWidth: number
  viewportHeight: number
  canvasWidth: number
  canvasHeight: number
}): number {
  return Math.min(input.viewportWidth / input.canvasWidth, input.viewportHeight / input.canvasHeight)
}
```

- [ ] **Step 3: Create scaler Vue component**

Create `apps/web/src/features/big-screen/runtime/RuntimeScaler.vue`:

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { calculateFitScreenScale } from './runtime-scale'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
  background: string
}>()

const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

function updateViewport() {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

onMounted(() => window.addEventListener('resize', updateViewport))
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

const scale = computed(() =>
  calculateFitScreenScale({
    viewportWidth: viewportWidth.value,
    viewportHeight: viewportHeight.value,
    canvasWidth: props.canvasWidth,
    canvasHeight: props.canvasHeight,
  }),
)
</script>

<template>
  <div class="runtime-viewport" :style="{ background }">
    <div
      class="runtime-canvas"
      :style="{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        transform: `scale(${scale})`,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.runtime-viewport { width: 100vw; height: 100vh; overflow: hidden; display: grid; place-items: center; }
.runtime-canvas { position: relative; flex: none; transform-origin: center center; }
</style>
```

- [ ] **Step 4: Create runtime component and screen**

Create `apps/web/src/features/big-screen/runtime/RuntimeComponent.vue`:

```vue
<script setup lang="ts">
import type { DashboardComponent } from '@analytics/shared'
import { computed, onMounted, ref } from 'vue'
import { componentRegistry } from '../components/registry'
import { mockDataAdapter } from '../data-adapters/mockDataAdapter'
import type { ComponentData, DataLoadState } from '../data-adapters/dataAdapter.types'
import type { DashboardSchema } from '@analytics/shared'

const props = defineProps<{ component: DashboardComponent; schema: DashboardSchema }>()
const definition = computed(() => componentRegistry[props.component.type])
const state = ref<DataLoadState>({ status: 'idle', data: null, error: null })

async function loadData() {
  const bindingId = props.component.dataBindingId
  if (!bindingId) return
  const binding = props.schema.dataBindings[bindingId]
  if (!binding) return
  const previous: ComponentData | null = state.value.data
  state.value = { status: 'loading', data: previous, error: null }
  try {
    const data = await mockDataAdapter.query(binding)
    state.value = { status: 'success', data, error: null }
  } catch (error) {
    state.value = { status: 'error', data: previous, error: error instanceof Error ? error.message : 'Failed to load data' }
  }
}

onMounted(loadData)
</script>

<template>
  <div
    class="runtime-component"
    :style="{
      left: `${component.layout.x}px`,
      top: `${component.layout.y}px`,
      width: `${component.layout.width}px`,
      height: `${component.layout.height}px`,
      zIndex: component.layout.zIndex,
    }"
  >
    <component :is="definition.renderer" :component="component" :data="state.data" :loading="state.status === 'loading'" :error="state.status === 'error' ? state.error : null" />
  </div>
</template>

<style scoped>
.runtime-component { position: absolute; }
</style>
```

Create `apps/web/src/features/big-screen/runtime/RuntimeScreen.vue`:

```vue
<script setup lang="ts">
import type { DashboardSchema } from '@analytics/shared'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { bigScreenApi } from '../api/bigScreenApi'
import RuntimeComponent from './RuntimeComponent.vue'
import RuntimeScaler from './RuntimeScaler.vue'

const route = useRoute()
const isLoading = ref(true)
const error = ref<string | null>(null)
const schema = ref<DashboardSchema | null>(null)
const name = ref('Runtime Screen')

const background = computed(() => {
  const canvasBackground = schema.value?.canvas.background
  return canvasBackground?.type === 'color' ? canvasBackground.value : '#0b1220'
})

onMounted(async () => {
  try {
    const id = String(route.params.id)
    const runtime = await bigScreenApi.getRuntime(id)
    name.value = runtime.name
    schema.value = runtime.schema
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load runtime screen'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div v-if="isLoading" class="runtime-state">Loading runtime screen</div>
  <div v-else-if="error" class="runtime-state">{{ error }}</div>
  <RuntimeScaler v-else-if="schema" :canvas-width="schema.canvas.width" :canvas-height="schema.canvas.height" :background="background">
    <RuntimeComponent v-for="component in schema.components.filter((item) => item.layout.visible !== false)" :key="component.id" :component="component" :schema="schema" />
  </RuntimeScaler>
</template>

<style scoped>
.runtime-state { display: grid; width: 100vw; height: 100vh; place-items: center; background: #0b1220; color: #dbeafe; }
</style>
```

- [ ] **Step 5: Run scaling test and build**

Run:

```bash
npm --workspace apps/web run test -- runtime-scaler
npm --workspace apps/web run build
```

Expected: scaling test passes and runtime build passes.

- [ ] **Step 6: Manual runtime verification**

Run:

```bash
npm run dev
```

Open `http://localhost:5173/big-screens/new`, add at least one metric card, save, publish through the API with:

```bash
curl -X POST http://localhost:4000/api/big-screens/<dashboard-id>/publish -H "Content-Type: application/json" -d "{}"
```

Open `http://localhost:5173/runtime/<dashboard-id>`.

Expected: runtime screen renders full viewport, centered, with proportional scaling.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/big-screen
git commit -m "feat: add runtime big screen renderer"
```

---

## Task 8: Add Presets and Publish Workflow Polish

**Files:**
- Create: `apps/web/src/features/big-screen/presets/presets.ts`
- Modify: `apps/web/src/features/big-screen/designer/DesignerToolbar.vue`
- Modify: `apps/web/src/features/big-screen/designer/ComponentPanel.vue`
- Modify: `apps/web/src/features/big-screen/stores/useDashboardDesignerStore.ts`

- [ ] **Step 1: Create first preset**

Create `apps/web/src/features/big-screen/presets/presets.ts`:

```ts
import type { DashboardSchema } from '@analytics/shared'

export const aiOperationsPreset: DashboardSchema = {
  version: '1.0',
  canvas: {
    width: 1920,
    height: 1080,
    background: { type: 'color', value: '#0b1220' },
    scaleMode: 'fit-screen',
  },
  theme: {
    name: 'AI Operations',
    colors: ['#60a5fa', '#34d399', '#f59e0b', '#f472b6'],
    fontFamily: 'Inter',
  },
  dataBindings: {
    metricTotal: {
      id: 'metricTotal',
      sourceType: 'mock',
      query: { metrics: ['count'] },
    },
    trendQuestions: {
      id: 'trendQuestions',
      sourceType: 'mock',
      query: { dimensions: ['date'], metrics: ['count'] },
    },
    categoryTypes: {
      id: 'categoryTypes',
      sourceType: 'mock',
      query: { dimensions: ['category'], metrics: ['count'] },
    },
    detailRows: {
      id: 'detailRows',
      sourceType: 'mock',
      query: { dimensions: ['table'], metrics: ['count'] },
    },
  },
  refresh: { mode: 'interval', intervalSeconds: 60 },
  components: [
    {
      id: 'title',
      type: 'text',
      name: 'Screen Title',
      layout: { x: 60, y: 34, width: 920, height: 72, zIndex: 1, visible: true },
      props: { text: 'AI Q&A Operations Command Center' },
      style: { fontSize: 38, fontColor: '#f8fafc', fontWeight: 800 },
    },
    {
      id: 'metric-total',
      type: 'metric-card',
      name: 'Total Requests',
      layout: { x: 60, y: 140, width: 360, height: 190, zIndex: 2, visible: true },
      props: { title: 'Total Q&A Requests' },
      style: { backgroundColor: '#111827', fontColor: '#f8fafc', accentColor: '#60a5fa' },
      dataBindingId: 'metricTotal',
    },
    {
      id: 'trend',
      type: 'line-chart',
      name: 'Question Trend',
      layout: { x: 460, y: 140, width: 760, height: 380, zIndex: 2, visible: true },
      props: { title: 'Question Trend', chartType: 'line', showLegend: true, showAxis: true, showGrid: true },
      style: { backgroundColor: '#111827', fontColor: '#dbeafe' },
      dataBindingId: 'trendQuestions',
    },
    {
      id: 'category',
      type: 'pie-chart',
      name: 'Question Types',
      layout: { x: 1260, y: 140, width: 560, height: 380, zIndex: 2, visible: true },
      props: { title: 'Question Type Distribution', chartType: 'pie', showLegend: true },
      style: { backgroundColor: '#111827', fontColor: '#dbeafe' },
      dataBindingId: 'categoryTypes',
    },
    {
      id: 'details',
      type: 'table',
      name: 'Question Details',
      layout: { x: 60, y: 560, width: 880, height: 360, zIndex: 2, visible: true },
      props: { title: 'Question Details' },
      style: { backgroundColor: '#111827', fontColor: '#dbeafe' },
      dataBindingId: 'detailRows',
    },
  ],
}
```

- [ ] **Step 2: Add store actions for preset and publish**

Modify `useDashboardDesignerStore.ts` by adding actions:

```ts
    applyPreset(schema: DashboardSchema) {
      const history = useDashboardHistoryStore()
      history.push(this.schema)
      this.schema = structuredClone(schema)
      this.selectedComponentId = null
    },
    async publish() {
      if (!this.dashboardId) return
      this.isSaving = true
      try {
        this.applyDashboard(await bigScreenApi.publish(this.dashboardId))
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to publish dashboard'
      } finally {
        this.isSaving = false
      }
    },
```

- [ ] **Step 3: Add preset and publish controls**

Modify `DesignerToolbar.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import { aiOperationsPreset } from '../presets/presets'

const store = useDashboardDesignerStore()
const runtimeHref = computed(() => (store.dashboardId ? `/runtime/${store.dashboardId}` : '#'))
</script>

<template>
  <header class="toolbar">
    <strong>{{ store.dashboardName }}</strong>
    <div class="toolbar-actions">
      <button @click="store.applyPreset(aiOperationsPreset)">Preset</button>
      <button @click="store.saveDraft" :disabled="store.isSaving">{{ store.isSaving ? 'Saving' : 'Save' }}</button>
      <button @click="store.publish" :disabled="store.isSaving">Publish</button>
      <button @click="store.undo">Undo</button>
      <button @click="store.redo">Redo</button>
      <label>Zoom <input v-model.number="store.zoom" type="range" min="0.2" max="1.5" step="0.05" /></label>
      <a :href="runtimeHref" target="_blank">Preview</a>
    </div>
  </header>
</template>
```

Keep the existing scoped CSS from Task 6.

- [ ] **Step 4: Run manual preset verification**

Run:

```bash
npm run dev
```

Open `http://localhost:5173/big-screens/new`.

Expected:

- Click `Preset`; the canvas fills with the AI operations layout.
- Click `Save`.
- Click `Publish`.
- Click `Preview`; runtime page renders the preset proportionally.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/big-screen
git commit -m "feat: add big screen preset workflow"
```

---

## Task 9: Add Critical Tests and Playwright Flow

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/big-screen-flow.spec.ts`
- Modify: `apps/web/package.json`
- Modify: `package.json`

- [ ] **Step 1: Create Playwright config**

Create `apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm --workspace apps/api run dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '../..',
    },
    {
      command: 'npm --workspace apps/web run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120000,
      cwd: '../..',
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'large-screen', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],
})
```

- [ ] **Step 2: Create E2E flow**

Create `apps/web/e2e/big-screen-flow.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('creates, presets, saves, publishes, and previews a big screen', async ({ page }) => {
  await page.goto('/big-screens/new')

  await expect(page.getByText('Components')).toBeVisible()
  await page.getByRole('button', { name: 'Preset' }).click()
  await expect(page.getByText('AI Q&A Operations Command Center')).toBeVisible()

  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('button', { name: 'Publish' }).click()

  const preview = page.getByRole('link', { name: 'Preview' })
  await expect(preview).toBeVisible()

  const href = await preview.getAttribute('href')
  expect(href).toContain('/runtime/')

  await page.goto(href!)
  await expect(page.getByText('AI Q&A Operations Command Center')).toBeVisible()
  await expect(page.getByText('Total Q&A Requests')).toBeVisible()
})
```

- [ ] **Step 3: Install Playwright browsers**

Run:

```bash
npx playwright install chromium
```

Expected: Chromium test browser is installed.

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test
npm run build
npm run e2e
```

Expected: unit tests, builds, and Playwright flow pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e package.json apps/web/package.json package-lock.json
git commit -m "test: cover big screen designer flow"
```

---

## Task 10: Complete Dashboard Library, Version, Share, and Destructive Workflow

**Files:**
- Create: `apps/api/tests/dashboard.workflow.test.ts`
- Create: `apps/api/src/dashboards/dashboard.permissions.ts`
- Modify: `apps/api/src/dashboards/dashboard.routes.ts`
- Modify: `apps/web/src/features/big-screen/api/bigScreenApi.ts`
- Create: `apps/web/src/features/big-screen/designer/DashboardList.vue`
- Modify: `apps/web/src/router.ts`

- [ ] **Step 1: Write API workflow tests**

Create `apps/api/tests/dashboard.workflow.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'

describe('dashboard workflow routes', () => {
  test('copies, publishes, unpublishes, and deletes a dashboard', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Workflow Source' })
      .expect(201)

    const copied = await request(app)
      .post(`/api/big-screens/${created.body.data.id}/copy`)
      .expect(201)

    expect(copied.body.data.name).toBe('Workflow Source Copy')

    await request(app)
      .post(`/api/big-screens/${copied.body.data.id}/publish`)
      .send({})
      .expect(200)

    const unpublished = await request(app)
      .post(`/api/big-screens/${copied.body.data.id}/unpublish`)
      .send({})
      .expect(200)

    expect(unpublished.body.data.status).toBe('draft')

    await request(app)
      .delete(`/api/big-screens/${copied.body.data.id}`)
      .expect(200)
  })

  test('creates a share link for a published dashboard', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Shared Screen' })
      .expect(201)

    await request(app)
      .post(`/api/big-screens/${created.body.data.id}/publish`)
      .send({})
      .expect(200)

    const share = await request(app)
      .post(`/api/big-screens/${created.body.data.id}/share-links`)
      .send({ accessScope: 'public-link' })
      .expect(201)

    expect(share.body.data.token).toHaveLength(21)

    const runtime = await request(app)
      .get(`/api/public/big-screens/${share.body.data.token}`)
      .expect(200)

    expect(runtime.body.data.name).toBe('Shared Screen')
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm --workspace apps/api run test -- dashboard.workflow
```

Expected: FAIL because workflow endpoints do not exist.

- [ ] **Step 3: Add workflow route handlers**

Create `apps/api/src/dashboards/dashboard.permissions.ts`:

```ts
import { canEdit, canPublish, type DashboardPermission } from '@analytics/shared'
import { prisma } from '../db.js'
import { DEFAULT_ACTOR_ID } from './dashboard.repository.js'

export async function getActorDashboardPermission(dashboardId: string): Promise<DashboardPermission | null> {
  const permission = await prisma.dashboardPermission.findFirst({
    where: {
      dashboardId,
      subjectType: 'user',
      subjectId: DEFAULT_ACTOR_ID,
    },
  })

  if (!permission) return null
  if (permission.permission === 'view' || permission.permission === 'edit' || permission.permission === 'owner') {
    return permission.permission
  }
  return null
}

export async function actorCanEditDashboard(dashboardId: string): Promise<boolean> {
  const permission = await getActorDashboardPermission(dashboardId)
  return permission ? canEdit(permission) : false
}

export async function actorCanPublishDashboard(dashboardId: string): Promise<boolean> {
  const permission = await getActorDashboardPermission(dashboardId)
  return permission ? canPublish(permission) : false
}
```

Modify imports in `apps/api/src/dashboards/dashboard.routes.ts`:

```ts
import { actorCanEditDashboard, actorCanPublishDashboard } from './dashboard.permissions.js'
```

Modify the existing `GET /big-screens` handler to hide archived dashboards:

```ts
dashboardRoutes.get('/big-screens', async (_req, res) => {
  const dashboards = await prisma.dashboard.findMany({
    where: { status: { not: 'archived' } },
    orderBy: { updatedAt: 'desc' },
  })
  res.json(
    ok(
      dashboards.map((dashboard) => ({
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        status: dashboard.status,
        updatedAt: dashboard.updatedAt,
        publishedAt: dashboard.publishedAt,
      })),
    ),
  )
})
```

Add these permission checks to existing mutating route handlers:

```ts
if (!(await actorCanEditDashboard(req.params.id))) return sendForbidden(res)
```

Use the edit check in:

- `PATCH /big-screens/:id/draft`
- `POST /big-screens/:id/copy`
- `DELETE /big-screens/:id`

Add this owner check to publish-level route handlers:

```ts
if (!(await actorCanPublishDashboard(req.params.id))) return sendForbidden(res, 'Only dashboard owners can publish or manage share links')
```

Use the owner check in:

- `POST /big-screens/:id/publish`
- `POST /big-screens/:id/unpublish`
- `POST /big-screens/:id/versions/:version/rollback`
- `POST /big-screens/:id/share-links`

Append these handlers to `apps/api/src/dashboards/dashboard.routes.ts`:

```ts
dashboardRoutes.post('/big-screens/:id/copy', async (req, res) => {
  const source = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!source) return sendNotFound(res)

  const copied = await prisma.dashboard.create({
    data: {
      id: nanoid(),
      name: `${source.name} Copy`,
      description: source.description,
      ownerId: DEFAULT_ACTOR_ID,
      workspaceId: source.workspaceId,
      status: 'draft',
      draftSchema: source.draftSchema,
      permissions: {
        create: {
          id: nanoid(),
          subjectType: 'user',
          subjectId: DEFAULT_ACTOR_ID,
          permission: 'owner',
        },
      },
    },
  })
  await recordAudit('dashboard.copy', copied.id, DEFAULT_ACTOR_ID, { sourceId: source.id })
  res.status(201).json(ok({ ...copied, draftSchema: parseSchema(copied.draftSchema), publishedSchema: null }))
})

dashboardRoutes.delete('/big-screens/:id', async (req, res) => {
  const existing = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!existing) return sendNotFound(res)

  await prisma.dashboard.update({
    where: { id: req.params.id },
    data: { status: 'archived' },
  })
  await recordAudit('dashboard.archive', req.params.id, DEFAULT_ACTOR_ID, { previousStatus: existing.status })
  res.json(ok({ id: req.params.id, status: 'archived' }))
})

dashboardRoutes.post('/big-screens/:id/unpublish', async (req, res) => {
  const existing = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!existing) return sendNotFound(res)

  await prisma.dashboard.update({
    where: { id: req.params.id },
    data: {
      status: 'draft',
      publishedSchema: null,
      publishedAt: null,
    },
  })
  await recordAudit('dashboard.unpublish', req.params.id, DEFAULT_ACTOR_ID, {})
  const updated = await getDashboard(req.params.id)
  res.json(ok(updated))
})

dashboardRoutes.get('/big-screens/:id/versions', async (req, res) => {
  const existing = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!existing) return sendNotFound(res)

  const versions = await prisma.dashboardVersion.findMany({
    where: { dashboardId: req.params.id },
    orderBy: { version: 'desc' },
  })
  res.json(ok(versions.map((version) => ({
    id: version.id,
    version: version.version,
    publishNote: version.publishNote,
    createdBy: version.createdBy,
    createdAt: version.createdAt,
  }))))
})

dashboardRoutes.post('/big-screens/:id/versions/:version/rollback', async (req, res) => {
  const versionNumber = Number(req.params.version)
  if (!Number.isInteger(versionNumber)) return sendBadRequest(res, 'VERSION_INVALID', 'Version must be an integer')

  const version = await prisma.dashboardVersion.findUnique({
    where: { dashboardId_version: { dashboardId: req.params.id, version: versionNumber } },
  })
  if (!version) return sendNotFound(res, 'Dashboard version not found')

  const parsed = parseSchema(version.schema)
  await prisma.dashboard.update({
    where: { id: req.params.id },
    data: {
      draftSchema: JSON.stringify(parsed),
      publishedSchema: JSON.stringify(parsed),
      status: 'published',
      publishedAt: new Date(),
    },
  })
  await recordAudit('dashboard.rollback', req.params.id, DEFAULT_ACTOR_ID, { version: versionNumber })
  const updated = await getDashboard(req.params.id)
  res.json(ok(updated))
})

dashboardRoutes.post('/big-screens/:id/share-links', async (req, res) => {
  const dashboard = await prisma.dashboard.findUnique({ where: { id: req.params.id } })
  if (!dashboard) return sendNotFound(res)
  if (!dashboard.publishedSchema) return sendBadRequest(res, 'NOT_PUBLISHED', 'Publish the dashboard before creating a share link')

  const link = await prisma.dashboardShareLink.create({
    data: {
      id: nanoid(),
      dashboardId: dashboard.id,
      token: nanoid(),
      accessScope: typeof req.body.accessScope === 'string' ? req.body.accessScope.slice(0, 80) : 'public-link',
      expiresAt: null,
      isEnabled: true,
    },
  })
  await recordAudit('dashboard.share.create', dashboard.id, DEFAULT_ACTOR_ID, { linkId: link.id })
  res.status(201).json(ok(link))
})

dashboardRoutes.get('/public/big-screens/:shareToken', async (req, res) => {
  const link = await prisma.dashboardShareLink.findUnique({
    where: { token: req.params.shareToken },
    include: { dashboard: true },
  })
  if (!link || !link.isEnabled) return sendNotFound(res, 'Share link not found')
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return sendForbidden(res, 'Share link expired')
  if (!link.dashboard.publishedSchema) return sendBadRequest(res, 'NOT_PUBLISHED', 'Dashboard is not published')

  res.json(ok({
    id: link.dashboard.id,
    name: link.dashboard.name,
    schema: parseSchema(link.dashboard.publishedSchema),
  }))
})
```

- [ ] **Step 4: Add web API client methods**

Extend `apps/web/src/features/big-screen/api/bigScreenApi.ts`:

```ts
  listDashboards() {
    return requestJson<Array<{ id: string; name: string; description?: string | null; status: string; updatedAt: string; publishedAt?: string | null }>>('/api/big-screens')
  },
  copyDashboard(id: string) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/copy`, { method: 'POST' })
  },
  deleteDashboard(id: string) {
    return requestJson<{ id: string; status: 'archived' }>(`/api/big-screens/${id}`, { method: 'DELETE' })
  },
  unpublish(id: string) {
    return requestJson<DashboardRecord>(`/api/big-screens/${id}/unpublish`, { method: 'POST' })
  },
  createShareLink(id: string) {
    return requestJson<{ id: string; token: string }>(`/api/big-screens/${id}/share-links`, {
      method: 'POST',
      body: JSON.stringify({ accessScope: 'public-link' }),
    })
  },
  getSharedRuntime(token: string) {
    return requestJson<{ id: string; name: string; schema: DashboardSchema }>(`/api/public/big-screens/${token}`)
  },
```

Place these methods inside the exported `bigScreenApi` object.

- [ ] **Step 5: Create dashboard library page**

Create `apps/web/src/features/big-screen/designer/DashboardList.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bigScreenApi } from '../api/bigScreenApi'

type DashboardListItem = {
  id: string
  name: string
  description?: string | null
  status: string
  updatedAt: string
  publishedAt?: string | null
}

const router = useRouter()
const dashboards = ref<DashboardListItem[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

async function loadDashboards() {
  isLoading.value = true
  error.value = null
  try {
    dashboards.value = await bigScreenApi.listDashboards()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dashboards'
  } finally {
    isLoading.value = false
  }
}

async function createDashboard() {
  const dashboard = await bigScreenApi.createDashboard({ name: 'New Big Screen' })
  await router.push(`/big-screens/${dashboard.id}`)
}

async function copyDashboard(id: string) {
  const dashboard = await bigScreenApi.copyDashboard(id)
  await router.push(`/big-screens/${dashboard.id}`)
}

async function archiveDashboard(id: string) {
  if (!window.confirm('Archive this big screen?')) return
  await bigScreenApi.deleteDashboard(id)
  await loadDashboards()
}

onMounted(loadDashboards)
</script>

<template>
  <main class="dashboard-list">
    <header>
      <div>
        <h1>Big Screens</h1>
        <p>Design, publish, and manage AI data dashboards.</p>
      </div>
      <button @click="createDashboard">New Big Screen</button>
    </header>

    <div v-if="isLoading" class="state">Loading dashboards</div>
    <div v-else-if="error" class="state">
      <span>{{ error }}</span>
      <button @click="loadDashboards">Retry</button>
    </div>
    <div v-else-if="dashboards.length === 0" class="state">
      <span>No big screens yet.</span>
      <button @click="createDashboard">Create one</button>
    </div>
    <section v-else class="grid">
      <article v-for="dashboard in dashboards" :key="dashboard.id" class="card">
        <div>
          <h2>{{ dashboard.name }}</h2>
          <p>{{ dashboard.description || 'No description' }}</p>
        </div>
        <span class="status">{{ dashboard.status }}</span>
        <div class="actions">
          <RouterLink :to="`/big-screens/${dashboard.id}`">Edit</RouterLink>
          <RouterLink :to="`/runtime/${dashboard.id}`">Runtime</RouterLink>
          <button @click="copyDashboard(dashboard.id)">Copy</button>
          <button class="danger" @click="archiveDashboard(dashboard.id)">Archive</button>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.dashboard-list { min-height: 100vh; padding: 32px; background: var(--color-page); }
header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
h1, h2, p { margin: 0; }
header p, .card p { margin-top: 6px; color: var(--color-text-muted); }
button, a { min-height: 34px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 7px; background: white; color: var(--color-text); text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.card { display: grid; gap: 14px; padding: 16px; border: 1px solid var(--color-border); border-radius: 8px; background: white; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
.status { width: max-content; padding: 4px 8px; border-radius: 999px; background: var(--color-accent-soft); color: var(--color-accent); font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.danger { border-color: #fecaca; color: #be123c; }
.state { min-height: 280px; display: grid; place-items: center; gap: 12px; color: var(--color-text-muted); background: white; border: 1px solid var(--color-border); border-radius: 8px; }
</style>
```

Modify `apps/web/src/router.ts`:

```ts
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/big-screens',
    },
    {
      path: '/big-screens',
      component: () => import('./features/big-screen/designer/DashboardList.vue'),
    },
    {
      path: '/big-screens/:id',
      component: () => import('./features/big-screen/designer/DesignerShell.vue'),
    },
    {
      path: '/runtime/:id',
      component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
    },
    {
      path: '/share/:token',
      component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
    },
  ],
})
```

- [ ] **Step 6: Update shared runtime screen to support share tokens**

Modify `RuntimeScreen.vue` loading logic:

```ts
onMounted(async () => {
  try {
    const token = route.params.token ? String(route.params.token) : null
    const runtime = token
      ? await bigScreenApi.getSharedRuntime(token)
      : await bigScreenApi.getRuntime(String(route.params.id))
    name.value = runtime.name
    schema.value = runtime.schema
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load runtime screen'
  } finally {
    isLoading.value = false
  }
})
```

- [ ] **Step 7: Run workflow tests and manual checks**

Run:

```bash
npm --workspace apps/api run test -- dashboard.workflow
npm run build
```

Manual check:

```bash
npm run dev
```

Open `http://localhost:5173/big-screens`.

Expected:

- Dashboard list loads.
- New Big Screen opens designer.
- Copy creates a copied dashboard.
- Archive requires browser confirmation and removes archived item from active use.
- Published dashboards can create share links through the API and load through `/share/:token`.

- [ ] **Step 8: Commit**

```bash
git add apps/api apps/web package-lock.json
git commit -m "feat: complete dashboard workflow"
```

---

## Task 11: Add Documentation, Security Notes, and Delivery Checks

**Files:**
- Create: `README.md`
- Create: `docs/security/big-screen-security.md`
- Create: `docs/testing/big-screen-testing.md`

- [ ] **Step 1: Create README**

Create `README.md`:

```md
# Analytics Dashboard Big Screen Designer

Vue 3 big-screen dashboard designer for an AI data Q&A platform.

## Local Setup

```bash
npm install
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate -- --name init
npm run dev
```

Web: http://localhost:5173
API: http://localhost:4000/api/health

## Core Flows

- Designer: `/big-screens/new`
- Runtime: `/runtime/:id`

## Verification

```bash
npm run test
npm run build
npm run e2e
```
```

- [ ] **Step 2: Create security notes**

Create `docs/security/big-screen-security.md`:

```md
# Big Screen Security Notes

## Boundaries

- Dashboard schema is validated with Zod before draft save and publish.
- Unknown component types are rejected.
- Component layout values are bounded.
- Text values render through Vue template interpolation.
- Image assets must move to managed asset records before production release.
- Publish, unpublish, delete, permission changes, and share-link changes need audit entries.

## Permissions

- View allows runtime access.
- Edit allows draft changes.
- Owner allows publish and permission changes.

## Data

- The first version uses mock data only.
- Real dataset, SQL, and AI question sources must pass tenant and permission context into the data adapter before query execution.
```

- [ ] **Step 3: Create testing notes**

Create `docs/testing/big-screen-testing.md`:

```md
# Big Screen Testing Notes

## Unit Tests

- Shared schema validation.
- Default dashboard schema.
- Runtime scale calculation.

## API Tests

- Create dashboard.
- Fetch dashboard.
- Reject invalid schema.
- Return mock data.

## E2E Tests

- Create new screen.
- Apply preset.
- Save draft.
- Publish.
- Open runtime preview.

## Visual Checks

Capture screenshots at:

- 1366 x 768
- 1920 x 1080
- 2560 x 1440

Check that runtime content remains centered and proportionally scaled.
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run test
npm run build
npm run e2e
git status --short
```

Expected:

- Tests pass.
- Builds pass.
- E2E passes.
- `git status --short` shows only documentation changes before commit.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/security docs/testing
git commit -m "docs: add big screen delivery notes"
```

---

## Self-Review Checklist

- Spec coverage: Tasks cover Vue 3 embedding, free canvas, mock data, schema, persistence, publishing, permissions, runtime renderer, proportional scaling, presets, tests, and documentation.
- No independent subsystem split is needed for this plan because the repository is empty and the first goal is a working vertical slice.
- Type consistency: `DashboardSchema`, `DashboardComponent`, and `DataBinding` come from `@analytics/shared` and are reused by API and web.
- API consistency: designer and runtime requests use `/api/big-screens` routes and the shared `ApiResponse` envelope.
- Data consistency: first version only implements `mock`, while schema keeps `dataset`, `ai-question`, and `sql` source types as validated values.
- Quality gate: Task 9 and Task 11 include tests, E2E flow, visual viewport checks, and security notes aligned with the global AGENTS requirements.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-03-big-screen-designer.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
