# Workbench Fullscreen Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fullscreen draft preview route for role workbenches and make `浏览大屏` open that route instead of the designer.

**Architecture:** Create a small runtime-style screen that loads `bigScreenApi.getDashboard(id)` and renders `draftSchema` with the existing runtime renderer components. Register it as a top-level protected route at `/workbenches/:id/preview` so it bypasses the shell and contains no configuration UI.

**Tech Stack:** Vue 3 Composition API, Vue Router, Element Plus/Vitest ecosystem, existing big-screen API and runtime renderer components.

---

## File Structure

- Create `apps/web/src/features/big-screen/runtime/DraftPreviewScreen.vue`: fullscreen draft-schema viewer.
- Create `apps/web/src/features/big-screen/runtime/DraftPreviewScreen.test.ts`: unit tests for loading draft preview and error handling.
- Modify `apps/web/src/router.ts`: add protected top-level preview route.
- Modify `apps/web/src/router.test.ts`: assert preview route is protected and top-level.
- Modify `apps/web/src/features/data-dashboards/DataDashboardsView.vue`: change `浏览大屏` role-card links to `/workbenches/:id/preview`.
- Modify `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`: update href expectations and protect against `/runtime/:id`.

## Task 1: Route and Data Center Link Tests

**Files:**
- Modify: `apps/web/src/router.test.ts`
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`

- [ ] **Step 1: Add failing router test**

```ts
test('routes workbench fullscreen preview as a protected top-level page', async () => {
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
  const router = createTestRouter()

  await router.push('/workbenches/dashboard-all/preview')

  expect(router.currentRoute.value.fullPath).toBe('/workbenches/dashboard-all/preview')
  expect(router.currentRoute.value.matched).toHaveLength(1)
  expect(router.currentRoute.value.meta.fullscreenPreview).toBe(true)
})
```

- [ ] **Step 2: Update data-center href assertions**

```ts
expect(workbenchHrefs).toEqual([
  '/workbenches/dashboard-all/preview',
  '/workbenches/dashboard-electro/preview',
  '/workbenches/dashboard-moral/preview',
  '/workbenches/dashboard-research/preview',
])
expect(workbenchHrefs.every((href) => href && !href.startsWith('/runtime/'))).toBe(true)
expect(workbenchHrefs.every((href) => href && href.endsWith('/preview'))).toBe(true)
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm --workspace apps/web run test -- router.test.ts DataDashboardsView.test.ts`

Expected: FAIL because `/workbenches/:id/preview` route and preview hrefs do not exist yet.

## Task 2: Draft Preview Screen Tests

**Files:**
- Create: `apps/web/src/features/big-screen/runtime/DraftPreviewScreen.test.ts`

- [ ] **Step 1: Add failing component tests**

```ts
test('loads a dashboard draft schema for fullscreen preview', async () => {
  vi.mocked(bigScreenApi.getDashboard).mockResolvedValue(createDashboardRecord())
  const { wrapper } = await mountDraftPreview('/workbenches/dashboard-all/preview')

  expect(bigScreenApi.getDashboard).toHaveBeenCalledWith('dashboard-all')
  expect(wrapper.get('[data-testid="draft-preview-screen"]').exists()).toBe(true)
  expect(wrapper.get('[data-testid="draft-preview-component"]').text()).toContain('校级总览')
  expect(wrapper.text()).not.toContain('组件库')
  expect(wrapper.text()).not.toContain('属性配置')
})
```

```ts
test('shows an error state when draft preview loading fails', async () => {
  vi.mocked(bigScreenApi.getDashboard).mockRejectedValue(new Error('加载失败'))
  const { wrapper } = await mountDraftPreview('/workbenches/dashboard-all/preview')

  expect(wrapper.text()).toContain('大屏暂时无法预览')
  expect(wrapper.text()).toContain('加载失败')
})
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm --workspace apps/web run test -- DraftPreviewScreen.test.ts`

Expected: FAIL because `DraftPreviewScreen.vue` does not exist.

## Task 3: Implement Preview Route and Component

**Files:**
- Create: `apps/web/src/features/big-screen/runtime/DraftPreviewScreen.vue`
- Modify: `apps/web/src/router.ts`
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.vue`

- [ ] **Step 1: Create `DraftPreviewScreen.vue`**

Use `bigScreenApi.getDashboard(id)` and render `record.draftSchema` with `RuntimeScaler` and `RuntimeComponent`. Keep normal screen output control-free. Include retry only in the error state.

- [ ] **Step 2: Add top-level route**

```ts
{
  path: '/workbenches/:id/preview',
  component: () => import('./features/big-screen/runtime/DraftPreviewScreen.vue'),
  meta: { fullscreenPreview: true },
}
```

- [ ] **Step 3: Change data-center role card path**

```ts
path: `/workbenches/${fallback.id}/preview`,
```

- [ ] **Step 4: Run targeted tests and verify GREEN**

Run: `npm --workspace apps/web run test -- DraftPreviewScreen.test.ts router.test.ts DataDashboardsView.test.ts`

Expected: PASS.

## Task 4: Verification and Review

**Files:**
- All files from Tasks 1-3.

- [ ] **Step 1: Run full checks**

Run: `npm run test`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS with only existing Vite chunk/pure-comment warnings.

- [ ] **Step 2: Run demo route gate**

Run: `npm run demo:rehearsal`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-07-06-workbench-fullscreen-preview-design.md docs/superpowers/plans/2026-07-06-workbench-fullscreen-preview-plan.md apps/web/src/router.ts apps/web/src/router.test.ts apps/web/src/features/data-dashboards/DataDashboardsView.vue apps/web/src/features/data-dashboards/DataDashboardsView.test.ts apps/web/src/features/big-screen/runtime/DraftPreviewScreen.vue apps/web/src/features/big-screen/runtime/DraftPreviewScreen.test.ts
git commit -m "feat: add fullscreen workbench preview"
```

