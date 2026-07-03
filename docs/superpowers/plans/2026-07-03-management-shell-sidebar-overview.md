# Management Shell Sidebar Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a component-library-based smart education management shell with sidebar navigation, top bar, role-aware menu visibility, and a first usable overview page.

**Architecture:** Add Element Plus as the standard UI component library for management surfaces, while preserving the existing big-screen canvas/runtime components. Protected management routes render inside `AppShell`; public share/runtime presentation routes remain full-screen. Navigation visibility is driven by a typed route/menu contract that reads the current auth store roles.

**Tech Stack:** Vue 3, Vue Router, Pinia, TypeScript, Element Plus, @element-plus/icons-vue, Vitest, @vue/test-utils.

---

## Component Library Decision

Use **Element Plus** as the required component library for new management UI.

Use Element Plus for:

- Navigation: `ElMenu`, `ElMenuItem`, `ElSubMenu`, `ElScrollbar`.
- Layout primitives where useful: `ElContainer`, `ElAside`, `ElHeader`, `ElMain`.
- Actions and feedback: `ElButton`, `ElDropdown`, `ElBadge`, `ElTag`, `ElTooltip`, `ElAlert`.
- Data display: `ElTable`, `ElDescriptions`, `ElStatistic`, `ElProgress`, `ElTimeline`, `ElCard`.
- Forms and filters: `ElForm`, `ElInput`, `ElSelect`, `ElDatePicker`, `ElSwitch`, `ElCheckbox`, `ElRadioGroup`.
- Overlays: `ElDialog`, `ElDrawer`, `ElPopover`.
- Icons: `@element-plus/icons-vue`.

Native elements are still allowed for semantic landmarks and text structure: `main`, `section`, `header`, `nav`, `h1`, `p`, `span`. Custom CSS is allowed for layout shells, spacing, dark canvas surfaces, responsive behavior, and existing big-screen renderer internals.

Do not introduce custom button/input/select/table/dropdown implementations in new management pages unless Element Plus cannot cover the behavior.

## Full Development Roadmap

This plan implements Phase 1. Later phases should each get their own implementation plan.

1. **Management Shell and Overview**
   - Component library setup.
   - UI guideline constraints.
   - Sidebar and top bar.
   - Role-aware navigation.
   - Overview landing page.
   - Workbench aliases for the existing big-screen feature.

2. **Workbench Configuration**
   - Rename product surface from big screen to workbench in the management shell.
   - Add workbench enable/disable status.
   - Add role visibility controls.
   - Seed all-staff, electro-education director, moral education director, and teaching research director workbenches.
   - Expand component registry to at least 30 component entries.
   - Add third-party web embed component.

3. **Data Dashboard Management**
   - Seed at least six dashboards: 教育治理, 教师发展, 学生成长, 设备运维, 告警态势, 应用使用.
   - Reuse dashboard designer/runtime where practical.
   - Add dashboard category and role visibility metadata.
   - Add third-party dashboard URL embed path.

4. **Application Center**
   - Database-backed application records.
   - Web/mobile platform tags.
   - Categories.
   - Add/edit/disable/uninstall flows.
   - Role visible range controls.

5. **Alarm Management**
   - Database-backed alarm records and disposal records.
   - Table-first list with filters.
   - Detail drawer with responsible person phone, recording placeholder, and disposal timeline.
   - Status transition actions.

6. **Smart Blackboard**
   - Activity authoring page.
   - 选词填空, 判断对错, 趣味选择.
   - Deterministic parser for source text.
   - 删除语气词 switch.
   - Editable structured result and blackboard preview.

7. **Interactive Teaching**
   - Teaching console page.
   - Member role switching.
   - Whiteboard/share/desktop placeholders.
   - Answer responder.
   - Live layout selection and speaker focus toggle.

8. **Demo Polish**
   - Consistent demo data.
   - Route-level access checks.
   - Visual QA at desktop and laptop widths.
   - One-click demo script and README update.

---

## UI Specification Constraints

All workers touching management UI must read:

- `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`
- This plan's Component Library Decision section.

Implementation must follow these rules:

- Prefer Element Plus components for all standard controls.
- Do not create marketing hero pages.
- Use the shell pattern: left sidebar, top bar, independently scrolling content.
- Keep sidebar width between 220px and 260px on desktop.
- Keep top bar height between 56px and 64px.
- Keep card/panel/button/input radius at 8px or less.
- Avoid nested cards.
- Use table-first layouts for management pages.
- Use icons from `@element-plus/icons-vue`.
- Preserve the existing dark big-screen editor/runtime canvas behavior.
- Do not place the runtime/share full-screen routes inside the management shell.

## File Structure

- Modify `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`: add component-library rules.
- Modify `apps/web/package.json`: add Element Plus dependencies.
- Modify `apps/web/src/main.ts`: register Element Plus and import Element Plus styles.
- Create `apps/web/src/styles/element-theme.css`: bridge Element Plus CSS variables to existing tokens.
- Create `apps/web/src/features/shell/navigation.ts`: typed shell navigation contract and role filtering helpers.
- Create `apps/web/src/features/shell/navigation.test.ts`: menu order and visibility tests.
- Create `apps/web/src/features/shell/AppShell.vue`: management shell layout.
- Create `apps/web/src/features/shell/AppShell.test.ts`: shell render and outlet tests.
- Create `apps/web/src/features/shell/SidebarNav.vue`: Element Plus sidebar menu.
- Create `apps/web/src/features/shell/SidebarNav.test.ts`: active menu and role visibility tests.
- Create `apps/web/src/features/shell/TopBar.vue`: school name, role summary, user dropdown, logout.
- Create `apps/web/src/features/shell/TopBar.test.ts`: current user and logout tests.
- Create `apps/web/src/features/overview/overviewData.ts`: deterministic overview metrics and table data.
- Create `apps/web/src/features/overview/OverviewView.vue`: first management landing page.
- Create `apps/web/src/features/overview/OverviewView.test.ts`: overview render tests.
- Modify `apps/web/src/router.ts`: add shell route group and default `/overview`.
- Modify `apps/web/src/router.test.ts`: guard and public route expectations.
- Modify `apps/web/src/smoke.test.ts`: expected routes now include shell routes.
- Modify `README.md`: local URL remains 5174 and core flows mention overview/workbenches.

---

### Task 1: Add Component Library Rules to UI Guidelines

**Files:**
- Modify: `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`

- [ ] **Step 1: Read the current UI guidelines**

Run:

```powershell
Get-Content -LiteralPath 'docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md' -Encoding utf8
```

Expected: The file describes product feel, layout system, auth page, app shell, management pages, and workbench designer rules.

- [ ] **Step 2: Add the component library section**

Append this section after `Existing Design Inheritance`:

```markdown
## Component Library Rules

New management UI must use Element Plus as the standard component library. Use Element Plus for menus, buttons, forms, filters, tables, tags, badges, cards, statistics, progress, dropdowns, dialogs, drawers, popovers, alerts, and empty states. Use `@element-plus/icons-vue` for icons.

Native semantic elements are allowed for page landmarks and text structure, including `main`, `section`, `header`, `nav`, `h1`, `h2`, `p`, and `span`. Custom CSS is allowed for layout shells, spacing, role-aware surfaces, dark canvas areas, responsive behavior, and existing big-screen renderer internals.

Do not hand-roll custom button, input, select, table, menu, dropdown, dialog, drawer, tag, badge, or tooltip components for new management pages when Element Plus provides the behavior.

Element Plus theming must be bridged to the existing project tokens in `apps/web/src/styles/element-theme.css`. The visual result must still follow the smart education rules in this document: compact, calm, table-first, 8px radius or less, no marketing hero, no decorative gradient orbs, and no nested cards.
```

- [ ] **Step 3: Verify the guidelines contain the new section**

Run:

```powershell
Select-String -Path 'docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md' -Pattern 'Component Library Rules'
```

Expected: One match.

- [ ] **Step 4: Commit**

Run:

```powershell
git add docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md
git commit -m "docs: add component library UI rules"
```

---

### Task 2: Install and Theme Element Plus

**Files:**
- Modify: `apps/web/package.json`
- Modify: `package-lock.json`
- Modify: `apps/web/src/main.ts`
- Create: `apps/web/src/styles/element-theme.css`

- [ ] **Step 1: Install dependencies**

Run:

```powershell
npm --workspace apps/web install element-plus @element-plus/icons-vue
```

Expected: `apps/web/package.json` and `package-lock.json` include `element-plus` and `@element-plus/icons-vue`.

- [ ] **Step 2: Add Element Plus theme bridge**

Create `apps/web/src/styles/element-theme.css`:

```css
:root {
  --el-color-primary: var(--color-accent);
  --el-color-primary-light-9: var(--color-accent-soft);
  --el-color-danger: var(--color-danger);
  --el-color-success: var(--color-success);
  --el-bg-color: var(--color-panel);
  --el-bg-color-page: var(--color-page);
  --el-bg-color-overlay: var(--color-panel);
  --el-text-color-primary: var(--color-text);
  --el-text-color-regular: var(--color-text);
  --el-text-color-secondary: var(--color-text-muted);
  --el-border-color: var(--color-border);
  --el-border-color-light: var(--color-border);
  --el-border-radius-base: 8px;
  --el-border-radius-small: 6px;
  --el-font-size-base: 14px;
  --el-font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

.el-card {
  --el-card-border-radius: 8px;
}

.el-button {
  font-weight: 800;
}

.el-menu {
  border-right: 0;
}
```

- [ ] **Step 3: Register Element Plus**

Modify `apps/web/src/main.ts`:

```ts
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/tokens.css'
import './styles/element-theme.css'
import './styles/global.css'

createApp(App).use(createPinia()).use(router).use(ElementPlus).mount('#app')
```

- [ ] **Step 4: Run web type check**

Run:

```powershell
npm --workspace apps/web run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/web/package.json package-lock.json apps/web/src/main.ts apps/web/src/styles/element-theme.css
git commit -m "feat: add Element Plus UI foundation"
```

---

### Task 3: Add Typed Shell Navigation

**Files:**
- Create: `apps/web/src/features/shell/navigation.ts`
- Create: `apps/web/src/features/shell/navigation.test.ts`

- [ ] **Step 1: Write failing navigation tests**

Create `apps/web/src/features/shell/navigation.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import type { CurrentUser } from '@analytics/shared'
import { getVisibleShellNavItems, shellNavItems } from './navigation'

const adminUser: CurrentUser = {
  id: 'user-system-admin',
  username: 'admin',
  displayName: '系统管理员',
  status: 'active',
  roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
}

const allStaffUser: CurrentUser = {
  id: 'user-all-staff',
  username: 'all_staff',
  displayName: '全员演示账号',
  status: 'active',
  roles: [{ id: 'role-all-staff', code: 'all-staff', name: '全员' }],
}

describe('shell navigation', () => {
  test('keeps the smart education sidebar order', () => {
    expect(shellNavItems.map((item) => item.label)).toEqual([
      '首页总览',
      '工作台配置',
      '数据看板',
      '应用中心',
      '告警管理',
      '智慧黑板',
      '互动教学',
      '账号权限',
      '系统设置',
    ])
  })

  test('shows every management item to system administrators', () => {
    expect(getVisibleShellNavItems(adminUser).map((item) => item.path)).toEqual([
      '/overview',
      '/workbenches',
      '/data-dashboards',
      '/applications',
      '/alarms',
      '/blackboard',
      '/teaching',
      '/accounts',
      '/settings',
    ])
  })

  test('shows only allowed demo entries to all-staff users', () => {
    expect(getVisibleShellNavItems(allStaffUser).map((item) => item.path)).toEqual([
      '/overview',
      '/workbenches',
      '/data-dashboards',
      '/blackboard',
      '/teaching',
    ])
  })
})
```

- [ ] **Step 2: Run navigation tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- navigation
```

Expected: FAIL because `navigation.ts` does not exist.

- [ ] **Step 3: Add navigation contract**

Create `apps/web/src/features/shell/navigation.ts`:

```ts
import type { Component } from 'vue'
import type { CurrentUser, RoleCode } from '@analytics/shared'
import {
  Bell,
  Collection,
  DataAnalysis,
  Grid,
  HomeFilled,
  Monitor,
  Setting,
  Tickets,
  User,
} from '@element-plus/icons-vue'
import { isSystemAdmin } from '@analytics/shared'

export type ShellNavItem = {
  key: string
  label: string
  path: string
  icon: Component
  allowedRoles: RoleCode[] | 'all'
}

export const shellNavItems: ShellNavItem[] = [
  { key: 'overview', label: '首页总览', path: '/overview', icon: HomeFilled, allowedRoles: 'all' },
  {
    key: 'workbenches',
    label: '工作台配置',
    path: '/workbenches',
    icon: Grid,
    allowedRoles: ['system-admin', 'all-staff', 'electro-education-director', 'moral-education-director', 'teaching-research-director'],
  },
  {
    key: 'data-dashboards',
    label: '数据看板',
    path: '/data-dashboards',
    icon: DataAnalysis,
    allowedRoles: ['system-admin', 'all-staff', 'electro-education-director', 'moral-education-director', 'teaching-research-director'],
  },
  { key: 'applications', label: '应用中心', path: '/applications', icon: Collection, allowedRoles: ['system-admin', 'electro-education-director'] },
  { key: 'alarms', label: '告警管理', path: '/alarms', icon: Bell, allowedRoles: ['system-admin', 'electro-education-director'] },
  {
    key: 'blackboard',
    label: '智慧黑板',
    path: '/blackboard',
    icon: Tickets,
    allowedRoles: ['system-admin', 'all-staff', 'teaching-research-director'],
  },
  {
    key: 'teaching',
    label: '互动教学',
    path: '/teaching',
    icon: Monitor,
    allowedRoles: ['system-admin', 'all-staff', 'teaching-research-director'],
  },
  { key: 'accounts', label: '账号权限', path: '/accounts', icon: User, allowedRoles: ['system-admin'] },
  { key: 'settings', label: '系统设置', path: '/settings', icon: Setting, allowedRoles: ['system-admin'] },
]

export function getVisibleShellNavItems(user: CurrentUser | null): ShellNavItem[] {
  if (!user) return []
  if (isSystemAdmin(user)) return shellNavItems

  const roleCodes = new Set(user.roles.map((role) => role.code))
  return shellNavItems.filter((item) => (
    item.allowedRoles === 'all' || item.allowedRoles.some((roleCode) => roleCodes.has(roleCode))
  ))
}
```

- [ ] **Step 4: Run navigation tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- navigation
```

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/web/src/features/shell/navigation.ts apps/web/src/features/shell/navigation.test.ts
git commit -m "feat: add role-aware shell navigation"
```

---

### Task 4: Add Management Shell Components

**Files:**
- Create: `apps/web/src/features/shell/AppShell.vue`
- Create: `apps/web/src/features/shell/AppShell.test.ts`
- Create: `apps/web/src/features/shell/SidebarNav.vue`
- Create: `apps/web/src/features/shell/SidebarNav.test.ts`
- Create: `apps/web/src/features/shell/TopBar.vue`
- Create: `apps/web/src/features/shell/TopBar.test.ts`

- [ ] **Step 1: Write failing shell tests**

Create `apps/web/src/features/shell/SidebarNav.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { ShellNavItem } from './navigation'
import SidebarNav from './SidebarNav.vue'
import { HomeFilled, Grid } from '@element-plus/icons-vue'

const navItems: ShellNavItem[] = [
  { key: 'overview', label: '首页总览', path: '/overview', icon: HomeFilled, allowedRoles: 'all' },
  { key: 'workbenches', label: '工作台配置', path: '/workbenches', icon: Grid, allowedRoles: 'all' },
]

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/overview', component: { template: '<div>overview</div>' } },
      { path: '/workbenches', component: { template: '<div>workbenches</div>' } },
    ],
  })
  await router.push('/overview')
  await router.isReady()
  return router
}

describe('SidebarNav', () => {
  test('renders Element Plus menu entries in order', async () => {
    const router = await createTestRouter()
    const wrapper = mount(SidebarNav, {
      props: { navItems, activePath: '/overview' },
      global: { plugins: [ElementPlus, router] },
    })

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).toContain('工作台配置')
    expect(wrapper.find('.el-menu').exists()).toBe(true)
  })
})
```

Create `apps/web/src/features/shell/TopBar.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import TopBar from './TopBar.vue'
import { useAuthStore } from '../auth/stores/useAuthStore'

vi.mock('../auth/api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({ loggedOut: true }),
  },
}))

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/login', component: { template: '<div>login</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return router
}

describe('TopBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('renders the school name and current user', async () => {
    const router = await createTestRouter()
    const auth = useAuthStore()
    auth.user = {
      id: 'user-system-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
    }

    const wrapper = mount(TopBar, {
      props: { schoolName: '未来实验学校' },
      global: { plugins: [ElementPlus, router] },
    })

    expect(wrapper.text()).toContain('未来实验学校')
    expect(wrapper.text()).toContain('系统管理员')
    expect(wrapper.find('.el-dropdown').exists()).toBe(true)
  })
})
```

Create `apps/web/src/features/shell/AppShell.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppShell from './AppShell.vue'
import { useAuthStore } from '../auth/stores/useAuthStore'

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/overview', component: { template: '<div data-test="outlet">page</div>' } }],
  })
  await router.push('/overview')
  await router.isReady()
  return router
}

describe('AppShell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = {
      id: 'user-system-admin',
      username: 'admin',
      displayName: '系统管理员',
      status: 'active',
      roles: [{ id: 'role-system-admin', code: 'system-admin', name: '系统管理员' }],
    }
  })

  test('renders sidebar, top bar, and page outlet', async () => {
    const router = await createTestRouter()
    const wrapper = mount(AppShell, {
      global: {
        plugins: [ElementPlus, router],
      },
    })

    expect(wrapper.text()).toContain('智慧教育集控平台')
    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.find('[data-test="outlet"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run shell component tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- AppShell SidebarNav TopBar
```

Expected: FAIL because shell components do not exist.

- [ ] **Step 3: Add SidebarNav**

Create `apps/web/src/features/shell/SidebarNav.vue`:

```vue
<script setup lang="ts">
import type { ShellNavItem } from './navigation'

defineProps<{
  navItems: ShellNavItem[]
  activePath: string
}>()
</script>

<template>
  <nav class="sidebar-nav" aria-label="智慧教育主导航">
    <ElMenu :default-active="activePath" router>
      <ElMenuItem v-for="item in navItems" :key="item.key" :index="item.path">
        <ElIcon><component :is="item.icon" /></ElIcon>
        <span>{{ item.label }}</span>
      </ElMenuItem>
    </ElMenu>
  </nav>
</template>

<style scoped>
.sidebar-nav {
  min-height: 0;
}
</style>
```

- [ ] **Step 4: Add TopBar**

Create `apps/web/src/features/shell/TopBar.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, Bell } from '@element-plus/icons-vue'
import { useAuthStore } from '../auth/stores/useAuthStore'

defineProps<{
  schoolName: string
}>()

const router = useRouter()
const auth = useAuthStore()
const roleNames = computed(() => auth.user?.roles.map((role) => role.name).join(' / ') ?? '未登录')

async function logout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <header class="top-bar">
    <div class="top-bar__school">
      <strong>{{ schoolName }}</strong>
      <ElTag size="small" effect="plain">{{ roleNames }}</ElTag>
    </div>

    <div class="top-bar__actions">
      <ElBadge :value="3" class="top-bar__badge">
        <ElButton :icon="Bell" circle aria-label="通知" />
      </ElBadge>
      <ElDropdown trigger="click">
        <ElButton>
          {{ auth.user?.displayName ?? '未登录' }}
          <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
        </ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem disabled>{{ auth.user?.username ?? 'anonymous' }}</ElDropdownItem>
            <ElDropdownItem divided @click="logout">退出登录</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-panel);
}

.top-bar__school,
.top-bar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar__school strong {
  font-size: 16px;
}
</style>
```

- [ ] **Step 5: Add AppShell**

Create `apps/web/src/features/shell/AppShell.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../auth/stores/useAuthStore'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'
import { getVisibleShellNavItems } from './navigation'

const route = useRoute()
const auth = useAuthStore()
const navItems = computed(() => getVisibleShellNavItems(auth.user))
</script>

<template>
  <ElContainer class="app-shell">
    <ElAside width="240px" class="app-shell__aside">
      <div class="app-shell__brand">
        <strong>智慧教育集控平台</strong>
        <span>Smart Education Console</span>
      </div>
      <ElScrollbar>
        <SidebarNav :nav-items="navItems" :active-path="route.path" />
      </ElScrollbar>
    </ElAside>

    <ElContainer class="app-shell__body">
      <ElHeader height="60px" class="app-shell__header">
        <TopBar school-name="未来实验学校" />
      </ElHeader>
      <ElMain class="app-shell__main">
        <RouterView />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--color-page);
}

.app-shell__aside {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-panel);
}

.app-shell__brand {
  display: grid;
  gap: 4px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid var(--color-border);
}

.app-shell__brand strong {
  font-size: 16px;
  font-weight: 900;
}

.app-shell__brand span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.app-shell__body {
  min-width: 0;
}

.app-shell__header {
  padding: 0;
}

.app-shell__main {
  min-width: 0;
  padding: 20px;
}
</style>
```

- [ ] **Step 6: Run shell component tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- AppShell SidebarNav TopBar
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add apps/web/src/features/shell
git commit -m "feat: add smart education shell"
```

---

### Task 5: Add Overview Landing Page

**Files:**
- Create: `apps/web/src/features/overview/overviewData.ts`
- Create: `apps/web/src/features/overview/OverviewView.vue`
- Create: `apps/web/src/features/overview/OverviewView.test.ts`

- [ ] **Step 1: Write failing overview test**

Create `apps/web/src/features/overview/OverviewView.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import OverviewView from './OverviewView.vue'

describe('OverviewView', () => {
  test('renders overview KPIs and operational lists', () => {
    const wrapper = mount(OverviewView, {
      global: { plugins: [ElementPlus] },
    })

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).toContain('设备在线率')
    expect(wrapper.text()).toContain('今日告警')
    expect(wrapper.text()).toContain('工作台发布')
    expect(wrapper.findAll('.el-card').length).toBeGreaterThanOrEqual(4)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run overview test and verify it fails**

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: FAIL because `OverviewView.vue` does not exist.

- [ ] **Step 3: Add deterministic overview data**

Create `apps/web/src/features/overview/overviewData.ts`:

```ts
export const overviewKpis = [
  { label: '设备在线率', value: '98.6%', trend: '较昨日 +1.2%', status: 'success' },
  { label: '今日告警', value: '12', trend: '3 条待处理', status: 'warning' },
  { label: '工作台发布', value: '9', trend: '4 个角色可见', status: 'primary' },
  { label: '应用启用', value: '36', trend: '网页端 24 / 移动端 12', status: 'success' },
] as const

export const overviewAlarms = [
  { device: 'HB-3F-021', location: '三楼 302 教室', status: '待处理', owner: '王老师' },
  { device: 'IPANEL-104', location: '一楼 录播教室', status: '处理中', owner: '李老师' },
  { device: 'GATEWAY-07', location: '信息中心', status: '已解决', owner: '赵老师' },
]

export const overviewWorkbenches = [
  { name: '全员工作台', role: '全员', status: '已启用', update: '09:18' },
  { name: '电教主任工作台', role: '电教主任', status: '已启用', update: '08:42' },
  { name: '教研主任工作台', role: '教研主任', status: '草稿', update: '昨天' },
]
```

- [ ] **Step 4: Add Element Plus overview page**

Create `apps/web/src/features/overview/OverviewView.vue`:

```vue
<script setup lang="ts">
import { overviewAlarms, overviewKpis, overviewWorkbenches } from './overviewData'
</script>

<template>
  <main class="overview-view">
    <header class="overview-view__header">
      <div>
        <h1>首页总览</h1>
        <p>统一查看学校设备、告警、应用与角色工作台运行状态。</p>
      </div>
      <ElButton type="primary">进入演示模式</ElButton>
    </header>

    <ElRow :gutter="16">
      <ElCol v-for="item in overviewKpis" :key="item.label" :xs="24" :sm="12" :lg="6">
        <ElCard shadow="never" class="overview-view__kpi">
          <ElStatistic :title="item.label" :value="item.value" />
          <ElTag size="small" effect="plain">{{ item.trend }}</ElTag>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16" class="overview-view__grid">
      <ElCol :xs="24" :lg="14">
        <ElCard shadow="never">
          <template #header>
            <div class="overview-view__card-title">
              <strong>告警管理</strong>
              <ElTag type="danger" effect="plain">现场演示</ElTag>
            </div>
          </template>
          <ElTable :data="overviewAlarms" size="small">
            <ElTableColumn prop="device" label="设备标识符" min-width="120" />
            <ElTableColumn prop="location" label="发生位置" min-width="160" />
            <ElTableColumn prop="owner" label="责任人" width="90" />
            <ElTableColumn prop="status" label="状态" width="90" />
          </ElTable>
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :lg="10">
        <ElCard shadow="never">
          <template #header>
            <div class="overview-view__card-title">
              <strong>工作台发布</strong>
              <ElTag effect="plain">角色可见</ElTag>
            </div>
          </template>
          <ElTable :data="overviewWorkbenches" size="small">
            <ElTableColumn prop="name" label="工作台" min-width="140" />
            <ElTableColumn prop="role" label="角色" width="100" />
            <ElTableColumn prop="status" label="状态" width="90" />
            <ElTableColumn prop="update" label="更新" width="80" />
          </ElTable>
        </ElCard>
      </ElCol>
    </ElRow>
  </main>
</template>

<style scoped>
.overview-view {
  display: grid;
  gap: 18px;
}

.overview-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.overview-view__header h1,
.overview-view__header p {
  margin: 0;
}

.overview-view__header h1 {
  font-size: 26px;
  font-weight: 900;
}

.overview-view__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.overview-view__grid {
  row-gap: 16px;
}

.overview-view__kpi {
  min-height: 132px;
}

.overview-view__kpi :deep(.el-card__body) {
  display: grid;
  gap: 14px;
}

.overview-view__card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
```

- [ ] **Step 5: Run overview test and verify it passes**

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add apps/web/src/features/overview
git commit -m "feat: add smart education overview"
```

---

### Task 6: Route the Management Shell

**Files:**
- Modify: `apps/web/src/router.ts`
- Modify: `apps/web/src/router.test.ts`
- Modify: `apps/web/src/smoke.test.ts`

- [ ] **Step 1: Update router tests first**

Modify `apps/web/src/router.test.ts` to include these expectations:

```ts
test('redirects authenticated users from root to overview', async () => {
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(adminUser)
  const router = createTestRouter()

  await router.push('/')

  expect(router.currentRoute.value.fullPath).toBe('/overview')
})

test('keeps share and runtime presentation routes outside shell authorization loading', async () => {
  const router = createTestRouter()

  await router.push('/share/token-1')

  expect(router.currentRoute.value.fullPath).toBe('/share/token-1')
  expect(authApi.getCurrentUser).not.toHaveBeenCalled()
})
```

Modify `apps/web/src/smoke.test.ts` so expected route paths include:

```ts
expect(routePaths).toEqual(expect.arrayContaining([
  '/',
  '/login',
  '/overview',
  '/workbenches',
  '/workbenches/:id',
  '/data-dashboards',
  '/applications',
  '/alarms',
  '/blackboard',
  '/teaching',
  '/accounts',
  '/settings',
  '/runtime/:id',
  '/share/:token',
]))
```

- [ ] **Step 2: Run router tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- router smoke
```

Expected: FAIL because `/overview` and shell routes are not registered.

- [ ] **Step 3: Update router structure**

Modify `apps/web/src/router.ts`:

```ts
import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import { useAuthStore } from './features/auth/stores/useAuthStore'

const shellChildren: RouteRecordRaw[] = [
  { path: '', redirect: '/overview' },
  { path: 'overview', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'workbenches', component: () => import('./features/big-screen/designer/DashboardList.vue') },
  { path: 'workbenches/:id', component: () => import('./features/big-screen/designer/DesignerShell.vue') },
  { path: 'data-dashboards', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'applications', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'alarms', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'blackboard', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'teaching', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'accounts', component: () => import('./features/overview/OverviewView.vue') },
  { path: 'settings', component: () => import('./features/overview/OverviewView.vue') },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        component: () => import('./features/shell/AppShell.vue'),
        children: shellChildren,
      },
      { path: '/big-screens', redirect: '/workbenches' },
      { path: '/big-screens/:id', redirect: (to) => `/workbenches/${String(to.params.id)}` },
      {
        path: '/login',
        component: () => import('./features/auth/LoginView.vue'),
        meta: { public: true },
      },
      {
        path: '/runtime/:id',
        component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
        meta: { public: true },
      },
      {
        path: '/share/:token',
        component: () => import('./features/big-screen/runtime/RuntimeScreen.vue'),
        meta: { public: true },
      },
    ],
  })

  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (to.meta.public && to.path !== '/login') {
      return true
    }

    if (!auth.initialized) {
      await auth.loadCurrentUser()
    }

    if (to.meta.public) {
      if (to.path === '/login' && auth.isAuthenticated) return '/'
      return true
    }

    if (!auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    return true
  })

  return router
}

export const router = createAppRouter()
```

- [ ] **Step 4: Run router tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- router smoke
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/web/src/router.ts apps/web/src/router.test.ts apps/web/src/smoke.test.ts
git commit -m "feat: route management shell"
```

---

### Task 7: Verify Shell Integration Visually and Functionally

**Files:**
- Modify only if a prior task left failing tests or obvious integration issues.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- navigation AppShell SidebarNav TopBar OverviewView router smoke
```

Expected: PASS.

- [ ] **Step 2: Run web full test suite**

Run:

```powershell
npm --workspace apps/web run test
```

Expected: PASS.

- [ ] **Step 3: Run web lint**

Run:

```powershell
npm --workspace apps/web run lint
```

Expected: PASS.

- [ ] **Step 4: Run full build**

Run:

```powershell
npm run build
```

Expected: PASS. The existing Vite large chunk warning is acceptable.

- [ ] **Step 5: Manual local verification**

Start or reuse the dev servers:

```powershell
npm run dev
```

Open:

```text
http://localhost:5174/login
```

Use:

```text
admin / Admin@123
```

Expected:

- Login succeeds.
- App lands on `/overview`.
- Sidebar appears with all nine smart education menu items for admin.
- Top bar shows `未来实验学校`, role tag, notification button, and current user dropdown.
- `/share/<token>` and `/runtime/<id>` remain full-screen routes without sidebar.
- `/big-screens` redirects to `/workbenches`.

- [ ] **Step 6: Commit verification fixes if needed**

If Step 1 through Step 5 required changes:

```powershell
git add apps/web docs README.md package-lock.json
git commit -m "fix: stabilize management shell"
```

If no changes were required, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: This plan implements the app shell, sidebar order, role-aware navigation, top bar, default overview route, component library adoption, and UI guideline constraints requested for the next phase.
- Component library coverage: New management controls use Element Plus. Existing big-screen designer internals are preserved because they are specialized canvas/editor controls.
- Scope control: This plan does not implement application center, alarm management, smart blackboard, or interactive teaching pages beyond route placeholders. Those are separate later phases with their own plans.
- Route compatibility: `/big-screens` remains available as a redirect to `/workbenches`; public presentation routes stay outside the shell.
- Testing coverage: Navigation filtering, shell rendering, sidebar rendering, top bar current-user display, overview rendering, router guards, smoke routes, lint, build, and manual login verification are covered.
