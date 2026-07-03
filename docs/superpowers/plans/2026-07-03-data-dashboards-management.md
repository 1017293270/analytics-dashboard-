# Data Dashboards Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/data-dashboards` overview placeholder with a polished Element Plus management page for six school data dashboards and third-party dashboard links.

**Architecture:** Add an isolated `features/data-dashboards` frontend module with deterministic local data, pure helper functions, one route view, and component tests. The module follows the alarm/application management pattern and does not modify existing big-screen designer internals.

**Tech Stack:** Vue 3, Vue Router, TypeScript, Element Plus, `@element-plus/icons-vue`, Vitest, `@vue/test-utils`.

---

## Scope Check

The approved spec covers one route-level feature. It is safe to implement as one plan because the data helper, route view, and route/docs changes all serve the same user-facing `/data-dashboards` slice.

## UI And Context Requirements

Before implementing, read these files with UTF-8 encoding:

```powershell
Get-Content -LiteralPath docs\superpowers\specs\2026-07-03-smart-education-ui-guidelines.md -Encoding utf8
Get-Content -LiteralPath docs\superpowers\specs\2026-07-03-data-dashboards-management-design.md -Encoding utf8
Get-Content -LiteralPath apps\web\src\features\applications\ApplicationCenterView.vue -Encoding utf8
Get-Content -LiteralPath apps\web\src\features\alarms\AlarmManagementView.vue -Encoding utf8
Get-Content -LiteralPath apps\web\src\router.ts -Encoding utf8
```

Keep the UI table-first, compact, Element Plus based, and visually consistent with `/applications` and `/alarms`.

## File Structure

- Create `apps/web/src/features/data-dashboards/dashboardData.ts`: dashboard types, seed records, summary/filter/draft/validation helpers, and URL validator.
- Create `apps/web/src/features/data-dashboards/dashboardData.test.ts`: unit tests for helper behavior.
- Create `apps/web/src/features/data-dashboards/DataDashboardsView.vue`: `/data-dashboards` route view with summary, filters, table, drawer form, preview, local enable/disable, and local create/update.
- Create `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`: component tests for rendering, filtering, drawer preview, status toggle, and third-party validation/save.
- Modify `apps/web/src/router.ts`: route `/data-dashboards` to the new view.
- Modify `apps/web/src/features/overview/overviewData.ts`: mark data dashboards as demo-ready after the page ships.
- Modify `README.md`: add `/data-dashboards` to the completed route list if missing.

---

### Task 1: Dashboard Data Helpers

**Files:**
- Create: `apps/web/src/features/data-dashboards/dashboardData.test.ts`
- Create: `apps/web/src/features/data-dashboards/dashboardData.ts`

- [ ] **Step 1: Write failing dashboard helper tests**

Create `apps/web/src/features/data-dashboards/dashboardData.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  applyDashboardFilters,
  createDashboardDraft,
  dashboardSummary,
  seedDashboards,
  validateDashboardDraft,
  type DashboardDraft,
  type DashboardFilters,
} from './dashboardData'

describe('dashboardData', () => {
  test('summarizes total, enabled, default, and embedded dashboards', () => {
    expect(dashboardSummary(seedDashboards)).toEqual({
      total: 6,
      enabled: 5,
      defaults: 3,
      embedded: 2,
    })
  })

  test('filters dashboards by keyword, type, role, status, and source', () => {
    const filters: DashboardFilters = {
      keyword: '告警',
      type: '告警态势',
      visibleRole: '电教主任',
      status: '已停用',
      source: '第三方嵌入',
    }

    expect(applyDashboardFilters(seedDashboards, filters).map((dashboard) => dashboard.name)).toEqual(['告警态势'])
  })

  test('returns all dashboards when filters are empty', () => {
    expect(
      applyDashboardFilters(seedDashboards, {
        keyword: '',
        type: '全部',
        visibleRole: '全部',
        status: '全部',
        source: '全部',
      }),
    ).toHaveLength(seedDashboards.length)
  })

  test('creates built-in and third-party dashboard drafts', () => {
    expect(createDashboardDraft()).toMatchObject({
      name: '',
      type: '治理分析',
      source: '内置看板',
      url: '',
      isDefault: false,
      visibleRoles: ['全员'],
      status: '已启用',
    })
    expect(createDashboardDraft('第三方嵌入')).toMatchObject({
      source: '第三方嵌入',
      visibleRoles: ['电教主任'],
      status: '已启用',
    })
  })

  test('validates required fields and third-party URLs', () => {
    const missingName: DashboardDraft = {
      ...createDashboardDraft(),
      name: '',
    }
    const missingRole: DashboardDraft = {
      ...createDashboardDraft(),
      name: '测试看板',
      visibleRoles: [],
    }
    const missingUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: '',
    }
    const invalidUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: 'javascript:alert(1)',
    }
    const validUrl: DashboardDraft = {
      ...createDashboardDraft('第三方嵌入'),
      name: '第三方看板',
      url: 'https://demo.school.local/board',
    }

    expect(validateDashboardDraft(missingName)).toContain('看板名称不能为空')
    expect(validateDashboardDraft(missingRole)).toContain('至少选择一个可见角色')
    expect(validateDashboardDraft(missingUrl)).toContain('第三方看板需要填写链接')
    expect(validateDashboardDraft(invalidUrl)).toContain('第三方看板链接必须以 http:// 或 https:// 开头')
    expect(validateDashboardDraft(validUrl)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the helper tests and verify RED**

Run:

```powershell
npm --workspace apps/web run test -- dashboardData
```

Expected: FAIL because `dashboardData.ts` does not exist.

- [ ] **Step 3: Implement dashboard data helpers**

Create `apps/web/src/features/data-dashboards/dashboardData.ts`:

```ts
export type DashboardType = '治理分析' | '教师发展' | '学生成长' | '设备运维' | '告警态势' | '应用使用'
export type DashboardTypeFilter = DashboardType | '全部'
export type DashboardSource = '内置看板' | '第三方嵌入'
export type DashboardSourceFilter = DashboardSource | '全部'
export type DashboardStatus = '已启用' | '已停用'
export type DashboardStatusFilter = DashboardStatus | '全部'
export type DashboardRole = '全员' | '电教主任' | '德育主任' | '教研主任'
export type DashboardRoleFilter = DashboardRole | '全部'

export type DashboardMetric = {
  label: string
  value: string
  trend: string
}

export type ManagedDashboard = {
  id: string
  name: string
  type: DashboardType
  source: DashboardSource
  url: string
  isDefault: boolean
  visibleRoles: DashboardRole[]
  status: DashboardStatus
  updatedAt: string
  metrics: DashboardMetric[]
}

export type DashboardDraft = Omit<ManagedDashboard, 'id' | 'updatedAt' | 'metrics'>

export type DashboardFilters = {
  keyword: string
  type: DashboardTypeFilter
  visibleRole: DashboardRoleFilter
  status: DashboardStatusFilter
  source: DashboardSourceFilter
}

export const dashboardTypes: DashboardTypeFilter[] = [
  '全部',
  '治理分析',
  '教师发展',
  '学生成长',
  '设备运维',
  '告警态势',
  '应用使用',
]
export const dashboardSources: DashboardSourceFilter[] = ['全部', '内置看板', '第三方嵌入']
export const dashboardStatuses: DashboardStatusFilter[] = ['全部', '已启用', '已停用']
export const dashboardRoles: DashboardRole[] = ['全员', '电教主任', '德育主任', '教研主任']
export const dashboardRoleFilters: DashboardRoleFilter[] = ['全部', ...dashboardRoles]

export const defaultDashboardFilters: DashboardFilters = {
  keyword: '',
  type: '全部',
  visibleRole: '全部',
  status: '全部',
  source: '全部',
}

export const seedDashboards: ManagedDashboard[] = [
  {
    id: 'dashboard-governance',
    name: '教育治理',
    type: '治理分析',
    source: '内置看板',
    url: '',
    isDefault: true,
    visibleRoles: ['全员', '电教主任'],
    status: '已启用',
    updatedAt: '2026-07-03 10:10',
    metrics: [
      { label: '治理事项', value: '128', trend: '本周 +12' },
      { label: '完成率', value: '93.6%', trend: '较昨日 +2.1%' },
      { label: '校区覆盖', value: '4', trend: '全部在线' },
    ],
  },
  {
    id: 'dashboard-teacher',
    name: '教师发展',
    type: '教师发展',
    source: '内置看板',
    url: '',
    isDefault: true,
    visibleRoles: ['教研主任'],
    status: '已启用',
    updatedAt: '2026-07-03 09:42',
    metrics: [
      { label: '教研活动', value: '36', trend: '本月 +6' },
      { label: '培训完成', value: '88%', trend: '较上周 +5%' },
      { label: '资源共建', value: '214', trend: '活跃' },
    ],
  },
  {
    id: 'dashboard-student',
    name: '学生成长',
    type: '学生成长',
    source: '内置看板',
    url: '',
    isDefault: true,
    visibleRoles: ['德育主任'],
    status: '已启用',
    updatedAt: '2026-07-03 09:20',
    metrics: [
      { label: '成长档案', value: '1,286', trend: '全量同步' },
      { label: '德育活动', value: '42', trend: '本学期' },
      { label: '预警跟进', value: '18', trend: '待处理 3' },
    ],
  },
  {
    id: 'dashboard-device',
    name: '设备运维',
    type: '设备运维',
    source: '内置看板',
    url: '',
    isDefault: false,
    visibleRoles: ['电教主任'],
    status: '已启用',
    updatedAt: '2026-07-03 09:05',
    metrics: [
      { label: '在线设备', value: '642', trend: '在线率 98.6%' },
      { label: '巡检任务', value: '24', trend: '今日' },
      { label: '待维修', value: '7', trend: '高优先 1' },
    ],
  },
  {
    id: 'dashboard-alarm',
    name: '告警态势',
    type: '告警态势',
    source: '第三方嵌入',
    url: 'https://demo.school.local/alarm-bi',
    isDefault: false,
    visibleRoles: ['电教主任'],
    status: '已停用',
    updatedAt: '2026-07-03 08:58',
    metrics: [
      { label: '今日告警', value: '12', trend: '未处理 4' },
      { label: '平均响应', value: '6m', trend: '较昨日 -1m' },
      { label: '设备离线', value: '3', trend: '处理中' },
    ],
  },
  {
    id: 'dashboard-app-usage',
    name: '应用使用',
    type: '应用使用',
    source: '第三方嵌入',
    url: 'https://demo.school.local/app-usage',
    isDefault: false,
    visibleRoles: ['全员', '电教主任'],
    status: '已启用',
    updatedAt: '2026-07-03 08:45',
    metrics: [
      { label: '启用应用', value: '36', trend: '网页端 24' },
      { label: '今日访问', value: '2,418', trend: '高峰 10:00' },
      { label: '移动端', value: '12', trend: '稳定' },
    ],
  },
]

export function dashboardSummary(dashboards: ManagedDashboard[]) {
  return {
    total: dashboards.length,
    enabled: dashboards.filter((dashboard) => dashboard.status === '已启用').length,
    defaults: dashboards.filter((dashboard) => dashboard.isDefault).length,
    embedded: dashboards.filter((dashboard) => dashboard.source === '第三方嵌入').length,
  }
}

export function applyDashboardFilters(
  dashboards: ManagedDashboard[],
  filters: DashboardFilters,
): ManagedDashboard[] {
  const keyword = filters.keyword.trim().toLowerCase()

  return dashboards.filter((dashboard) => {
    const searchableText = [dashboard.name, dashboard.type, dashboard.source, dashboard.url].join(' ').toLowerCase()
    const matchesKeyword = keyword.length === 0 || searchableText.includes(keyword)
    const matchesType = filters.type === '全部' || dashboard.type === filters.type
    const matchesRole = filters.visibleRole === '全部' || dashboard.visibleRoles.includes(filters.visibleRole)
    const matchesStatus = filters.status === '全部' || dashboard.status === filters.status
    const matchesSource = filters.source === '全部' || dashboard.source === filters.source

    return matchesKeyword && matchesType && matchesRole && matchesStatus && matchesSource
  })
}

export function createDashboardDraft(source: DashboardSource = '内置看板'): DashboardDraft {
  return {
    name: '',
    type: source === '第三方嵌入' ? '告警态势' : '治理分析',
    source,
    url: '',
    isDefault: false,
    visibleRoles: source === '第三方嵌入' ? ['电教主任'] : ['全员'],
    status: '已启用',
  }
}

export function isValidDashboardEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateDashboardDraft(draft: DashboardDraft): string[] {
  const errors: string[] = []

  if (!draft.name.trim()) errors.push('看板名称不能为空')
  if (draft.visibleRoles.length === 0) errors.push('至少选择一个可见角色')
  if (draft.source === '第三方嵌入' && !draft.url.trim()) errors.push('第三方看板需要填写链接')
  if (draft.source === '第三方嵌入' && draft.url.trim() && !isValidDashboardEmbedUrl(draft.url)) {
    errors.push('第三方看板链接必须以 http:// 或 https:// 开头')
  }

  return errors
}
```

- [ ] **Step 4: Run helper tests and verify GREEN**

Run:

```powershell
npm --workspace apps/web run test -- dashboardData
```

Expected: PASS with 5 tests.

- [ ] **Step 5: Commit helper task**

Run:

```powershell
git add apps/web/src/features/data-dashboards/dashboardData.ts apps/web/src/features/data-dashboards/dashboardData.test.ts
git commit -m "feat: add data dashboard helpers"
```

---

### Task 2: Data Dashboards Route View

**Files:**
- Create: `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`
- Create: `apps/web/src/features/data-dashboards/DataDashboardsView.vue`
- Modify: `apps/web/src/router.ts`

- [ ] **Step 1: Write failing view tests**

Create `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
import DataDashboardsView from './DataDashboardsView.vue'

const elementStubs = {
  ElSelect: {
    props: ['modelValue'],
    template: '<select><slot /></select>',
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
    },
  }
})

async function mountDashboardView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/data-dashboards', component: DataDashboardsView }],
  })
  await router.push('/data-dashboards')
  await router.isReady()

  const wrapper = mount(DataDashboardsView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return wrapper
}

describe('DataDashboardsView', () => {
  test('renders summary, filters, required table columns, and seed dashboards', async () => {
    const wrapper = await mountDashboardView()

    expect(wrapper.text()).toContain('数据看板')
    expect(wrapper.text()).toContain('看板总数')
    expect(wrapper.text()).toContain('第三方嵌入')
    expect(wrapper.text()).toContain('看板名称')
    expect(wrapper.text()).toContain('看板类型')
    expect(wrapper.text()).toContain('使用角色')
    expect(wrapper.text()).toContain('来源')
    expect(wrapper.text()).toContain('更新时间')
    const columnLabels = wrapper.findAllComponents({ name: 'ElTableColumn' }).map((column) => column.props('label'))
    expect(columnLabels).toEqual(
      expect.arrayContaining(['看板名称', '看板类型', '使用角色', '来源', '状态', '更新时间', '操作']),
    )
    expect(wrapper.text()).toContain('教育治理')
    expect(wrapper.text()).toContain('教师发展')
    expect(wrapper.text()).toContain('学生成长')
    expect(wrapper.text()).toContain('设备运维')
    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).toContain('应用使用')
    expect(wrapper.text()).toContain('默认')
  })

  test('filters dashboards by keyword and resets the table', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-keyword-input"]').setValue('告警')
    await wrapper.get('[data-testid="dashboard-search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).not.toContain('教育治理')

    await wrapper.get('[data-testid="dashboard-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('告警态势')
    expect(wrapper.text()).toContain('教育治理')
  })

  test('opens preview drawer and toggles dashboard status', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-preview-dashboard-governance"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('配置数据看板')
    expect(wrapper.text()).toContain('教育治理')
    expect(wrapper.text()).toContain('治理事项')
    expect(wrapper.text()).toContain('内置看板预览')

    await wrapper.get('[data-testid="dashboard-toggle-dashboard-device"]').trigger('click')
    await flushPromises()

    const dashboards = wrapper.findComponent({ name: 'ElTable' }).props('data') as Array<{
      id: string
      status: string
    }>
    expect(dashboards.find((dashboard) => dashboard.id === 'dashboard-device')?.status).toBe('已停用')
  })

  test('validates and saves a third-party dashboard from the drawer', async () => {
    const wrapper = await mountDashboardView()

    await wrapper.get('[data-testid="dashboard-add-embed-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('看板名称不能为空')

    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('资产态势')
    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('javascript:alert(1)')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('第三方看板链接必须以 http:// 或 https:// 开头')

    await wrapper.get('[data-testid="dashboard-url-input"]').setValue('https://demo.school.local/assets')
    await wrapper.get('[data-testid="dashboard-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('资产态势')
    expect(wrapper.text()).toContain('https://demo.school.local/assets')
  })
})
```

- [ ] **Step 2: Run view tests and verify RED**

Run:

```powershell
npm --workspace apps/web run test -- DataDashboardsView
```

Expected: FAIL because `DataDashboardsView.vue` does not exist.

- [ ] **Step 3: Implement `DataDashboardsView.vue`**

Create a Vue component with these behavior points:

- Import Element Plus icons: `DataAnalysis`, `Edit`, `Link`, `Plus`, `Refresh`, `Search`, `View`.
- Import helper exports from `./dashboardData`.
- Keep local dashboard state as a deep copy of `seedDashboards`.
- Use `reactive({ ...defaultDashboardFilters })` for filters.
- Use `reactive<DashboardDraft>(createDashboardDraft())` for the drawer draft.
- Track `drawerVisible`, `editingId`, and field errors.
- Computed values:
  - `filteredDashboards`
  - `summary`
  - `drawerTitle`
  - `selectedPreviewMetrics`
- Functions:
  - `getStatusTagType(status)` returns `success` for `已启用`, `info` for `已停用`.
  - `getSourceTagType(source)` returns `primary` for `第三方嵌入`, `info` for `内置看板`.
  - `resetFilters()` resets to `defaultDashboardFilters`.
  - `resetFieldErrors()` clears name/url/visibleRoles errors.
  - `setFieldErrors(errors)` maps validation messages to fields.
  - `openPreview(dashboard)` opens drawer with existing row values.
  - `openEmbedDrawer()` opens drawer with `createDashboardDraft('第三方嵌入')`.
  - `saveDashboard()` validates, updates an existing row or appends a new row, then closes drawer.
  - `toggleDashboardStatus(dashboard)` toggles `已启用` / `已停用`.

Template requirements:

- Root class: `data-dashboards`.
- Header with `h1` text `数据看板`, context paragraph, and `data-testid="dashboard-add-embed-button"`.
- Four summary `ElCard` tiles.
- Filter `ElForm` with `data-testid="dashboard-keyword-input"`, `dashboard-reset-button`, and `dashboard-search-button`.
- `ElTable` with required column labels.
- Use `ElTag` for `默认`, source, status, and visible roles.
- Row actions include:
  - `data-testid="dashboard-preview-${row.id}"`
  - `data-testid="dashboard-toggle-${row.id}"`
- Drawer includes:
  - `data-testid="dashboard-name-input"`
  - `data-testid="dashboard-url-input"` when source is `第三方嵌入`
  - validation text rendered as `<p role="alert">`
  - `data-testid="dashboard-save-button"`
  - a preview block containing `内置看板预览` for built-in records
  - a preview block containing the URL for third-party records
  - fallback text `请填写第三方看板链接后预览` when no third-party URL exists

CSS requirements:

- Match `/applications` and `/alarms` density.
- Summary cards use a four-column grid on desktop and stack on mobile.
- Filters fit one row on wide desktop and wrap to three columns below 1180px.
- Table font size is 12px with muted header background.
- Drawer preview uses a bordered dark-ish dashboard preview shell but no nested `ElCard`.
- Long URLs use `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`.

- [ ] **Step 4: Route `/data-dashboards` to the new view**

Modify `apps/web/src/router.ts`:

```ts
{ path: 'data-dashboards', component: () => import('./features/data-dashboards/DataDashboardsView.vue') },
```

- [ ] **Step 5: Run focused view tests and verify GREEN**

Run:

```powershell
npm --workspace apps/web run test -- dashboardData DataDashboardsView router smoke
```

Expected: PASS.

- [ ] **Step 6: Commit route view task**

Run:

```powershell
git add apps/web/src/features/data-dashboards apps/web/src/router.ts
git commit -m "feat: add data dashboards management page"
```

---

### Task 3: Overview, README, Verification, And Visual QA

**Files:**
- Modify: `apps/web/src/features/overview/overviewData.ts`
- Modify: `apps/web/src/features/overview/OverviewView.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write focused overview readiness test**

Update `apps/web/src/features/overview/OverviewView.test.ts` by extending the existing readiness/status test:

```ts
expect(Object.fromEntries(demoLaunchItems.map((item) => [item.label, item.status]))).toMatchObject({
  数据看板: '可演示',
  应用中心: '可演示',
  告警管理: '可演示',
})
```

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: FAIL because `数据看板` is still `待完善`.

- [ ] **Step 2: Update overview metadata**

Modify `apps/web/src/features/overview/overviewData.ts`:

```ts
{ label: '数据看板', description: '教育治理与学生成长', path: '/data-dashboards', status: '可演示' },
```

If `demoReadiness` needs another line after implementation, add:

```ts
{ label: '数据看板', status: '可演示', detail: '六类看板和第三方嵌入已接入' },
```

- [ ] **Step 3: Update README route list**

Add this bullet under Core Flows if missing:

```markdown
- Data dashboards: `/data-dashboards`
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- dashboardData DataDashboardsView OverviewView router smoke
```

Expected: PASS.

- [ ] **Step 5: Run full tests**

Run:

```powershell
npm run test
```

Expected: PASS for shared, web, and api suites.

- [ ] **Step 6: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Run build**

Run:

```powershell
npm run build
```

Expected: PASS. Existing Vite large chunk and VueUse PURE-comment warnings are acceptable if unchanged.

- [ ] **Step 8: Visual QA in browser**

Use the existing dev server on `http://localhost:5174` or start it:

```powershell
npm run dev -- --host 127.0.0.1
```

Login with:

```text
admin / Admin@123
```

Inspect:

- `/data-dashboards` at 1366 x 768.
- Filtered state for keyword `告警`.
- Built-in preview drawer for `教育治理`.
- Third-party configuration drawer validation.
- Third-party URL preview/fallback state.

Visual acceptance:

- No obvious text overlap.
- Table remains readable at 1366 x 768.
- Drawer form and preview fit without broken labels.
- No card-inside-card layout.
- Standard controls are Element Plus.

- [ ] **Step 9: Commit verification/docs task**

Run:

```powershell
git add apps/web/src/features/overview/OverviewView.test.ts apps/web/src/features/overview/overviewData.ts README.md
git commit -m "fix: mark data dashboards demo ready"
```

---

## Self-Review

- Spec coverage: Task 1 covers deterministic six-dashboard seed data, default dashboard flags, filtering, draft creation, and URL validation. Task 2 covers the `/data-dashboards` route, table, summary, drawer form, preview/fallback, local enable/disable, and third-party save flow. Task 3 covers overview/README readiness and full verification.
- Placeholder scan: The plan contains no unresolved `TBD`, `TODO`, or vague "implement later" instructions. The view task uses exact required behavior and test ids because the full Vue SFC is large and should be implemented against the tests and spec.
- Type consistency: `DashboardType`, `DashboardSource`, `DashboardStatus`, `DashboardRole`, `ManagedDashboard`, `DashboardDraft`, and `DashboardFilters` are defined in Task 1 and reused consistently in Task 2.
- Scope control: The plan avoids backend persistence, remote BI connectivity, and big-screen designer changes, matching the approved phase-one scope.
