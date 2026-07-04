# Smart Education Demo Delivery Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the smart education demo platform from partial demo coverage to a credible on-site demonstration for the active tender clauses, while keeping video transcription and video segment deletion deferred.

**Architecture:** Keep the existing Vue 3, Element Plus, Pinia, Vue Router, shared Zod schema, and Node API architecture. Complete the workbench compliance surface first by extending the existing big-screen designer metadata and component palette, then replace the `/teaching` placeholder with a simulated interactive teaching console, then harden overview, alarm, and demo-checklist flows.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Pinia, Vue Router, Vitest, Vue Test Utils, Zod, existing Node API routes, existing dashboard designer/runtime.

---

## Scope And Execution Order

Video transcription and transcript-linked video deletion are outside this plan. The smart blackboard text activity flow remains in scope only for regression protection and overview readiness accuracy.

Execution order:

1. P0 Workbench compliance.
2. P1 Interactive teaching console.
3. P2 Demo hardening and readiness controls.
4. Final PM audit.

Recommended execution mode: subagent-driven development, with one subagent per task and a main-agent review after each task.

## File Map

### Existing Files To Modify

- `packages/shared/src/dashboard-schema.ts`
  - Add component types needed for web embed and component-template-backed entries.
- `packages/shared/src/dashboard-schema.test.ts`
  - Assert new component types validate.
- `packages/shared/src/index.ts`
  - Export any new shared workbench metadata types if they are created.
- `apps/web/src/features/big-screen/components/registry.ts`
  - Keep renderer-family definitions and add template entries or new component definitions.
- `apps/web/src/features/big-screen/components/registry.test.ts`
  - Assert at least 30 visible palette entries.
- `apps/web/src/features/big-screen/components/renderers/WebEmbedRenderer.vue`
  - Render custom web dashboard/embed component.
- `apps/web/src/features/big-screen/designer/ComponentPalette.vue`
  - Switch from raw registry definitions to visible palette entries if component templates are introduced.
- `apps/web/src/features/big-screen/designer/DesignerPropertyPanel.vue`
  - Add URL/title fields for the web embed component.
  - Add allowlist warning copy for non-demo URLs.
- `apps/web/src/features/big-screen/designer/DashboardList.vue`
  - Show role visibility and enabled/disabled workbench availability.
- `apps/web/src/features/big-screen/api/bigScreenApi.ts`
  - Extend dashboard list/record types with demo workbench metadata if API returns it.
- `apps/api/src/dashboards/dashboard.repository.ts`
  - Seed or persist workbench metadata if the backend is used for P0.
- `apps/api/src/dashboards/dashboard.routes.ts`
  - Expose role visibility and enable/disable update endpoints if implementing backend-backed state.
- `apps/web/src/router.ts`
  - Replace `/teaching` placeholder with a dedicated interactive teaching page.
- `apps/web/src/features/shell/navigation.ts`
  - Keep 互动教学 visibility honest and role-aware.
- `apps/web/src/features/overview/overviewData.ts`
  - Update readiness statuses only after corresponding features ship.
- `apps/web/src/features/overview/OverviewView.vue`
  - Add or refine demo-readiness checklist if needed.
- `apps/web/src/features/alarms/AlarmManagementView.vue`
  - Harden the recording placeholder UI.

### New Files To Create

- `apps/web/src/features/big-screen/components/paletteEntries.ts`
  - Define at least 30 visible component entries that map to existing renderer families or new web embed.
- `apps/web/src/features/big-screen/components/paletteEntries.test.ts`
  - Assert count, uniqueness, renderer mapping, and required groups.
- `apps/web/src/features/big-screen/components/renderers/WebEmbedRenderer.vue`
  - Display third-party dashboard embed or fallback.
- `apps/web/src/features/big-screen/components/renderers/WebEmbedRenderer.test.ts`
  - Assert empty URL, safe URL, and blocked/unsupported URL states.
- `apps/web/src/features/big-screen/workbenches/workbenchMetadata.ts`
  - Define role labels, default workbench metadata, visibility helpers, enable/disable helpers.
- `apps/web/src/features/big-screen/workbenches/workbenchMetadata.test.ts`
  - Assert role filtering and availability rules.
- `apps/web/src/features/interactive-teaching/teachingSession.ts`
  - Pure state helpers for session, members, sharing, answer responder, layout, and focus mode.
- `apps/web/src/features/interactive-teaching/teachingSession.test.ts`
  - Unit tests for every required interactive teaching action.
- `apps/web/src/features/interactive-teaching/InteractiveTeachingView.vue`
  - Dedicated `/teaching` page.
- `apps/web/src/features/interactive-teaching/InteractiveTeachingView.test.ts`
  - Component tests for the demo workflow.
- `docs/superpowers/pm/demo-script.md`
  - Manual on-site demo script.

---

## Task 0: PM Baseline And Guardrails

**Files:**
- Read: `docs/superpowers/specs/2026-07-03-demo-delivery-priority-and-governance.md`
- Read: `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`
- Read: `docs/superpowers/pm/2026-07-03-demo-readiness-audit.md`

- [ ] **Step 1: Confirm the active priority order**

Read the three documents above before implementation. The active order must be:

1. P0 Workbench compliance.
2. P1 Interactive teaching console.
3. P2 Demo hardening.
4. P3 Video closure deferred.

Expected: No implementation task should start with video transcription, real RTC, hardware integration, or unrelated admin features.

- [ ] **Step 2: Confirm the route baseline**

Run:

```powershell
rg -n "path: 'teaching'|path: 'blackboard'|path: 'workbenches'|path: 'alarms'|path: 'applications'|path: 'data-dashboards'" apps/web/src/router.ts
```

Expected baseline:

- `/blackboard`, `/workbenches`, `/data-dashboards`, `/applications`, and `/alarms` point to dedicated pages.
- `/teaching` points to `OverviewView.vue` before P1 and must be replaced during P1.

- [ ] **Step 3: Confirm current palette count**

Run:

```powershell
@'
import re
from pathlib import Path
text = Path('apps/web/src/features/big-screen/components/registry.ts').read_text(encoding='utf-8')
print(len(re.findall(r"type:\\s*'([^']+)'", text)))
'@ | python -
```

Expected baseline: fewer than 30 visible component entries before P0.

---

## Task 1: Workbench Palette Entries And Component Count

**Files:**
- Create: `apps/web/src/features/big-screen/components/paletteEntries.ts`
- Create: `apps/web/src/features/big-screen/components/paletteEntries.test.ts`
- Modify: `apps/web/src/features/big-screen/designer/ComponentPalette.vue`
- Modify: `apps/web/src/features/big-screen/designer/designerLayout.ts`
- Modify: `apps/web/src/features/big-screen/components/registry.test.ts`

- [ ] **Step 1: Write failing tests for the palette contract**

Create `apps/web/src/features/big-screen/components/paletteEntries.test.ts` with assertions for:

- `getWorkbenchPaletteEntries()` returns at least 30 entries.
- Entry IDs are unique.
- Every entry maps to an existing component type.
- Required groups exist:
  - 数据指标
  - 图表组件
  - 设备状态
  - 告警组件
  - 应用入口
  - 表格组件
  - 文本图片
  - 第三方网页
- The third-party web entry maps to `web-embed`.

Run:

```powershell
npm --workspace apps/web run test -- paletteEntries
```

Expected: FAIL because the file does not exist.

- [ ] **Step 2: Create the palette entry model**

Create `apps/web/src/features/big-screen/components/paletteEntries.ts`.

The model should include:

- `WorkbenchPaletteGroup`
- `WorkbenchPaletteEntry`
- `getWorkbenchPaletteEntries()`
- `createComponentFromPaletteEntry(entryId, schema)`

Design rule:

- Do not create 30 renderer files.
- Use templates that map to renderer families such as metric card, line chart, area chart, bar chart, pie chart, radar chart, funnel chart, table, text, image, decoration, and web embed.

Minimum required entry examples:

- 今日告警
- 设备在线率
- 教师发展指数
- 学生成长指数
- 应用启用数
- 趋势折线图
- 面积趋势图
- 分类柱状图
- 横向排行图
- 环形占比图
- 玫瑰占比图
- 雷达能力图
- 漏斗转化图
- 设备健康卡
- 设备状态表
- 教室设备分布
- 在线离线汇总
- 告警数量卡
- 告警趋势图
- 告警等级分布
- 最新告警列表
- 处置进度表
- 应用快捷入口
- 应用分类列表
- 移动端应用状态
- 标准数据表
- 排名表
- 事件明细表
- 标题文本
- 段落说明
- 图片展示
- 装饰边框
- 第三方网页

Expected: 33 entries, allowing future pruning while staying above 30.

- [ ] **Step 3: Wire the palette UI to palette entries**

Modify `ComponentPalette.vue` so it renders palette entries instead of raw registry definitions.

Required visible fields:

- Entry title.
- Entry group or short description.
- Default size.
- Stable `data-testid` based on entry ID.

Expected behavior:

- Clicking an entry creates the mapped component with entry-specific defaults.
- The layout stays compact and scrollable.

- [ ] **Step 4: Update designer component creation**

Modify `apps/web/src/features/big-screen/designer/designerLayout.ts` if needed so component creation can accept a palette template.

Expected behavior:

- Existing direct component creation still works.
- New palette-template creation applies entry-specific props, style, and layout.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- paletteEntries ComponentPalette registry
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message:

```bash
git commit -m "feat: expand workbench component palette"
```

---

## Task 2: Third-Party Web Embed Component

**Files:**
- Modify: `packages/shared/src/dashboard-schema.ts`
- Modify: `packages/shared/src/dashboard-schema.test.ts`
- Modify: `apps/web/src/features/big-screen/components/registry.ts`
- Create: `apps/web/src/features/big-screen/components/renderers/WebEmbedRenderer.vue`
- Create: `apps/web/src/features/big-screen/components/renderers/WebEmbedRenderer.test.ts`
- Modify: `apps/web/src/features/big-screen/designer/DesignerPropertyPanel.vue`

- [ ] **Step 1: Write failing shared schema test**

Update `packages/shared/src/dashboard-schema.test.ts` to assert that `web-embed` is a valid component type and that a component with props `{ title, url }` parses.

Run:

```powershell
npm --workspace packages/shared run test -- dashboard-schema
```

Expected: FAIL because `web-embed` is not in the enum.

- [ ] **Step 2: Add shared component type**

Modify `packages/shared/src/dashboard-schema.ts`.

Add `web-embed` to `componentTypeValidator`.

Run:

```powershell
npm --workspace packages/shared run test -- dashboard-schema
```

Expected: PASS.

- [ ] **Step 3: Write renderer tests**

Create `WebEmbedRenderer.test.ts` with cases:

- Empty URL shows a fallback state containing `请配置第三方看板链接`.
- `https://demo.school.local/alarm-bi` shows an iframe or preview frame with title.
- `javascript:alert(1)` does not render an iframe and shows a blocked state.

Run:

```powershell
npm --workspace apps/web run test -- WebEmbedRenderer
```

Expected: FAIL because renderer does not exist.

- [ ] **Step 4: Implement renderer**

Create `WebEmbedRenderer.vue`.

Implementation requirements:

- Props match existing renderer convention: `component`.
- Read `component.props.title` and `component.props.url`.
- Only allow `http://` or `https://` URLs.
- Render an iframe for valid URLs.
- Render a clear fallback for empty or invalid URLs.
- Keep border radius 8px or less.
- Do not use decorative backgrounds.

- [ ] **Step 5: Register web embed**

Modify `registry.ts`.

Add:

- Type: `web-embed`
- Title: `第三方网页`
- Default layout: about `720 x 420`
- Default props: `{ title: '第三方数据看板', url: 'https://demo.school.local/alarm-bi' }`
- Property groups: `basic`, `data`, `style`
- Renderer: `WebEmbedRenderer`

- [ ] **Step 6: Add property panel controls**

Modify `DesignerPropertyPanel.vue`.

For `web-embed`, show:

- Title input.
- URL input.
- Warning text when URL is not `http://` or `https://`.
- Demo-safe note when URL starts with `https://demo.school.local`.

Expected behavior:

- Editing the URL updates the component preview.
- Invalid URL does not produce a live iframe.

- [ ] **Step 7: Run focused tests**

Run:

```powershell
npm --workspace packages/shared run test -- dashboard-schema
npm --workspace apps/web run test -- WebEmbedRenderer registry DesignerPropertyPanel
```

Expected: PASS.

- [ ] **Step 8: Commit**

Commit message:

```bash
git commit -m "feat: add third-party web embed component"
```

---

## Task 3: Workbench Role Visibility And Enablement

**Files:**
- Create: `apps/web/src/features/big-screen/workbenches/workbenchMetadata.ts`
- Create: `apps/web/src/features/big-screen/workbenches/workbenchMetadata.test.ts`
- Modify: `apps/web/src/features/big-screen/designer/DashboardList.vue`
- Modify: `apps/web/src/features/big-screen/designer/DashboardList.test.ts`
- Modify: `apps/web/src/features/overview/overviewData.ts`

- [ ] **Step 1: Write failing metadata tests**

Create `workbenchMetadata.test.ts`.

Required assertions:

- Default metadata contains 全员工作台, 电教主任工作台, 德育主任工作台, 教研主任工作台.
- `isWorkbenchAvailable(metadata, roles)` returns true only when status is enabled and role matches.
- System administrator can see all enabled workbenches.
- Disabled workbenches are hidden from non-admin role views.
- `toggleWorkbenchEnabled(metadata)` flips `已启用` to `已停用` and back.

Run:

```powershell
npm --workspace apps/web run test -- workbenchMetadata
```

Expected: FAIL because the file does not exist.

- [ ] **Step 2: Implement metadata helpers**

Create `workbenchMetadata.ts`.

Use these role labels:

- 系统管理员
- 全员
- 电教主任
- 德育主任
- 教研主任

Use these status labels:

- 已启用
- 已停用

The helper should not replace backend dashboard status. It should represent demo workbench availability and role visibility.

- [ ] **Step 3: Extend dashboard list UI**

Modify `DashboardList.vue`.

Add table columns or compact inline chips for:

- 使用角色
- 启用状态

Add row action:

- 启用 or 停用

Expected behavior:

- The row action changes the local demo metadata state.
- Status chips use green for 已启用 and neutral for 已停用.
- Role chips are compact.

- [ ] **Step 4: Add role visibility action**

Add a drawer or compact popover from the dashboard row that lets an administrator select visible roles using checkboxes.

Required roles:

- 全员
- 电教主任
- 德育主任
- 教研主任

Expected behavior:

- Saving updates chips on the list row.
- An empty role selection is rejected with a visible validation message.

- [ ] **Step 5: Update overview readiness only after UI works**

Modify `overviewData.ts`.

Update 工作台配置 readiness detail from generic reuse wording to a more precise detail, such as:

```ts
{ label: '工作台配置', status: '可演示', detail: '30+ 组件、角色可见和启停管理已接入' }
```

Only make this change after tests for Task 1, Task 2, and Task 3 pass.

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- workbenchMetadata DashboardList OverviewView
```

Expected: PASS.

- [ ] **Step 7: Browser verification**

Start the dev server on port 5174:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

Open:

```text
http://127.0.0.1:5174/workbenches
```

Verify:

- Role chips appear.
- Enable/disable action works.
- Role visibility edit works.
- The page remains table-first and compact.

- [ ] **Step 8: Commit**

Commit message:

```bash
git commit -m "feat: add role workbench visibility controls"
```

---

## Task 4: Interactive Teaching State Model

**Files:**
- Create: `apps/web/src/features/interactive-teaching/teachingSession.ts`
- Create: `apps/web/src/features/interactive-teaching/teachingSession.test.ts`

- [ ] **Step 1: Write failing state tests**

Create `teachingSession.test.ts`.

Required assertions:

- Seed session has a host and at least five members.
- `setMemberRole(session, memberId, '授课老师')` makes the selected member a teacher.
- `setMemberRole(session, memberId, '学生')` makes the selected member a student.
- `toggleWhiteboardShare(session)` flips whiteboard share state.
- `toggleDesktopShare(session)` flips desktop share state.
- `insertScreenshot(session)` appends a screenshot record with time and source.
- `launchAnswerQuestion(session, question)` creates answer responder state.
- `recordStudentAnswer(session, memberId, optionId)` records one answer per student.
- `selectLiveLayout(session, '白板优先')` updates layout.
- `toggleTeacherFocus(session)` updates teacher-speaking focus state.

Run:

```powershell
npm --workspace apps/web run test -- teachingSession
```

Expected: FAIL because the file does not exist.

- [ ] **Step 2: Implement pure state helpers**

Create `teachingSession.ts`.

Types:

- `TeachingMemberRole = '主讲人' | '授课老师' | '学生'`
- `TeachingShareMode = '未共享' | '共享中'`
- `TeachingLayout = '宫格' | '主讲' | '桌面优先' | '白板优先'`
- `TeachingMember`
- `TeachingScreenshot`
- `AnswerQuestion`
- `TeachingSession`

Seed data should include:

- 主讲人: 林老师
- 授课老师: 周老师
- Students: 至少 four named students
- One member in weak-network or muted state for visual realism

Expected behavior:

- Helpers return new state objects instead of mutating input.
- Student answer statistics are deterministic.

- [ ] **Step 3: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- teachingSession
```

Expected: PASS.

- [ ] **Step 4: Commit**

Commit message:

```bash
git commit -m "feat: add interactive teaching state model"
```

---

## Task 5: Interactive Teaching View And Route

**Files:**
- Create: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.vue`
- Create: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.test.ts`
- Modify: `apps/web/src/router.ts`
- Modify: `apps/web/src/router.test.ts`
- Modify: `apps/web/src/features/overview/overviewData.ts`

- [ ] **Step 1: Write failing component and route tests**

Create `InteractiveTeachingView.test.ts`.

Required assertions:

- Page renders `互动教学`.
- Member list renders role controls.
- Clicking 设为授课老师 updates member role text.
- Clicking 共享远程白板 updates stage state.
- Clicking 共享电脑桌面 updates stage state.
- Clicking 截屏插入 adds a screenshot record.
- Launching 答题器 shows answer statistics.
- Selecting `白板优先` updates the stage label.
- Toggling `教师发言时放大显示` updates the stage class or visible state.

Update `router.test.ts` to assert `/teaching` resolves to `InteractiveTeachingView`.

Run:

```powershell
npm --workspace apps/web run test -- InteractiveTeachingView router
```

Expected: FAIL because the page and route do not exist.

- [ ] **Step 2: Implement the view**

Create `InteractiveTeachingView.vue`.

Layout:

- Header with title and status chips.
- Center stage for whiteboard/desktop/live layout.
- Right member panel with role buttons.
- Lower panel for answer responder and layout controls.

Element Plus controls:

- `ElButton` for actions.
- `ElSwitch` for teacher focus.
- `ElSegmented` or `ElRadioGroup` for layout mode.
- `ElTag` for roles and statuses.
- `ElTable` or compact list for answer results.
- `ElEmpty` for no screenshots or inactive question state.

Do not imply real video transport. Use simulated stage states and neutral avatar placeholders.

- [ ] **Step 3: Replace the route placeholder**

Modify `router.ts`.

Change:

```ts
{ path: 'teaching', component: () => import('./features/overview/OverviewView.vue') },
```

To:

```ts
{ path: 'teaching', component: () => import('./features/interactive-teaching/InteractiveTeachingView.vue') },
```

- [ ] **Step 4: Update overview readiness**

Modify `overviewData.ts`.

Change the 互动教学 demo launch item to:

```ts
{ label: '互动教学', description: '远程白板与答题器', path: '/teaching', status: '可演示' },
```

Add a readiness row:

```ts
{ label: '互动教学', status: '可演示', detail: '角色切换、共享、截屏、答题器和布局控制已接入' },
```

Only update after route and component tests pass.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- teachingSession InteractiveTeachingView router OverviewView
```

Expected: PASS.

- [ ] **Step 6: Browser verification**

Start the dev server on port 5174:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

Open:

```text
http://127.0.0.1:5174/teaching
```

Verify:

- The page is not the overview page.
- Role assignment works.
- Whiteboard and desktop sharing controls visibly update the stage.
- Screenshot insert adds a record.
- Answer responder shows results.
- Layout switching changes stage emphasis.
- Teacher focus toggle visibly changes the active teacher presentation.

- [ ] **Step 7: Commit**

Commit message:

```bash
git commit -m "feat: add interactive teaching console"
```

---

## Task 6: Alarm Recording And Demo Checklist Hardening

**Files:**
- Modify: `apps/web/src/features/alarms/AlarmManagementView.vue`
- Modify: `apps/web/src/features/alarms/AlarmManagementView.test.ts`
- Modify: `apps/web/src/features/overview/OverviewView.vue`
- Modify: `apps/web/src/features/overview/OverviewView.test.ts`
- Modify: `apps/web/src/features/overview/overviewData.ts`
- Create: `docs/superpowers/pm/demo-script.md`

- [ ] **Step 1: Write failing alarm recording test**

Update `AlarmManagementView.test.ts`.

Required assertions:

- Opening alarm detail shows `事件触发录音`.
- Recording area exposes a play/pause button or stable audio-player-like control.
- Recording area shows duration text.
- Disposal timeline remains visible.

Run:

```powershell
npm --workspace apps/web run test -- AlarmManagementView
```

Expected: FAIL if current recording placeholder is not interactive enough.

- [ ] **Step 2: Harden recording UI**

Modify `AlarmManagementView.vue`.

Requirements:

- Use Element Plus button or icon button.
- Show `0:00 / 0:15` or seeded duration.
- Show a progress track.
- Keep clear copy that this is an event recording for the alarm detail.
- Do not require a real audio file.

- [ ] **Step 3: Write failing overview checklist test**

Update `OverviewView.test.ts`.

Required assertions:

- Overview shows a demo readiness/checklist area.
- It includes tender labels or module labels for:
  - 工作台配置
  - 告警管理
  - 互动教学
  - 智慧黑板
- Video capability is not presented as complete.

Run:

```powershell
npm --workspace apps/web run test -- OverviewView
```

Expected: FAIL until checklist copy and data are updated.

- [ ] **Step 4: Implement overview checklist**

Modify `OverviewView.vue` and `overviewData.ts`.

Checklist fields:

- Clause label.
- Module.
- Route.
- Status.
- Demo action.
- Risk note.

Status values:

- 可演示
- 部分可演示
- 暂缓

Required copy:

- 智慧黑板 should say text activity generation is demo-ready, video segment deletion is deferred.
- 互动教学 should say role assignment, sharing, screenshot, answer responder, layout, and teacher focus are demo-ready after P1.

- [ ] **Step 5: Create manual demo script**

Create `docs/superpowers/pm/demo-script.md`.

Required sections:

- Demo environment.
- Login.
- Clause ♦1 工作台配置 script.
- Clause ♦15 告警管理 script.
- Clause ♦27 互动教学 script.
- Clause ♦29 智慧黑板 script.
- Deferred video statement.
- Fallback plan if external embed URL cannot load.

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- AlarmManagementView OverviewView
```

Expected: PASS.

- [ ] **Step 7: Browser verification**

Open:

```text
http://127.0.0.1:5174/overview
http://127.0.0.1:5174/alarms
```

Verify:

- Overview can guide the demo without verbal improvisation.
- Alarm detail recording looks intentional.
- No new overflow or dense-card clutter appears.

- [ ] **Step 8: Commit**

Commit message:

```bash
git commit -m "fix: harden demo readiness flow"
```

---

## Task 7: Full Regression And PM Audit

**Files:**
- Modify: `docs/superpowers/pm/2026-07-03-demo-readiness-audit.md`
- Optionally modify: `docs/superpowers/pm/demo-script.md`

- [ ] **Step 1: Run full tests**

Run:

```powershell
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS. Existing bundle-size warnings are acceptable only if no new build error appears.

- [ ] **Step 4: Browser verify main routes**

Open these routes on port 5174:

- `/overview`
- `/workbenches`
- `/workbenches/:id`
- `/data-dashboards`
- `/applications`
- `/alarms`
- `/blackboard`
- `/teaching`

Expected:

- No protected route loops after login.
- No route displays unrelated placeholder content.
- No horizontal overflow at desktop width.
- Primary demo actions can be completed.

- [ ] **Step 5: Update PM audit**

Modify `docs/superpowers/pm/2026-07-03-demo-readiness-audit.md`.

Update:

- Current date/time of audit.
- Readiness percentages.
- Module status.
- Remaining gaps.
- Evidence from tests/build/browser verification.

- [ ] **Step 6: Final PM report**

Final report should include:

- What changed.
- Which tender clauses are now demo-ready.
- What remains deferred.
- Test/build/browser verification status.
- Updated overall readiness percentage.

---

## Self-Review

Spec coverage:

- P0 Workbench compliance is covered by Tasks 1, 2, and 3.
- P1 Interactive teaching is covered by Tasks 4 and 5.
- P2 Demo hardening is covered by Task 6.
- PM audit and delivery governance are covered by Task 7.
- P3 video closure is explicitly deferred and not implemented in this plan.

Placeholder scan:

- This plan intentionally uses status words such as `待开发`, `暂缓`, and `可演示` where they are product statuses.
- There are no unresolved implementation placeholders.

Type consistency:

- `web-embed` is introduced in shared schema before use in registry and palette.
- `TeachingSession`, `TeachingMember`, and related helper names are defined in Task 4 before use in Task 5.
- Overview readiness is updated only after corresponding UI and tests exist.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-03-demo-delivery-priority-implementation.md`. Two execution options:

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution: execute tasks in this session with checkpoints.

Recommended choice: Subagent-Driven, starting with Task 1 and Task 2 for P0 workbench compliance.
