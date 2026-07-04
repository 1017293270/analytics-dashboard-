# Education Workbench Mock Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed the default role workbenches with credible education big-screen layouts and extend the mock data API with education metrics for live demonstration.

**Architecture:** Keep the existing dashboard schema and renderer contracts. Add education mock data keys to the API data module, then add an API-side schema factory used by default workbench seeding. Existing user-created dashboards are not overwritten.

**Tech Stack:** TypeScript, Express, Prisma, Vue dashboard schema, Vitest, Playwright.

---

## File Map

- Modify `apps/api/src/data/mock-data.ts`: add education metrics, chart rows, and table datasets while preserving existing mock keys.
- Modify `apps/api/src/dashboards/dashboard.repository.ts`: add education workbench schema factory and reseed guard for blank default workbenches.
- Modify `apps/api/src/data/mock-data.test.ts`: assert education metric/category/table responses.
- Modify or create `apps/api/src/dashboards/dashboard.repository.test.ts`: assert default workbench schemas are not empty and blank default schemas can be upgraded.
- Run existing web/API tests and demo rehearsal after implementation.

## Task 1: Education Mock Data

**Files:**
- Modify: `apps/api/src/data/mock-data.ts`
- Test: `apps/api/src/data/mock-data.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that call `getMockData()` directly:

```ts
import { describe, expect, test } from 'vitest'
import { getMockData } from './mock-data'

describe('education mock data', () => {
  test('returns education metric data for role workbench KPI cards', () => {
    expect(getMockData({ metrics: ['school_device_online_rate'] })).toEqual({
      kind: 'metric',
      value: 98.6,
      label: '设备在线率',
      trend: 1.2,
    })
  })

  test('returns education category rows for device status charts', () => {
    expect(getMockData({ dimensions: ['category'], metrics: ['device_type_status'] })).toEqual({
      kind: 'category',
      rows: [
        { category: '智慧黑板', value: 286 },
        { category: '交互平板', value: 218 },
        { category: '录播主机', value: 42 },
        { category: '班牌终端', value: 96 },
      ],
    })
  })

  test('returns education table rows with requested limit', () => {
    expect(getMockData({ dimensions: ['table'], metrics: ['device_repair_orders'], limit: 2 })).toEqual({
      kind: 'table',
      columns: ['设备', '位置', '状态', '责任人'],
      rows: [
        { 设备: 'HB-3F-021', 位置: '教学楼 3 楼 302 教室', 状态: '处理中', 责任人: '王工' },
        { 设备: 'PAD-2F-118', 位置: '教学楼 2 楼 218 教室', 状态: '待上门', 责任人: '李工' },
      ],
    })
  })
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm --workspace apps/api run test -- mock-data`

Expected: tests fail because education keys are not present yet.

- [ ] **Step 3: Implement education data**

Add the education metric/category/time-series/table keys to the existing records. Keep the existing return shape and fallback logic unchanged.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm --workspace apps/api run test -- mock-data`

Expected: all mock-data tests pass.

## Task 2: Default Education Workbench Schemas

**Files:**
- Modify: `apps/api/src/dashboards/dashboard.repository.ts`
- Test: `apps/api/src/dashboards/dashboard.repository.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for pure schema helpers:

```ts
import { describe, expect, test } from 'vitest'
import {
  createDefaultSchema,
  createEducationWorkbenchSchema,
  shouldUpgradeDefaultWorkbenchSchema,
} from './dashboard.repository'

describe('education workbench schemas', () => {
  test('builds non-empty schemas for each default role workbench', () => {
    for (const id of ['dashboard-all', 'dashboard-electro', 'dashboard-moral', 'dashboard-research']) {
      const schema = createEducationWorkbenchSchema(id)
      expect(schema.components.length).toBeGreaterThanOrEqual(8)
      expect(Object.keys(schema.dataBindings).length).toBeGreaterThanOrEqual(6)
      expect(schema.components.some((component) => component.type === 'metric-card')).toBe(true)
      expect(schema.components.some((component) => component.type === 'table')).toBe(true)
    }
  })

  test('upgrades blank default schemas but preserves edited schemas', () => {
    expect(shouldUpgradeDefaultWorkbenchSchema(createDefaultSchema())).toBe(true)
    expect(shouldUpgradeDefaultWorkbenchSchema(createEducationWorkbenchSchema('dashboard-all'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm --workspace apps/api run test -- dashboard.repository`

Expected: tests fail because `createEducationWorkbenchSchema` and `shouldUpgradeDefaultWorkbenchSchema` do not exist.

- [ ] **Step 3: Implement schema factory**

Add helpers to `dashboard.repository.ts` with these exported signatures:

```ts
export function createEducationWorkbenchSchema(id: string): DashboardSchema

export function shouldUpgradeDefaultWorkbenchSchema(schema: DashboardSchema): boolean {
  return schema.components.length === 0 && Object.keys(schema.dataBindings).length === 0
}
```

`createEducationWorkbenchSchema(id)` must return a full schema by selecting one of four role configurations keyed by `dashboard-all`, `dashboard-electro`, `dashboard-moral`, and `dashboard-research`. Each configuration must provide title/subtitle text, KPI metric keys, chart keys, and one table key. Use shared local helpers for text, metric, chart, table, and decoration components so every component has explicit `layout`, `props`, `style`, and optional `dataBindingId`.

Then use `createEducationWorkbenchSchema(preset.id)` instead of `createDefaultSchema()` when creating missing default workbenches. Upgrade existing default workbenches only when `shouldUpgradeDefaultWorkbenchSchema(parseSchema(existing.draftSchema))` is true.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm --workspace apps/api run test -- dashboard.repository`

Expected: dashboard repository tests pass.

## Task 3: Integration Verification

**Files:**
- Existing tests only unless route gates need an assertion update.

- [ ] **Step 1: Run API tests**

Run: `npm --workspace apps/api run test`

Expected: API test suite passes.

- [ ] **Step 2: Run web tests affected by big-screen data**

Run: `npm --workspace apps/web run test -- big-screen`

Expected: big-screen web tests pass.

- [ ] **Step 3: Run demo rehearsal**

Run: `npm run demo:rehearsal`

Expected: both desktop projects pass.

- [ ] **Step 4: Browser check**

Open `/workbenches`, then each default workbench. Expected: default workbench canvases show metrics/charts/tables rather than blank canvases.

## Task 4: Commit

**Files:**
- Add implementation and tests only.
- Do not commit `.codex-logs/`.

- [ ] **Step 1: Inspect status**

Run: `git status --short`

Expected: only implementation/test/docs files are modified, plus possibly ignored or untracked local logs.

- [ ] **Step 2: Commit**

Run:

```bash
git add apps/api/src/data/mock-data.ts apps/api/src/data/mock-data.test.ts apps/api/src/dashboards/dashboard.repository.ts apps/api/src/dashboards/dashboard.repository.test.ts docs/superpowers/plans/2026-07-04-education-workbench-mock-data-plan.md
git commit -m "feat: seed education workbench mock data"
```

Expected: commit succeeds.
