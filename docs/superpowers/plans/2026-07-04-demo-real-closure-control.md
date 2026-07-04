# Demo Real Closure Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the current tender demo from frontend-simulated flows to B-grade verifiable loops for backend permissions/persistence, video ASR/editing, and interactive teaching local state sync without destabilizing the July 9 demonstration.

**Architecture:** Keep the current Vue 3 + Element Plus + Express + Prisma SQLite monorepo. Implement in phase gates: first make identity, role, management data, and workbench availability backend-backed; then add a controlled video pipeline with real upload, timestamped transcript editing, and conditional FFmpeg export; finally add a local two-tab classroom state-sync path using WebSocket. Native RTC/WebRTC desktop media remains deferred and must not be presented as completed.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Pinia, Vue Router, Vitest, Vue Test Utils, Playwright, Express, Prisma SQLite, Zod, Node `crypto/fs/path`, optional FFmpeg CLI, optional local Whisper CLI/service, `ws`.

---

## PM Control Position

The main agent remains the project manager and reviewer. Subagents execute bounded tasks only after the plan, with disjoint ownership where possible. The main agent reviews each returned patch against these gates:

- Tender alignment: every change must map to 智慧黑板 ♦29, 交互智能平板 ♦27, 集控 ♦1, 集控 ♦15, or the account/permission foundation needed to demo them.
- Demo stability: the existing successful route flow must keep working before deeper realism is accepted.
- Honesty: ASR fixture mode, local FFmpeg fallback, local WebSocket state sync, and demo-grade persistence must be visible in docs and not oversold as production capability.
- TDD: workers must write or update tests first, run the focused failing test, then implement.
- Review cadence: after each task, run focused tests; after each phase, run `npm run test`, `npm run lint`, `npm run build`, and `npm run demo:rehearsal`.

## Priority Decision

Priority order is locked as:

1. **P0 后端权限/持久化**: highest leverage, lowest demo disruption, improves all management pages.
2. **P1 视频 ASR 与剪辑**: useful but must avoid claiming real cloud ASR without a key/model.
3. **P2 互动教学本地状态同步**: visually useful but limited to local WebSocket sync; native RTC/WebRTC remains deferred.

This is intentionally not a production IAM/media/RTC build. The goal is B-grade demonstrability: real input, real state transition, real persistence or local network state sync where feasible, and clear fallback where external media dependencies are unavailable.

## Current Baseline

Known green baseline from the previous audit:

- `npm run test` passed with 333 tests.
- `npm run lint` passed.
- `npm run build` passed with only known chunk-size and Rollup comment warnings.
- `npm run demo:rehearsal` passed at 1366x768 and 1920x1080.
- Browser evidence exists under `docs/superpowers/pm/screenshots/2026-07-04-final-audit/`.

Known simulated or mock areas:

- Dashboard private routes use `DEFAULT_ACTOR_ID = 'demo-user'` and not the logged-in user.
- Account, application, alarm, data-dashboard pages are mostly frontend seed state.
- Workbench role visibility and enablement are demo metadata/localStorage, not backend ACL/persistence.
- Smart blackboard video tab is a deferred placeholder.
- Interactive teaching defaults to a single-tab local-state console; `?room=` enables local WebSocket state sync only, not RTC/WebRTC media.

## Out Of Scope For This Plan

- SSO, MFA, SMS/email reset, production organization tree, full permission matrix UI.
- Real SQL/dataset/AI data adapters.
- Production cloud ASR unless an API key/model is explicitly provided.
- Multi-speaker diarization, waveform precision editing, long-video queueing, object storage.
- LiveKit/SFU/TURN deployment, production multi-room RTC scaling, automatic teacher voice detection.
- Hardware alarm ingestion and real notification delivery.

---

## Phase 0: Baseline Guard

**Owner:** Main PM agent

**Files:**
- Read: `AGENTS.md`
- Read: `README.md`
- Read: `docs/superpowers/pm/2026-07-03-demo-readiness-audit.md`
- Read: `docs/superpowers/pm/final-rehearsal-checklist.md`

- [ ] **Step 1: Confirm clean worktree before dispatch**

Run:

```powershell
git status --short
```

Expected: no output, or only files created by this plan.

- [ ] **Step 2: Confirm baseline gates still pass before merging risky media work**

Run after each phase, not after every tiny commit:

```powershell
npm run test
npm run lint
npm run build
npm run demo:rehearsal
```

Expected: all pass. Build warnings already documented are acceptable; new TypeScript, test, or route errors are not.

- [ ] **Step 3: Commit this control plan**

Run:

```powershell
git add docs/superpowers/plans/2026-07-04-demo-real-closure-control.md
git commit -m "docs: add real closure control plan"
```

Expected: one docs commit that becomes the handoff source for subagents.

---

## Phase 1: Backend Permissions And Persistence

**PM Decision:** This phase starts first. It must finish before interactive-teaching realtime code is merged. Video work may start in parallel only after Phase 1 Task 1 is green.

### Task 1.1: Backend Actor And Dashboard Permission Boundary

**Worker ownership:** API dashboard/auth boundary only. The worker is not alone in the codebase and must not revert unrelated edits.

**Files:**
- Modify: `apps/api/src/dashboards/dashboard.routes.ts`
- Modify: `apps/api/src/dashboards/dashboard.permissions.ts`
- Modify: `apps/api/src/dashboards/dashboard.repository.ts`
- Modify: `apps/api/src/auth/auth.seed.ts`
- Modify: `apps/api/tests/dashboard.routes.test.ts`
- Modify: `apps/api/tests/dashboard.workflow.test.ts`
- Modify: `apps/api/tests/auth.routes.test.ts`
- Read: `docs/security/big-screen-security.md`

- [ ] **Step 1: Write failing auth-boundary tests**

Add tests that prove:

- Anonymous `GET /api/big-screens` returns `401`.
- Logged-in `admin / Admin@123` can list workbenches.
- Logged-in `all_staff / Demo@123` sees only role-visible/default workbenches.
- A non-visible role cannot fetch `dashboard-electro` by direct ID.
- Public share route `/api/public/big-screens/:shareToken` remains accessible without a session.

Run:

```powershell
npm --workspace apps/api run test -- dashboard.routes dashboard.workflow
```

Expected: fail because private dashboard routes do not yet require auth and permissions still use `demo-user`.

- [ ] **Step 2: Implement request actor resolution**

Implementation contract:

- Add a small helper that reads `req.auth.user` and returns `{ actorId, roleCodes, isSystemAdmin }`.
- Put public share route before private auth enforcement.
- Apply `requireAuth` to private dashboard routes.
- Replace `DEFAULT_ACTOR_ID` usage in route handlers with the logged-in actor.
- Preserve `DEFAULT_WORKSPACE_ID` for demo workspace until a production tenant model exists.

Permission contract:

- `system-admin` has owner-like dashboard access in the demo workspace.
- User-specific `DashboardPermission` still works.
- Role-specific `DashboardPermission` works with `subjectType = 'role'` and `subjectId = role.code`.
- `getDashboardPermission` returns the strongest permission across user and role subjects.

- [ ] **Step 3: Seed role permissions for default role workbenches**

Seed expectations:

- `dashboard-all`: role `all-staff` gets `view`; `system-admin` sees through admin bypass.
- `dashboard-electro`: role `electro-education-director` gets `view`.
- `dashboard-moral`: role `moral-education-director` gets `view`.
- `dashboard-research`: role `teaching-research-director` gets `view`.
- Default owner permissions for legacy `demo-user` may remain only if tests need backward compatibility, but route decisions must use the logged-in user.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
npm --workspace apps/api run test -- dashboard.routes dashboard.workflow auth.routes
npm --workspace apps/api run lint
```

Expected: pass.

Commit:

```powershell
git add apps/api/src/dashboards apps/api/src/auth apps/api/tests
git commit -m "feat: enforce dashboard auth and role permissions"
```

### Task 1.2: Account API Persistence

**Worker ownership:** account API and shared account contracts only. Do not touch application/alarm/data-dashboard UI in this task.

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Add migration: `apps/api/prisma/migrations/20260704113000_account_profile_fields/migration.sql`
- Create: `packages/shared/src/accounts.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `packages/shared/src/accounts.test.ts`
- Create: `apps/api/src/auth/account.routes.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/auth/auth.seed.ts`
- Create: `apps/api/tests/account.routes.test.ts`

- [ ] **Step 1: Write shared validator tests**

Test these contracts:

- Account row includes `id`, `username`, `displayName`, `phone`, `status`, `roleCodes`, `lastLoginAt`.
- Account create input requires username, displayName, at least one role, and password.
- Account update input permits displayName, phone, status, and roleCodes.

Run:

```powershell
npm --workspace packages/shared run test -- accounts
```

Expected: fail because `packages/shared/src/accounts.ts` does not exist.

- [ ] **Step 2: Add Prisma profile fields**

Schema contract:

- `User.phone String?`
- `User.lastLoginAt DateTime?`

Migration contract:

```sql
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME;
```

After editing:

```powershell
npm --workspace apps/api run prisma:generate
```

Expected: Prisma client generated successfully.

- [ ] **Step 3: Write API route tests**

Test these behaviors:

- `system-admin` can list accounts in demo order.
- `system-admin` can create an account with one or more roles.
- `system-admin` can update display name, phone, status, and role bindings.
- `system-admin` can reset a password and the new password logs in.
- Non-admin users receive `403`.
- Anonymous users receive `401`.

Run:

```powershell
npm --workspace apps/api run test -- account.routes
```

Expected: fail because route does not exist.

- [ ] **Step 4: Implement account routes**

Route contract:

- `GET /api/accounts`
- `POST /api/accounts`
- `PATCH /api/accounts/:id`
- `POST /api/accounts/:id/reset-password`

Security contract:

- Every route uses `requireAuth`.
- Every route checks `system-admin`.
- Password hashes use existing `hashPassword`.
- Responses use shared validators before returning.
- Status values stay `active | disabled`; frontend can translate to Chinese labels.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm --workspace packages/shared run test -- accounts
npm --workspace apps/api run test -- account.routes auth.routes role.routes
npm --workspace packages/shared run lint
npm --workspace apps/api run lint
```

Expected: pass.

Commit:

```powershell
git add packages/shared/src apps/api/prisma apps/api/src apps/api/tests
git commit -m "feat: add persistent account management api"
```

### Task 1.3: Accounts Frontend API Integration

**Worker ownership:** accounts frontend only. Do not alter backend routes beyond test-driven client assumptions.

**Files:**
- Create: `apps/web/src/features/accounts/accountApi.ts`
- Create: `apps/web/src/features/accounts/accountApi.test.ts`
- Modify: `apps/web/src/features/accounts/accountData.ts`
- Modify: `apps/web/src/features/accounts/accountData.test.ts`
- Modify: `apps/web/src/features/accounts/AccountsView.vue`
- Modify: `apps/web/src/features/accounts/AccountsView.test.ts`

- [ ] **Step 1: Write account API client tests**

Test:

- API client sends credentials.
- Response validation rejects malformed account data.
- Create/update/reset methods target the exact routes from Task 1.2.

Run:

```powershell
npm --workspace apps/web run test -- accountApi
```

Expected: fail because `accountApi.ts` does not exist.

- [ ] **Step 2: Convert view to backend-backed state**

View contract:

- Load `GET /api/accounts` and `GET /api/roles` on mount.
- Keep the existing green Element Plus visual style.
- Keep reset-demo-state as a visible UI action only if it calls a backend route or clearly resets only local form state.
- Show loading and error states through Element Plus components.
- Keep role menu/workbench preview logic deterministic.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
npm --workspace apps/web run test -- accountApi accountData AccountsView
npm --workspace apps/web run lint
```

Expected: pass.

Commit:

```powershell
git add apps/web/src/features/accounts
git commit -m "feat: connect accounts page to api"
```

### Task 1.4: Workbench Availability Persistence

**Worker ownership:** workbench metadata persistence only. Do not change palette, renderer, or visual design.

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Add migration: `apps/api/prisma/migrations/20260704120000_workbench_settings/migration.sql`
- Modify: `apps/api/src/dashboards/dashboard.repository.ts`
- Modify: `apps/api/src/dashboards/dashboard.routes.ts`
- Modify: `apps/api/tests/dashboard.routes.test.ts`
- Modify: `apps/web/src/features/big-screen/api/bigScreenApi.ts`
- Modify: `apps/web/src/features/big-screen/designer/DashboardList.vue`
- Modify: `apps/web/src/features/big-screen/designer/DashboardList.test.ts`
- Modify: `docs/superpowers/pm/final-rehearsal-checklist.md`

- [ ] **Step 1: Write failing backend tests**

Test:

- Dashboard list includes `visibleRoles` and `availability`.
- Admin can `PATCH /api/big-screens/:id/workbench-settings`.
- Non-admin receives `403`.
- Disabled workbench is hidden from non-admin list but visible to admin with disabled status.

Run:

```powershell
npm --workspace apps/api run test -- dashboard.routes
```

Expected: fail because settings route/model does not exist.

- [ ] **Step 2: Add model and route**

Schema contract:

- `WorkbenchSetting.dashboardId String @id`
- `WorkbenchSetting.visibleRoles String`
- `WorkbenchSetting.availability String`
- relation to `Dashboard`

Route body contract:

- `visibleRoles`: non-empty array of role display names or role codes; normalize to role codes in storage if possible.
- `availability`: `enabled | disabled`.

- [ ] **Step 3: Replace frontend localStorage dependency**

Frontend contract:

- Remove reliance on `analytics-dashboard.workbench-availability.v1`.
- Persist enable/disable and role visibility through the API.
- Keep copy/publish/edit actions unchanged.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
npm --workspace apps/api run test -- dashboard.routes dashboard.workflow
npm --workspace apps/web run test -- bigScreenApi DashboardList workbenchMetadata
npm --workspace apps/api run lint
npm --workspace apps/web run lint
```

Expected: pass.

Commit:

```powershell
git add apps/api/prisma apps/api/src/dashboards apps/api/tests apps/web/src/features/big-screen docs/superpowers/pm/final-rehearsal-checklist.md
git commit -m "feat: persist workbench visibility settings"
```

### Task 1.5: Management Pages API Backing

**Worker ownership:** applications, data dashboards, alarms. This task can be split into three workers if the first four tasks are green.

**Files:**
- Create: `packages/shared/src/applications.ts`
- Create: `packages/shared/src/dataDashboards.ts`
- Create: `packages/shared/src/alarms.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Add migration: `apps/api/prisma/migrations/20260704123000_management_modules/migration.sql`
- Create: `apps/api/src/applications/application.routes.ts`
- Create: `apps/api/src/data-dashboards/dataDashboard.routes.ts`
- Create: `apps/api/src/alarms/alarm.routes.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/auth/auth.seed.ts`
- Create: `apps/web/src/features/applications/applicationApi.ts`
- Create: `apps/web/src/features/applications/applicationApi.test.ts`
- Modify: `apps/web/src/features/applications/applicationData.ts`
- Modify: `apps/web/src/features/applications/applicationData.test.ts`
- Modify: `apps/web/src/features/applications/ApplicationCenterView.vue`
- Modify: `apps/web/src/features/applications/ApplicationCenterView.test.ts`
- Create: `apps/web/src/features/data-dashboards/dashboardApi.ts`
- Create: `apps/web/src/features/data-dashboards/dashboardApi.test.ts`
- Modify: `apps/web/src/features/data-dashboards/dashboardData.ts`
- Modify: `apps/web/src/features/data-dashboards/dashboardData.test.ts`
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.vue`
- Modify: `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`
- Create: `apps/web/src/features/alarms/alarmApi.ts`
- Create: `apps/web/src/features/alarms/alarmApi.test.ts`
- Modify: `apps/web/src/features/alarms/alarmData.ts`
- Modify: `apps/web/src/features/alarms/alarmData.test.ts`
- Modify: `apps/web/src/features/alarms/AlarmManagementView.vue`
- Modify: `apps/web/src/features/alarms/AlarmManagementView.test.ts`

- [ ] **Step 1: Split the task if needed**

Preferred split:

- Worker A: application center persistence.
- Worker B: data dashboard persistence.
- Worker C: alarm persistence and disposal updates.

Each worker must own separate API folder, shared contract file, feature folder, and tests.

- [ ] **Step 2: Require backend role checks**

Permission contract:

- `system-admin` can read and mutate all three modules.
- `electro-education-director` can read/mutate applications and alarms.
- Dashboard visibility follows role visibility.
- Non-visible role data is not returned by the API.

- [ ] **Step 3: Preserve demo seed counts**

Seed counts must remain:

- Applications: total 8, web 5, mobile 3, enabled 6.
- Data dashboards: total 6, default 3, embedded 2.
- Alarms: total 8, unhandled 4, processing 2, resolved 2.

- [ ] **Step 4: Verify phase**

Run:

```powershell
npm run test
npm run lint
npm run build
npm run demo:rehearsal
```

Expected: pass. The demo route order remains unchanged.

Commit:

```powershell
git add packages/shared/src apps/api/prisma apps/api/src apps/api/tests apps/web/src/features/applications apps/web/src/features/data-dashboards apps/web/src/features/alarms
git commit -m "feat: persist management demo modules"
```

---

## Phase 2: Smart Blackboard Video ASR And Editing

**PM Decision:** This phase starts only after Phase 1 Task 1 is green. Default mode is honest fixture ASR plus real upload/time-axis editing. Local Whisper and FFmpeg are optional enhancements, not mandatory demo assumptions.

### Task 2.1: Shared Video Editing Contract

**Files:**
- Create: `packages/shared/src/blackboardVideo.ts`
- Create: `packages/shared/src/blackboardVideo.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write failing shared contract tests**

Test:

- Transcript segments require `id`, `startMs`, `endMs`, `text`, and `words`.
- Cut ranges require `startMs < endMs`.
- Filler detection result includes `word`, `segmentId`, `startMs`, `endMs`.
- Export state supports `not-started | processing | ready | unavailable | failed`.

Run:

```powershell
npm --workspace packages/shared run test -- blackboardVideo
```

Expected: fail before contract exists.

- [ ] **Step 2: Implement validators and helpers**

Helper contract:

- `detectFillerWords(transcript, fillerWords)`
- `mergeCutRanges(cutRanges)`
- `buildTranscriptText(transcript, cutRanges)`
- `createDemoTranscriptForMedia(mediaId)`

Do not depend on browser APIs in shared code.

### Task 2.2: API Upload, Transcript, Cut Plan, Export

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/env.ts`
- Create: `apps/api/src/blackboard/blackboardVideo.routes.ts`
- Create: `apps/api/src/blackboard/media.service.ts`
- Create: `apps/api/src/blackboard/asr.service.ts`
- Create: `apps/api/src/blackboard/videoEdit.service.ts`
- Create: `apps/api/tests/blackboardVideo.routes.test.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Add route tests first**

Test:

- Anonymous upload returns `401`.
- Logged-in upload accepts one small video-like file and returns a media asset record.
- Transcript endpoint returns timestamped demo segments in fixture mode.
- Cut-plan endpoint stores cut ranges and returns merged ranges.
- Export endpoint returns `unavailable` when FFmpeg is not configured.

Run:

```powershell
npm --workspace apps/api run test -- blackboardVideo.routes
```

Expected: fail because routes do not exist.

- [ ] **Step 2: Implement upload and local storage**

Storage contract:

- Use a repository-local ignored folder such as `uploads/blackboard/`.
- Limit upload size to a demo-safe value such as 200 MB.
- Accept only video MIME types and known extensions.
- Store metadata in SQLite if a media table is added; otherwise store a JSON sidecar next to the file for this B-grade slice.

- [ ] **Step 3: Implement ASR fixture and optional local provider**

Provider contract:

- `ASR_MODE=fixture` always works.
- `ASR_MODE=local-whisper` tries configured command/service and falls back to fixture with an explicit warning field.
- No external ASR key is required for the default demo.

- [ ] **Step 4: Implement export plan**

Export contract:

- If FFmpeg path is available, generate an edited MP4 from merged cut ranges.
- If FFmpeg is unavailable, export JSON and VTT/SRT editing artifacts and return `unavailable` for MP4.
- API response must explicitly say whether real MP4 export happened.

### Task 2.3: Smart Blackboard UI Integration

**Files:**
- Create: `apps/web/src/features/smart-blackboard/blackboardVideoApi.ts`
- Create: `apps/web/src/features/smart-blackboard/blackboardVideoApi.test.ts`
- Modify: `apps/web/src/features/smart-blackboard/SmartBlackboardView.vue`
- Modify: `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`
- Modify: `docs/superpowers/pm/demo-script.md`
- Modify: `docs/superpowers/pm/final-rehearsal-checklist.md`

- [ ] **Step 1: Write UI tests first**

Test:

- Upload panel shows selected video and transcript status.
- Filler words appear as removable chips with time ranges.
- Removing a chip adds a cut range.
- Manual segment removal updates transcript text and edit plan.
- Export button shows MP4 ready or fallback artifact status.

Run:

```powershell
npm --workspace apps/web run test -- blackboardVideoApi SmartBlackboardView
```

Expected: fail before UI/API client exists.

- [ ] **Step 2: Implement UI with honest labels**

Required labels:

- Fixture mode: `演示转写`
- Local Whisper mode: `本地识别`
- FFmpeg missing: `已生成剪辑方案，未生成视频文件`
- MP4 ready: `已生成剪辑视频`

- [ ] **Step 3: Verify phase**

Run:

```powershell
npm --workspace packages/shared run test -- blackboardVideo
npm --workspace apps/api run test -- blackboardVideo.routes
npm --workspace apps/web run test -- blackboardVideoApi SmartBlackboardView blackboardActivity
npm run lint
npm run build
npm run demo:rehearsal
```

Expected: pass.

Commit:

```powershell
git add packages/shared/src apps/api/src/blackboard apps/api/tests apps/web/src/features/smart-blackboard docs/superpowers/pm .gitignore apps/api/package.json
git commit -m "feat: add smart blackboard video edit demo loop"
```

---

## Phase 3: Interactive Teaching Local State Sync Loop

**PM Decision:** Start after Phase 1 is stable and only if Phase 2 does not threaten the July 9 demo. Use `ws` for local classroom state sync first. Native WebRTC remains deferred; do not introduce LiveKit in this sprint.

### Task 3.1: WebSocket Room Skeleton

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/env.ts`
- Create: `packages/shared/src/teachingRealtime.ts`
- Create: `packages/shared/src/teachingRealtime.test.ts`
- Create: `apps/api/src/teaching/roomStore.ts`
- Create: `apps/api/src/teaching/teachingRealtime.ts`
- Create: `apps/api/tests/teachingRealtime.test.ts`
- Modify: `apps/web/vite.config.ts`

- [x] **Step 1: Write protocol tests first**

Test:

- Join creates a room snapshot.
- Role change event mutates room state.
- Layout event broadcasts to all room clients.
- Responder answer replaces the same student previous answer.
- Signaling messages are relayed without being interpreted as room state.

Run:

```powershell
npm --workspace packages/shared run test -- teachingRealtime
npm --workspace apps/api run test -- teachingRealtime
```

Expected: fail before protocol/server exists.

- [x] **Step 2: Add `ws` server**

Server contract:

- Bind WebSocket upgrade to existing HTTP server in `apps/api/src/index.ts`.
- For this local demo slice, clients must `join` a room before sending mutation events. Full session-cookie authorization for WebSocket rooms is deferred.
- Keep room state in memory.
- Broadcast room snapshots and events to clients with the same `roomId`.

### Task 3.2: Frontend Room State Integration

**Files:**
- Create: `apps/web/src/features/interactive-teaching/teachingRealtimeClient.ts`
- Create: `apps/web/src/features/interactive-teaching/useTeachingRoom.ts`
- Modify: `apps/web/src/features/interactive-teaching/teachingSession.ts`
- Modify: `apps/web/src/features/interactive-teaching/teachingSession.test.ts`
- Modify: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.vue`
- Modify: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.test.ts`

- [x] **Step 1: Write hook/client tests first**

Test:

- Client builds `ws://` or `wss://` URL from current origin.
- Hook falls back to local seeded session if WebSocket is unavailable.
- When connected, role/layout/focus actions emit protocol events instead of only local mutation.
- Received snapshots update the displayed session.

Run:

```powershell
npm --workspace apps/web run test -- teachingRealtimeClient teachingSession InteractiveTeachingView
```

Expected: fail before client/hook exists.

- [x] **Step 2: Keep demo fallback**

Fallback contract:

- If WebSocket connection fails, the current single-tab demo still works.
- The UI displays `实时连接未启用` rather than breaking the route.
- Demo rehearsal must still pass without opening a second tab.

### Task 3.3: Whiteboard, Responder, Layout, Focus Sync

**Files:**
- Create: `apps/web/src/features/interactive-teaching/TeachingWhiteboard.vue`
- Create: `apps/web/src/features/interactive-teaching/TeachingResponder.vue`
- Modify: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.vue`
- Modify: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.test.ts`
- Modify: `apps/web/e2e/demo-rehearsal.spec.ts`

- [ ] **Step 1: Write component tests first**

Test:

- Teacher whiteboard stroke appears locally and emits event.
- Student view applies remote whiteboard stroke.
- Teacher publishes a question.
- Student answers through UI.
- Teacher view aggregates answer counts.
- Layout and teacher focus visibly update stage classes.

Run:

```powershell
npm --workspace apps/web run test -- InteractiveTeachingView
```

Expected: fail before components are wired.

### Task 3.4: Deferred Native Screen Share And Screenshot

**Files:**
- Create: `apps/web/src/features/interactive-teaching/teachingWebrtc.ts`
- Create: `apps/web/src/features/interactive-teaching/TeachingDesktopShare.vue`
- Modify: `packages/shared/src/teachingRealtime.ts`
- Modify: `apps/api/src/teaching/teachingRealtime.ts`
- Modify: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.vue`
- Modify: `apps/web/src/features/interactive-teaching/InteractiveTeachingView.test.ts`
- Modify: `docs/superpowers/pm/demo-script.md`

- [ ] **Step 1: Write deferred native media helper tests first**

Test:

- Offer/answer/ICE message shapes validate.
- Helper exposes explicit states: `idle | requesting | sharing | receiving | unavailable | failed`.
- Unsupported browser path returns `unavailable` and does not crash.

Run:

```powershell
npm --workspace apps/web run test -- teachingWebrtc InteractiveTeachingView
```

Expected: fail before helper exists.

- [ ] **Step 2: Implement two-tab demo path**

Manual verification contract:

- Open teacher tab: `http://127.0.0.1:5174/teaching?room=demo&persona=teacher`.
- Open student tab: `http://127.0.0.1:5174/teaching?room=demo&persona=student`.
- Teacher shares desktop after browser prompt.
- Student sees a remote video tile.
- Screenshot insertion captures from whiteboard or video and broadcasts thumbnail metadata.

- [ ] **Step 3: Verify phase**

Run:

```powershell
npm --workspace packages/shared run test -- teachingRealtime
npm --workspace apps/api run test -- teachingRealtime
npm --workspace apps/web run test -- teachingSession teachingRealtimeClient teachingWebrtc InteractiveTeachingView
npm run lint
npm run build
npm run demo:rehearsal
```

Expected: pass. Manual two-tab native media verification is required only if this deferred task is later activated.

Commit:

```powershell
git add packages/shared/src apps/api/src/teaching apps/api/tests apps/api/package.json apps/web/src/features/interactive-teaching apps/web/e2e docs/superpowers/pm
git commit -m "feat: add realtime interactive teaching loop"
```

---

## Final PM Audit

**Owner:** Main PM agent

- [ ] **Step 1: Run full gates**

Run:

```powershell
npm run test
npm run lint
npm run build
npm run demo:rehearsal
```

Expected: all pass.

- [ ] **Step 2: Browser audit**

Audit routes:

- `/overview`
- `/accounts`
- `/workbenches`
- `/workbenches/dashboard-electro`
- `/data-dashboards`
- `/applications`
- `/alarms`
- `/teaching`
- `/blackboard`

Expected:

- No placeholder route appears on the scripted path.
- No text claims unsupported production capability.
- Green UI style remains consistent.
- Text does not overflow in 1366x768 or 1920x1080.

- [ ] **Step 3: Update PM status docs**

Modify:

- `docs/superpowers/pm/2026-07-03-demo-readiness-audit.md`
- `docs/superpowers/pm/final-rehearsal-checklist.md`
- `docs/superpowers/pm/demo-script.md`

Required status language:

- Backend persistence: say which modules are backend-backed.
- Video: say whether ASR is fixture, local Whisper, or external provider.
- Interactive teaching: say whether local WebSocket two-tab state sync is enabled; do not claim RTC/WebRTC media.

- [ ] **Step 4: Final commit**

Run:

```powershell
git status --short
git add docs/superpowers/pm
git commit -m "docs: update real closure demo readiness"
```

Expected: clean worktree after commit.

## Agent Dispatch Order

Immediate dispatch order:

1. Worker `RBAC-A`: Phase 1 Task 1.1 only.
2. Worker `Accounts-B`: Phase 1 Task 1.2 only after `RBAC-A` returns or if write conflicts are avoided.
3. Worker `Accounts-Web-C`: Phase 1 Task 1.3 after Task 1.2 routes exist.
4. Worker `Workbench-D`: Phase 1 Task 1.4 after Task 1.1 is green.
5. Split management workers for Task 1.5 after the above are green.

Deferred dispatch:

- Video workers start after Task 1.1 is green.
- Interactive-teaching realtime workers start after the first full Phase 1 gate passes.

## PM Stop Conditions

Stop and re-plan before merging if:

- Any worker broadens scope into production IAM, LiveKit/SFU deployment, or external ASR without explicit approval.
- Existing demo rehearsal fails and the failure is not isolated to the task under review.
- A media task requires a machine dependency that is not available on the demo laptop.
- UI copy claims real ASR, real device ingestion, or production RTC when the implementation is fixture/local-only.
- Worktree contains unrelated edits in files a worker is about to modify.
