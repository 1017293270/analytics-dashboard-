# Data Center Browse Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browsable data-center overview at `/data-dashboards` that surfaces role workbenches, default data dashboards, and third-party embedded dashboards.

**Architecture:** Extend `DataDashboardsView.vue` in place, because it already owns the data-dashboard route, API loading, preview drawer, and Element Plus layout. Fetch workbench list items through the existing `bigScreenApi`, map known role workbench IDs to cards with stable fallbacks, and derive data-dashboard groups from the current `ManagedDashboard[]`.

**Tech Stack:** Vue 3 Composition API, Vue Router, Element Plus, Vitest, Vue Test Utils, existing REST APIs.

---

## File Structure

- Modify `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`: add API mocks for `/api/big-screens` and tests for the overview panel.
- Modify `apps/web/src/features/data-dashboards/DataDashboardsView.vue`: add overview computed groups, role workbench loading, navigation helpers, and responsive styles.
- No backend changes. The existing big-screen and data-dashboard endpoints already provide the required demo data.

## Task 1: Test the Browsing Overview

**Files:**
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`

- [ ] **Step 1: Add role workbench mock rows**

```ts
const demoWorkbenchRows = [
  {
    id: 'dashboard-all',
    name: '未来实验学校数据总览',
    description: '全员可查看的校级驾驶舱',
    status: 'draft',
    updatedAt: '2026-07-09T10:30:00.000Z',
    publishedAt: null,
    visibleRoles: ['all-staff'],
    availability: 'enabled',
  },
  {
    id: 'dashboard-electro',
    name: '电教主任设备运维工作台',
    description: '设备在线、告警和应用巡检',
    status: 'draft',
    updatedAt: '2026-07-09T10:22:00.000Z',
    publishedAt: null,
    visibleRoles: ['electro-education-director'],
    availability: 'enabled',
  },
  {
    id: 'dashboard-moral',
    name: '德育主任学生成长工作台',
    description: '学生成长、德育活动和预警跟进',
    status: 'draft',
    updatedAt: '2026-07-09T10:18:00.000Z',
    publishedAt: null,
    visibleRoles: ['moral-education-director'],
    availability: 'enabled',
  },
  {
    id: 'dashboard-research',
    name: '教研主任教师发展工作台',
    description: '教研活动、教师发展和资源共建',
    status: 'draft',
    updatedAt: '2026-07-09T10:12:00.000Z',
    publishedAt: null,
    visibleRoles: ['teaching-research-director'],
    availability: 'enabled',
  },
]
```

- [ ] **Step 2: Extend the fetch mock**

```ts
if (parsedUrl.pathname === '/api/big-screens' && method === 'GET') {
  return jsonResponse(demoWorkbenchRows)
}
```

- [ ] **Step 3: Add failing overview test**

```ts
test('renders the data center overview with role workbench browsing cards', async () => {
  const { wrapper, fetchMock } = await mountDashboardView()

  expect(fetchMock).toHaveBeenCalledWith('/api/big-screens', expect.any(Object))
  expect(wrapper.text()).toContain('数据中心总览')
  expect(wrapper.text()).toContain('角色工作台')
  expect(wrapper.text()).toContain('默认数据看板')
  expect(wrapper.text()).toContain('第三方融合看板')
  expect(wrapper.text()).toContain('未来实验学校数据总览')
  expect(wrapper.text()).toContain('电教主任设备运维工作台')
  expect(wrapper.get('[data-testid="data-center-workbench-dashboard-all"]').attributes('href')).toBe(
    '/workbenches/dashboard-all',
  )
  expect(wrapper.get('[data-testid="data-center-workbench-dashboard-electro"]').attributes('href')).toBe(
    '/workbenches/dashboard-electro',
  )
})
```

- [ ] **Step 4: Add failing preview action test**

```ts
test('opens built-in and embedded dashboard previews from overview cards', async () => {
  const { wrapper } = await mountDashboardView()

  await wrapper.get('[data-testid="data-center-dashboard-dashboard-governance"]').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('配置数据看板')
  expect(wrapper.text()).toContain('治理事项')

  await wrapper.get('[data-testid="data-center-dashboard-dashboard-alarm"]').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('https://demo.school.local/alarm-bi')
  expect(wrapper.text()).toContain('今日告警')
})
```

- [ ] **Step 5: Run tests and verify RED**

Run: `npm --workspace apps/web run test -- DataDashboardsView.test.ts`

Expected: FAIL because `数据中心总览` and `data-center-*` selectors do not exist yet.

## Task 2: Implement Overview State and Markup

**Files:**
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.vue`

- [ ] **Step 1: Import big-screen API**

```ts
import { bigScreenApi, type DashboardListItem } from '../big-screen/api/bigScreenApi'
```

- [ ] **Step 2: Add role workbench state and fallback definitions**

```ts
const roleWorkbenches = ref<DashboardListItem[]>([])
const workbenchLoadWarning = ref('')

const roleWorkbenchFallbacks = [
  { id: 'dashboard-all', name: '未来实验学校数据总览', role: '全员', description: '校级治理、设备、教师和学生成长统一浏览' },
  { id: 'dashboard-electro', name: '电教主任设备运维工作台', role: '电教主任', description: '设备在线、告警闭环和应用接入态势' },
  { id: 'dashboard-moral', name: '德育主任学生成长工作台', role: '德育主任', description: '学生成长档案、德育活动和预警跟进' },
  { id: 'dashboard-research', name: '教研主任教师发展工作台', role: '教研主任', description: '教研活动、教师培训和资源共建' },
]
```

- [ ] **Step 3: Load workbenches alongside data dashboards**

```ts
async function loadWorkbenches() {
  workbenchLoadWarning.value = ''

  try {
    roleWorkbenches.value = await bigScreenApi.listDashboards({ credentials: 'include' })
  } catch {
    roleWorkbenches.value = []
    workbenchLoadWarning.value = '角色工作台暂用演示兜底数据'
  }
}

onMounted(() => {
  void Promise.all([loadDashboards(), loadWorkbenches()])
})
```

- [ ] **Step 4: Add computed card groups**

```ts
const roleWorkbenchCards = computed(() => {
  const byId = new Map(roleWorkbenches.value.map((workbench) => [workbench.id, workbench]))
  return roleWorkbenchFallbacks.map((fallback) => {
    const workbench = byId.get(fallback.id)
    return {
      ...fallback,
      name: workbench?.name ?? fallback.name,
      description: workbench?.description ?? fallback.description,
      status: workbench?.availability === 'disabled' ? '已停用' : '可浏览',
      path: `/workbenches/${fallback.id}`,
    }
  })
})

const defaultDashboardCards = computed(() => dashboards.value.filter((dashboard) => dashboard.isDefault))
const embeddedDashboardCards = computed(() => dashboards.value.filter((dashboard) => dashboard.source === '第三方嵌入'))
```

- [ ] **Step 5: Add overview markup**

Render a new `ElCard` above the existing summary cards with these sections:

```vue
<ElCard shadow="never" class="data-dashboards__overview">
  <template #header>
    <div class="data-dashboards__section-head">
      <div>
        <h2>数据中心总览</h2>
        <p>从这里直接浏览角色工作台、默认数据看板和第三方融合看板。</p>
      </div>
      <ElTag type="success" effect="plain">可演示</ElTag>
    </div>
  </template>
  <section aria-label="角色工作台">
    <h3>角色工作台</h3>
    <RouterLink
      v-for="workbench in roleWorkbenchCards"
      :key="workbench.id"
      :to="workbench.path"
      :data-testid="`data-center-workbench-${workbench.id}`"
    >
      {{ workbench.name }}
    </RouterLink>
  </section>
</ElCard>
```

Use `RouterLink` for role workbench cards and `ElButton` for data-dashboard preview cards.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm --workspace apps/web run test -- DataDashboardsView.test.ts`

Expected: PASS.

## Task 3: Polish and Full Verification

**Files:**
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.vue`
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`

- [ ] **Step 1: Add responsive CSS**

Add grid styles for overview cards, status tags, metric previews, and mobile single-column layout. Keep colors on the existing green token system and avoid nested card-in-card surfaces.

- [ ] **Step 2: Run targeted tests**

Run: `npm --workspace apps/web run test -- DataDashboardsView.test.ts`

Expected: PASS.

- [ ] **Step 3: Run broader checks**

Run: `npm run test`

Expected: PASS.

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Commit implementation**

```bash
git add apps/web/src/features/data-dashboards/DataDashboardsView.vue apps/web/src/features/data-dashboards/DataDashboardsView.test.ts docs/superpowers/plans/2026-07-04-data-center-browse-overview-plan.md
git commit -m "feat: add data center browse overview"
```
