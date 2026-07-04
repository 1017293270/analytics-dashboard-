# Demo Readiness Audit

Date: 2026-07-03

## Audit Purpose

This audit records the current baseline after comparing the tender document with the implemented project route. It is the starting point for future project-management reviews. The goal is not to describe every feature in the repository; the goal is to answer whether the platform can be demonstrated credibly against the active tender clauses.

## Current Role

From this point forward, the assistant should act as project manager for this project.

Project-manager stance:

- Keep the team focused on demonstrable tender compliance.
- Flag route placeholders, misleading readiness labels, and low-value detours.
- Keep video transcription and video segment deletion deferred unless the user explicitly re-prioritizes it.
- Review progress after every implementation batch.
- Report how far the system is from credible on-site demonstration.

## Current Overall Readiness

Estimated overall readiness: 93%.

This estimate uses the governance weights:

- P0 Workbench compliance: 35% weight, currently 92% complete for demo scope.
- P1 Interactive teaching: 30% weight, currently 90% complete for demo scope.
- P2 Demo hardening: 20% weight, currently 99% complete.
- Existing completed modules: 15% weight, currently 88% complete.

Interpretation:

- P0 workbench compliance is now credible for demo scope: 30+ palette templates, web embed, backend-backed default role workbenches, role filtering, and enable/disable demo state are in place.
- Interactive teaching now has a dedicated route and browser-verified controls for the agreed simulated demo scope.
- Demo hardening is credible enough for a guided on-site flow: alarm recording play/pause, overview readiness text, manual demo script, final rehearsal checklist, automated rehearsal gate, fallback screenshots, and browser short-rehearsal evidence are in place.
- The latest subagent PM review found no P0 blocker. The remaining P1/P2 findings were closed by aligning the July 9 demo dates, dashboard alarm metrics, overview role-visibility wording, final rehearsal script/checklist, and fallback screenshot assets.
- The remaining P0 caveat is production depth: workbench enablement is local demo persistence and direct route/API authorization is not yet a backend ACL boundary.
- Smart blackboard text activity creation is demo-ready enough for the agreed scope, but video transcription and transcript-linked video deletion must not be oversold.

## Module Status

| Area | Tender Clause | Current Status | PM Color | Demo Risk |
| --- | --- | --- | --- | --- |
| Account and shell | Enables role demo | Login, sidebar, route guard foundation exist | Green | Low |
| Workbench configuration | 集控 ♦1 | Drag designer, 30+ palette templates, web embed, backend-backed default role workbenches, role filtering, and enable/disable demo state exist | Green/Yellow | Medium |
| Data dashboards | 集控 ♦1 | Six dashboards, default three dashboards, third-party dashboard management page, and third-party preview metrics exist | Green | Low |
| Application center | 集控 ♦1 | Web/mobile records, categories, visibility, add/edit/uninstall/enable states exist | Green | Low |
| Alarm management | 集控 ♦15 | List, filters, detail, phone, recording play/pause control, and disposal records exist | Green | Low |
| Smart blackboard | 智慧黑板 ♦29 | Text activity parsing and editing exist; natural cloze-label input now generates blanks; video segment deletion deferred | Green/Yellow | Medium |
| Interactive teaching | 交互智能平板 ♦27 | Dedicated `/teaching` page supports role assignment, whiteboard/desktop sharing toggles, screenshot insert, answer responder, layout switching, and teacher focus | Green/Yellow | Medium |

## Evidence From Current Code

### Dedicated Routes

Current dedicated routes:

- `/workbenches`
- `/workbenches/:id`
- `/data-dashboards`
- `/applications`
- `/alarms`
- `/blackboard`
- `/teaching`

PM implication:

- Sidebar demo routes that are presented as ready now point to dedicated pages.
- Non-demo `/accounts` and `/settings` placeholders have been removed from the sidebar and route table to prevent live-demo misclicks.
- The remaining route-level risk is production depth rather than placeholder navigation.

### Workbench Component Count

Current `componentRegistry` renderer families:

- `metric-card`
- `line-chart`
- `area-chart`
- `bar-chart`
- `pie-chart`
- `radar-chart`
- `funnel-chart`
- `table`
- `text`
- `image`
- `decoration`
- `web-embed`

Current count: 12 renderer families.

PM implication:

- The tender asks for 工作台可配置组件数量 ≥30 个.
- The implemented route is 30+ visible palette entries mapped to a smaller set of renderer families.
- Presenter wording should use “30+ 组件模板” or “可配置组件入口” rather than “30 个完全独立渲染器”.

Current evidence:

- `paletteEntries.test.ts` asserts at least 30 entries, unique IDs, required groups, and schema-valid component creation.
- The third-party web entry maps to `web-embed`.

### Workbench Role And Enablement

Current strengths:

- `GET /api/big-screens` now ensures the four default role workbenches exist as real dashboard records.
- `GET /api/big-screens/:id` can fetch `dashboard-all`, `dashboard-electro`, `dashboard-moral`, and `dashboard-research` for editing.
- Workbench rows show role chips and availability state.
- Current auth-store role names filter visible workbenches; system administrator sees all.
- Enable/disable writes to browser storage and survives component remount.

Current caveats:

- Enable/disable is local browser demo persistence, not backend persistence.
- Role filtering is list-level frontend filtering for demo purposes, not route/API-level access control.

### Smart Blackboard

Current strengths:

- `/blackboard` exists.
- Supports 选词填空, 判断对错, 趣味选择.
- Supports 一键解析.
- Supports 删除语气词.
- Supports manual editing of structured activity fields.
- Shows blackboard-style preview.

Current deferred area:

- Video segment synchronized deletion is explicitly not enabled.

PM implication:

- Smart blackboard can remain in the demo if the presenter emphasizes classroom activity intelligent filling.
- Do not promise real video extraction or transcript-linked deletion in the next demo.

###集控 Management Pages

Current strengths:

- `/data-dashboards` supports six dashboards and third-party embedding management.
- `告警态势` dashboard metrics now match the alarm seed totals.
- Third-party dashboard preview now displays the dashboard metrics inside the stable preview frame.
- `/applications` supports app management for web and mobile records.
- `/alarms` supports operational alarm management.
- Alarm detail now includes an event-trigger recording UI with play/pause state.
- Overview alarm quick links now use device identifiers that exist in the alarm detail seed data.
- Overview KPI counts now use demo-scope seed numbers from the alarm, application, and workbench seed data.
- Overview no longer presents synthetic third-party dashboard latency metrics.
- The data-dashboard application-usage seed metrics now match the application-center seed data.

Current hardening need:

- Keep the presenter on the scripted demo order so simulated states are framed honestly.
- Do not imply the recording player is connected to a real audio stream unless a real media backend is later added.

## Priority Backlog

### P0: Workbench Compliance

Status: demo-ready with production caveats.

Completed:

- 30+ visible palette entries.
- Third-party web embed component in the designer.
- URL validation aligned across schema, property panel, and renderer for demo-safe URLs.
- Role visibility metadata.
- Enable/disable demo state.
- Backend-backed default role workbench presets.
- Honest overview readiness update.

Remaining P0 caveats:

- Backend persistence for workbench availability.
- Route/API-level authorization for direct workbench access.
- Production-grade backend persistence and ACL remain future work; the current state is suitable for the agreed demo scope.

### P1: Interactive Teaching

Status: demo-ready with simulation caveats.

Completed:

- Dedicated `/teaching` route.
- Member role assignment.
- Remote whiteboard sharing toggle.
- Desktop sharing toggle.
- Screenshot insert.
- Answer responder.
- Live layout control.
- Teacher-speaking focus toggle.

Verified behavior:

- Role switching updates member rows.
- Whiteboard and desktop sharing states update the classroom stage.
- Layout switching changes real stage classes, not just text.
- Teacher-speaking focus applies the enlarged visual state to the teacher tile.
- Answer responder launches a visible question and seeded answer results.

Remaining P1 caveats:

- No real RTC, real remote desktop, remote whiteboard protocol, or teacher audio detection.
- Presenter must describe this as a classroom-control simulation for software-function demonstration.

### P2: Demo Hardening

Status: mostly demo-ready.

Completed:

- Alarm recording polish.
- Overview demo checklist.
- Manual demo script.
- Final rehearsal checklist.
- Final browser short rehearsal.
- July 9 demo seed date alignment for visible alarm timestamps.
- Overview role wording downgraded from production-style permission claims to role-visibility demo wording.
- Data-dashboard alarm metrics aligned with alarm seed data.
- Third-party dashboard preview metrics added for live demonstration.
- Smart blackboard cloze parsing fixed so `选词填空：...答案：...` natural input generates `____`.
- Browser QA notes.
- Final readiness audit update.
- Fallback screenshot asset set and screenshot index.
- Automated Playwright demo rehearsal gate.

Remaining P2 work:

- One final dry run at the actual presentation resolution and machine.
- Freeze demo accounts and seed data before July 9.
- Clear or reset browser storage key `analytics-dashboard.workbench-availability.v1` before the formal run so all four role workbenches show enabled.

### P3: Video Closure

Current priority: deferred.

Only activate if:

- User explicitly re-prioritizes it.
- Tender evaluator requires this exact item in live software demonstration.
- P0 and P1 are already demo-ready.

Recommended future first slice:

- Simulated timestamped transcript and visual timeline deletion.

## Drift Watchlist

Flag drift immediately if work moves toward:

- Real video processing before P0/P1.
- Real RTC, real remote desktop, or live whiteboard protocol.
- New generic admin modules unrelated to the tender demo.
- Visual redesigns that do not improve P0/P1/P2.
- Backend persistence expansion before a frontend demo closure exists.
- Marking `/teaching` as `可演示` while it still routes to overview.
- Marking workbench compliance complete while the palette is under 30 visible entries.
- Claiming third-party dashboard embed is complete without a designer web component.
- Reintroducing sidebar entries for unimplemented routes during demo hardening.
- Adding overview quick links whose target IDs do not exist in the destination page seed data.
- Adding overview or dashboard KPI values that are not traceable to current demo seed data.
- Adding latency, availability, or real-time service metrics for simulated demo-only capabilities.

## Test And Build Evidence

Latest verification:

- `npm --workspace packages/shared run test -- dashboard-schema`: 11 tests passed.
- `npm --workspace apps/web run test -- registry paletteEntries ComponentPalette WebEmbedRenderer DesignerPropertyPanel workbenchMetadata DashboardList`: 40 tests passed.
- `npm --workspace apps/api run test -- dashboard.routes dashboard.workflow`: 31 tests passed.
- `npm --workspace apps/web run test -- teachingSession InteractiveTeachingView router OverviewView`: 27 tests passed.
- `npm --workspace apps/web run test -- OverviewView navigation router smoke AlarmManagementView`: 23 tests passed.
- `npm --workspace apps/web run test -- OverviewView dashboardData`: 12 tests passed.
- `npm --workspace apps/web run test -- alarmData AlarmManagementView OverviewView dashboardData DataDashboardsView`: 29 tests passed.
- `npm --workspace apps/web run test -- DataDashboardsView dashboardData`: 13 tests passed.
- `npm --workspace apps/web run test -- blackboardActivity SmartBlackboardView`: 22 tests passed.
- `npm --workspace apps/web run test -- router`: 9 tests passed.
- `npm run test`: 315 tests passed.
- `npm run build`: shared, web, and API builds passed.
- `npm run lint`: shared, web, and API type/lint checks passed.
- `npm run demo:rehearsal`: 2 Playwright projects passed, `Desktop Chrome 1366x768` and `Large Screen Chrome 1920x1080`.
- `npm --workspace apps/web run lint`: web type/lint checks passed after adding the demo rehearsal gate.

Latest browser verification on `http://127.0.0.1:5174`:

- Login with the seeded system-admin account succeeded.
- `/workbenches` showed the four backend-backed default role workbenches.
- The default workbench links pointed to `/workbenches/dashboard-all`, `/workbenches/dashboard-electro`, `/workbenches/dashboard-moral`, and `/workbenches/dashboard-research`.
- Opening `/workbenches/dashboard-electro` loaded the designer without a load-failed state.
- The designer showed 34 palette entries.
- Adding `第三方网页` worked and exposed the default URL `https://demo.school.local/alarm-bi` in the property panel.
- Browser console contained no errors during the checked flow.
- `/overview` showed `互动教学演示` and `模拟课堂控制台可用`; old overpromising `42ms` remote-whiteboard wording was absent.
- `/overview` showed seed-aligned KPI values: 未处理告警 `4`, 今日上报 `8 条`, 角色工作台 `4`, 已启用 `4 个`, 演示应用 `8`, 网页端 `5`, 移动端 `3`, 已启用 `6 个`.
- `/overview` now presents role coverage as `角色可见性演示 / 菜单与工作台可见范围可演示 / 可演示`, avoiding production ACL wording.
- `/overview` showed `数据看板服务 / 2 个第三方嵌入看板接入 / 可演示`; old `第三方看板延迟 / 2.4s` wording was absent.
- `/overview` no longer shows stale `IPANEL-104` or `GATEWAY-07` alarm links; it shows `HB-3F-021`, `DVR-1-201-01`, and `ACC-1-001-01`.
- `/overview` alarm links for `HB-3F-021`, `DVR-1-201-01`, and `ACC-1-001-01` each opened `/alarms?device=...` with the detail drawer, phone, and recording UI.
- Sidebar browser verification showed no `账号权限` or `系统设置` placeholder menu item.
- `/data-dashboards` no longer exposed the old `36 / 网页端 24 / 移动端 12` application-usage metrics; data-layer tests lock the metrics to the application-center seed.
- `/data-dashboards` `告警态势` now uses `今日告警 8 / 未处理 4`, matching `seedAlarms`.
- `/data-dashboards` `告警态势` preview now visibly shows `今日告警 8 / 未处理 4`.
- `/applications` browser verification showed 应用总数 `8`, 网页端 `5`, 移动端 `3`, 已启用 `6`, with category, visible scope, enable/disable, uninstall, and open actions visible.
- `/alarms` visible seed timestamps now use the July 9 presentation date, `2026-07-09`.
- `/blackboard` browser verification confirmed natural input `选词填空：指南针...答案：指南针` generates a `____` blank in the preview.
- `/blackboard` video tab browser verification showed `不接入真实视频处理`, `转写结果预览`, and `视频片段同步删除：暂未启用`, with no claim of automatic video-segment deletion.
- `/teaching` browser verification passed: role assignment, whiteboard sharing, desktop sharing, screenshot insert, answer responder, whiteboard-priority layout, and teacher-speaking focus all changed visible state.
- `/teaching` stage class changed to `is-layout-whiteboard`; teacher video tile changed to `is-focused`.
- `/alarms?device=HB-3F-021` opened the alarm detail with responsible person phone, disposal records, and event-trigger recording.
- Alarm recording toggle changed from `播放` to `暂停` and back to `播放`; browser console contained no local application errors during the checked flow.
- Final browser short rehearsal passed overview, workbenches, data dashboards, application center, alarms, teaching, and blackboard gates with no local application console errors.
- Fallback screenshots were captured in `docs/superpowers/pm/screenshots/2026-07-03-final-rehearsal/`.
- Screenshot index was added at `docs/superpowers/pm/fallback-assets.md`.
- Visually reviewed key fallback images for workbench web embed, data-dashboard third-party preview, interactive teaching stage/control states, and smart-blackboard activity parsing.
- Automated rehearsal gate was added at `apps/web/e2e/demo-rehearsal.spec.ts` and exposed as `npm run demo:rehearsal`.
- The automated gate covers login, sidebar route scope, overview seed KPIs, workbench list/designer/web embed, data-dashboard third-party preview metrics, application summary/actions, alarm filter/detail/recording/status action, interactive teaching role/share/layout/focus states, smart-blackboard activity parsing, video-deferred boundary, and final return to overview.
- The gate captures local page errors and local console errors during the scripted path, while allowing the known third-party iframe storage-permission noise for demo-safe embedded URLs.

Build warnings:

- Vite reports existing large chunks and third-party Rollup pure-comment warnings.
- These are not demo blockers, but should stay outside the P0/P1 critical path unless performance becomes visible in browser QA.

## Next PM Checkpoint

The next checkpoint should focus on final demo reliability rather than broad new functionality:

- Run the full demo script end-to-end on the actual presentation machine.
- Use `docs/superpowers/pm/final-rehearsal-checklist.md` as the pass/fail gate for the full rehearsal.
- Run `npm run demo:rehearsal` after every UI-upgrade agent batch before doing manual QA.
- Confirm `analytics-dashboard.workbench-availability.v1` is cleared or all four workbenches are enabled before opening the workbench route.
- Confirm ports `5174` and `4000` are available or update the script.
- Confirm seed data persists after restarting frontend and API dev servers.
- Check the UI-upgrade agent's changes against the route list and demo script.
- Keep the fallback screenshot set synchronized if the UI-upgrade agent changes route layout, labels, or seed values.
- Review whether any visible wording implies real RTC, real recording, or real video processing.

## Demo Readiness Target

Minimum credible on-site demonstration target: 82%.

This requires:

- P0 at least 90%.
- P1 at least 85%.
- P2 at least 75%.
- Existing completed modules remain at least 80%.

Strong demonstration target: 90%.

This requires:

- All P0/P1/P2 routes browser verified.
- Overview checklist matches actual state.
- Manual demo script written.
- No route placeholders in sidebar items that are presented as ready.
- Deferred video capability clearly labeled.
