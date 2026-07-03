# Overview Enterprise Console Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/overview` into a polished Stripe / Linear-style enterprise console for the smart education demo.

**Architecture:** Keep the existing `AppShell` and route structure. Replace the thin overview mock dataset with deterministic console data, then rebuild `OverviewView.vue` as a dense Element Plus-based operations console with KPI, alarm queue, system health, launch shortcuts, dashboard coverage, role workbench, and readiness areas.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vue Router, @vue/test-utils, Vitest, scoped CSS.

---

## File Structure

- Modify `apps/web/src/features/overview/overviewData.ts`
  - Owns deterministic overview mock data and small literal status types used by the page.
- Modify `apps/web/src/features/overview/OverviewView.vue`
  - Owns the `/overview` enterprise console layout, filter state, status mappings, and scoped visual treatment.
- Modify `apps/web/src/features/overview/OverviewView.test.ts`
  - Verifies the new page content and the alarm queue filter interaction.
- No router changes are required.
- No API changes are required.

---

### Task 1: Update Overview Tests First

**Files:**
- Modify: `apps/web/src/features/overview/OverviewView.test.ts`

- [ ] **Step 1: Replace the current broad smoke test with enterprise console expectations**

Update `OverviewView.test.ts` so it checks the new section labels and data:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import OverviewView from './OverviewView.vue'

async function mountOverview() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/overview', component: OverviewView },
      { path: '/workbenches', component: { template: '<div>workbenches</div>' } },
      { path: '/data-dashboards', component: { template: '<div>dashboards</div>' } },
      { path: '/applications', component: { template: '<div>applications</div>' } },
      { path: '/alarms', component: { template: '<div>alarms</div>' } },
      { path: '/blackboard', component: { template: '<div>blackboard</div>' } },
      { path: '/teaching', component: { template: '<div>teaching</div>' } },
    ],
  })

  await router.push('/overview')
  await router.isReady()

  const wrapper = mount(OverviewView, {
    global: { plugins: [ElementPlus, router] },
  })

  return { wrapper, router }
}

describe('OverviewView', () => {
  test('renders the enterprise console sections', async () => {
    const { wrapper } = await mountOverview()

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).toContain('现场演示')
    expect(wrapper.text()).toContain('设备在线率')
    expect(wrapper.text()).toContain('未处理告警')
    expect(wrapper.text()).toContain('告警优先级队列')
    expect(wrapper.text()).toContain('系统健康')
    expect(wrapper.text()).toContain('演示快捷入口')
    expect(wrapper.text()).toContain('数据看板覆盖')
    expect(wrapper.text()).toContain('角色工作台发布')
    expect(wrapper.text()).toContain('演示准备进度')
    expect(wrapper.find('.overview-view__console-grid').exists()).toBe(true)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  test('filters the alarm queue by event status', async () => {
    const { wrapper } = await mountOverview()

    expect(wrapper.text()).toContain('HB-3F-021')
    expect(wrapper.text()).toContain('IPANEL-104')

    await wrapper.get('[data-testid="alarm-filter-processing"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('HB-3F-021')
    expect(wrapper.text()).toContain('IPANEL-104')

    await wrapper.get('[data-testid="alarm-filter-all"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('HB-3F-021')
    expect(wrapper.text()).toContain('IPANEL-104')
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: FAIL because the current page does not render `告警优先级队列`, `系统健康`, filter test ids, or the new enterprise console grid.

---

### Task 2: Expand Overview Data

**Files:**
- Modify: `apps/web/src/features/overview/overviewData.ts`

- [ ] **Step 1: Replace the thin overview data with deterministic console data**

Use typed local data with these exports:

```ts
export type OverviewStatus = 'success' | 'warning' | 'danger' | 'primary' | 'info'

export type AlarmQueueStatus = '未处理' | '处理中' | '已处理'

export const overviewKpis = [
  {
    label: '设备在线率',
    value: 98.6,
    precision: 1,
    suffix: '%',
    trend: '较昨日 +1.2%',
    status: 'success',
    secondaryLabel: '在线设备',
    secondaryValue: '642 / 651',
  },
  {
    label: '未处理告警',
    value: 3,
    precision: 0,
    suffix: '',
    trend: '高优先级 1 条',
    status: 'danger',
    secondaryLabel: '今日上报',
    secondaryValue: '12 条',
  },
  {
    label: '已发布工作台',
    value: 9,
    precision: 0,
    suffix: '',
    trend: '覆盖 5 类角色',
    status: 'primary',
    secondaryLabel: '启用中',
    secondaryValue: '8 个',
  },
  {
    label: '启用应用',
    value: 36,
    precision: 0,
    suffix: '',
    trend: '网页端 24 / 移动端 12',
    status: 'success',
    secondaryLabel: '本周新增',
    secondaryValue: '4 个',
  },
] as const

export const priorityAlarms = [
  {
    severity: '高',
    deviceId: 'HB-3F-021',
    deviceName: '智慧黑板 302',
    location: '三楼 302 教室',
    owner: '王老师',
    trigger: '离线超过 5 分钟',
    status: '未处理',
    reportedAt: '09:42',
  },
  {
    severity: '中',
    deviceId: 'IPANEL-104',
    deviceName: '交互智能平板',
    location: '一楼 录播教室',
    owner: '李老师',
    trigger: '远程共享失败',
    status: '处理中',
    reportedAt: '09:18',
  },
  {
    severity: '低',
    deviceId: 'GATEWAY-07',
    deviceName: '班班通网关',
    location: '信息中心',
    owner: '赵老师',
    trigger: '心跳延迟',
    status: '已处理',
    reportedAt: '08:56',
  },
] as const satisfies ReadonlyArray<{
  severity: '高' | '中' | '低'
  deviceId: string
  deviceName: string
  location: string
  owner: string
  trigger: string
  status: AlarmQueueStatus
  reportedAt: string
}>

export const systemHealth = [
  { name: '设备连接服务', status: 'success', detail: '651 台设备接入', metric: '99.99%' },
  { name: '远程白板共享', status: 'success', detail: '12 个课堂可用', metric: '42ms' },
  { name: '应用中心', status: 'success', detail: '36 个应用启用', metric: '正常' },
  { name: '数据看板服务', status: 'warning', detail: '1 个第三方看板延迟', metric: '2.4s' },
  { name: '账号权限服务', status: 'success', detail: '5 类角色策略生效', metric: '正常' },
] as const satisfies ReadonlyArray<{
  name: string
  status: OverviewStatus
  detail: string
  metric: string
}>

export const demoLaunchItems = [
  { label: '工作台配置', description: '拖拽配置角色工作台', path: '/workbenches', status: '可演示' },
  { label: '数据看板', description: '教育治理与学生成长', path: '/data-dashboards', status: '待完善' },
  { label: '应用中心', description: '网页端与移动端应用', path: '/applications', status: '待开发' },
  { label: '告警管理', description: '设备事件筛选与处置', path: '/alarms', status: '待开发' },
  { label: '智慧黑板', description: '课堂活动智能生成', path: '/blackboard', status: '待开发' },
  { label: '互动教学', description: '远程白板与答题器', path: '/teaching', status: '待开发' },
] as const

export const dashboardCoverage = [
  { name: '教育治理', owner: '校长室', status: '已配置', updatedAt: '09:10' },
  { name: '教师发展', owner: '教研主任', status: '已配置', updatedAt: '08:44' },
  { name: '学生成长', owner: '德育主任', status: '已配置', updatedAt: '08:12' },
  { name: '设备运维', owner: '电教主任', status: '草稿', updatedAt: '昨天' },
  { name: '告警态势', owner: '信息中心', status: '草稿', updatedAt: '昨天' },
  { name: '应用使用', owner: '信息中心', status: '待接入', updatedAt: '未同步' },
] as const

export const roleWorkbenches = [
  { name: '全员工作台', role: '全员', status: '已启用', visibleTo: '全员', updatedAt: '09:18' },
  { name: '电教主任工作台', role: '电教主任', status: '已启用', visibleTo: '电教主任', updatedAt: '08:42' },
  { name: '德育主任工作台', role: '德育主任', status: '已启用', visibleTo: '德育主任', updatedAt: '08:30' },
  { name: '教研主任工作台', role: '教研主任', status: '草稿', visibleTo: '教研主任', updatedAt: '昨天' },
] as const

export const demoReadiness = [
  { label: '账号体系', status: '已完成', detail: '管理员与角色账号可登录' },
  { label: '管理 Shell', status: '已完成', detail: '侧边栏、顶部栏、角色菜单已接入' },
  { label: '工作台配置', status: '可演示', detail: '复用大屏拖拽编辑器' },
  { label: '告警与应用', status: '下一阶段', detail: '列表和详情页待开发' },
] as const
```

- [ ] **Step 2: Run the focused test and keep it RED**

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: Still FAIL because the view has not been rebuilt yet.

---

### Task 3: Rebuild the Overview Console

**Files:**
- Modify: `apps/web/src/features/overview/OverviewView.vue`

- [ ] **Step 1: Implement the new Element Plus console layout**

Replace the current `OverviewView.vue` with a layout that renders:

- Header with title, `现场演示`, `数据已同步`, `刷新数据`, and `进入演示模式`.
- KPI strip from `overviewKpis`.
- Alarm queue table from filtered `priorityAlarms`.
- System health list from `systemHealth`.
- Demo launch grid from `demoLaunchItems` with `RouterLink`.
- Bottom panels for `dashboardCoverage`, `roleWorkbenches`, and `demoReadiness`.

Important implementation details:

```ts
const alarmFilter = ref<'all' | AlarmQueueStatus>('all')

const filteredAlarms = computed(() =>
  alarmFilter.value === 'all'
    ? priorityAlarms
    : priorityAlarms.filter((alarm) => alarm.status === alarmFilter.value),
)
```

Filter buttons must include:

```vue
<ElButton data-testid="alarm-filter-all" ...>全部</ElButton>
<ElButton data-testid="alarm-filter-unhandled" ...>未处理</ElButton>
<ElButton data-testid="alarm-filter-processing" ...>处理中</ElButton>
```

Use scoped CSS to create:

- `.overview-view__console-grid`
- `.overview-view__kpi-grid`
- `.overview-view__operations-grid`
- `.overview-view__launch-grid`
- `.overview-view__bottom-grid`

Do not create nested cards. Use Element Plus panels and tables with restrained custom CSS.

- [ ] **Step 2: Run the focused test and verify GREEN**

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: PASS with the new render and filter tests.

- [ ] **Step 3: Run type check**

Run:

```powershell
npm --workspace apps/web run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add apps/web/src/features/overview/OverviewView.vue apps/web/src/features/overview/overviewData.ts apps/web/src/features/overview/OverviewView.test.ts
git commit -m "feat: redesign overview enterprise console"
```

---

### Task 4: Visual and Regression Verification

**Files:**
- Modify only if verification exposes visible defects.

- [ ] **Step 1: Run focused and full web tests**

Run:

```powershell
npm --workspace apps/web run test -- OverviewView AppShell router smoke
npm --workspace apps/web run test
```

Expected: PASS.

- [ ] **Step 2: Run lint and build**

Run:

```powershell
npm run lint
npm run build
```

Expected: PASS. Existing Vite chunk warnings are acceptable if no new errors appear.

- [ ] **Step 3: Browser verification**

Ensure dev servers are available on API `4000` and web `5174`, then open:

```text
http://localhost:5174/login
```

Log in with:

```text
admin / Admin@123
```

Verify at `1366 x 768`:

- `/overview` renders inside the management shell.
- Header, KPI strip, alarm queue, system health, launch grid, dashboard coverage, role workbench, and readiness areas are visible.
- Text does not overlap.
- The alarm filter changes visible rows.
- The page reads as a polished enterprise console with no hero, decorative gradient, or nested cards.

- [ ] **Step 4: Commit verification fixes if needed**

If visual verification requires CSS or test fixes:

```powershell
git add apps/web/src/features/overview
git commit -m "fix: polish overview console layout"
```

If no changes are needed, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: The tasks cover the spec's page header, KPI strip, primary operations grid, demo launch grid, bottom summary row, data model, alarm filter interaction, Element Plus component usage, tests, lint, and browser verification.
- Scope control: The plan does not implement Application Center, Alarm Management, Smart Blackboard, or Interactive Teaching feature pages.
- TDD: Task 1 creates failing tests before `overviewData.ts` or `OverviewView.vue` implementation changes.
- Visual risk: The final browser check is required because passing tests cannot prove the requested enterprise visual quality.
