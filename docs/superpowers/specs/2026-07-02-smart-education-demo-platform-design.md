# Smart Education Demo Platform Design

Date: 2026-07-02

## Summary

Build a phase-one smart education demo platform on top of the existing analytics dashboard monorepo. The platform keeps the current big-screen designer as the core reusable asset, adds a real account and role foundation, and implements the remaining tender/demo requirements as stable, credible demo workflows.

The product is positioned as a unified school operations console. It includes centralized control management, configurable role-based workbenches, data dashboards, application management, alarm management, smart blackboard classroom activity authoring, and an interactive teaching console.

## Design References

The UI direction uses the current repository's design language: a compact light management shell, restrained blue accents, precise borders, small radii, and dark operational dashboard canvases where data needs high contrast. The generated reference images are stored in `docs/superpowers/assets/`:

- `smart-education-overview.png`: platform overview and role workbench entry.
- `workbench-designer.png`: configurable workbench designer.
- `alarm-application-management.png`: alarm management and application center management.
- `smart-blackboard-activity-authoring.png`: smart blackboard activity generation.
- `interactive-teaching-console.png`: interactive teaching control console.

These images are visual references for hierarchy, tone, and page composition. Implementation should remain faithful to the existing Vue app patterns rather than treating the images as pixel-perfect assets.

## Goals

- Provide a convincing on-site software demo for the listed smart education requirements.
- Reuse the existing drag-and-drop dashboard designer instead of rewriting the core canvas.
- Add a real account, role, and visibility system because role-scoped workbenches are central to the demo.
- Keep data sources controlled and deterministic through seeded database records and mock adapters.
- Make the UI feel like a real school operations product, not a throwaway demo page.

## Non-Goals

- No real audio/video conferencing implementation in phase one.
- No real remote desktop streaming, whiteboard collaboration protocol, or screen-share transport.
- No real device integration or hardware control.
- No real speech recognition, video timeline editing, or deletion of video segments based on transcript text.
- No production data warehouse, SQL, AI question answering, or third-party data-source execution.
- No mobile-native app shell; mobile application management is represented as managed records in the web console.

## Recommended Approach

Use `analytics-dashboard-` as the main project and evolve it into a smart education demo platform.

The existing dashboard designer already provides:

- Dashboard library and designer routes.
- Free-canvas component placement, movement, resizing, lock, visibility, and z-index behavior.
- Schema validation in `packages/shared`.
- Backend persistence, publish, copy, archive, versions, rollback, and share links.
- Runtime rendering with proportional scaling.
- Mock data preview in editor and runtime.
- A basic permission model that can be expanded.

The phase-one work should preserve these foundations and add new smart-education modules around them.

## Information Architecture

The main navigation should include:

- 首页总览
- 工作台配置
- 数据看板
- 应用中心
- 告警管理
- 智慧黑板
- 互动教学
- 账号权限
- 系统设置

The default route after login is 首页总览. Users only see navigation items allowed by their role.

## Users and Roles

Phase one includes these seeded users and roles:

- 系统管理员: full access to all pages, workbench configuration, app management, alarm records, and role visibility.
- 全员: can view the all-staff workbench and allowed applications.
- 电教主任: can view the electro-education director workbench, device status, app management summaries, and alarm dashboards.
- 德育主任: can view the moral education director workbench and student growth views.
- 教研主任: can view the teaching research director workbench and teacher development views.

Role assignment is many-to-many so a demo account can hold more than one role if needed. Workbench visibility and application visibility are role scoped.

## Account System

Phase one should implement:

- Login page with username/password.
- Logout.
- Current-user endpoint.
- Session persistence suitable for local demo.
- Route guards in the web app.
- Role-aware sidebar rendering.
- Seeded demo accounts with simple documented credentials.

Password storage should use a one-way hash even for demo data. The implementation can use cookie-backed sessions or signed JWTs, but server-side session state is preferred for a local demonstration because it is simple to invalidate.

## Workbench and Dashboard Configuration

The existing big-screen feature should be renamed in the product surface from "big screen" to "workbench" or "data dashboard" depending on context.

Phase one should support:

- Creating, editing, copying, publishing, archiving, enabling, and disabling workbenches.
- Assigning visible roles to each workbench.
- Default workbenches:
  - 全员工作台
  - 电教主任工作台
  - 德育主任工作台
  - 教研主任工作台
- At least six data dashboards, including:
  - 教育治理
  - 教师发展
  - 学生成长
  - 设备运维
  - 告警态势
  - 应用使用
- A clear lifecycle model: draft, published, archived.
- A separate enablement flag: enabled or disabled. A workbench is visible to role-matched users only when it is both published and enabled.
- Runtime preview for published workbenches.

The existing dashboard schema remains the base schema. Workbench metadata and role visibility should live outside the canvas schema so access control can be queried without parsing dashboard JSON.

## Component Library

The workbench designer must expose at least 30 configurable component entries. These can reuse fewer renderer families with multiple presets.

Recommended component groups:

- 数据指标: total count, percentage, trend metric, comparison metric, online rate, completion rate.
- 图表组件: line, area, bar, horizontal bar, pie, donut, radar, funnel, ranking bar, mini trend.
- 设备状态: device health card, device status table, classroom device map placeholder, online/offline summary.
- 告警组件: alarm count card, alarm trend, alarm level distribution, latest alarm list, disposal progress.
- 应用入口: app shortcut grid, app category list, mobile app status.
- 表格组件: standard data table, ranking table, event table.
- 文本图片: title text, paragraph text, image, decoration.
- 第三方网页: iframe/web embed component.

The new web embed component should include:

- URL field.
- Title field.
- Refresh behavior set to manual in phase one.
- Allowlist warning copy in the property panel if the URL is not local or demo-safe.
- Runtime fallback state when the URL is empty or cannot be embedded.

## Application Center

The application center manages both web and mobile applications.

Phase one should support:

- Application list.
- Add application.
- Edit application.
- Uninstall/disable application.
- Application categories.
- Web/mobile platform tags.
- Role visibility settings.
- Application icon, name, category, platform, URL or package identifier, status, and sort order.

The application records are real database records. Launch behavior can open a URL in a new tab for web apps and show package information for mobile apps.

## Alarm Management

The alarm management module should provide a realistic table-first workflow.

Alarm list fields:

- 设备标识符
- 设备名称
- 发生位置
- 通知人/责任人
- 触发方式
- 事件状态
- 上报时间
- 操作

Filters:

- Time range.
- Device identifier.
- Device name.
- Device location.
- Event status.
- Trigger method.

Alarm detail view:

- Device details.
- Responsible person name and phone number.
- Trigger method.
- Event status.
- Report time.
- Recording placeholder with a stable demo audio-player UI.
- Disposal records timeline.
- Status action for moving an alarm through unhandled, processing, and resolved.

Alarm records and disposal records should be seeded in the database. The demo should not depend on live device data.

## Smart Blackboard Demo

The smart blackboard module focuses on classroom activity intelligent filling.

Phase one should support three activity types:

- 选词填空
- 判断对错
- 趣味选择

Authoring flow:

1. Teacher enters source text.
2. Teacher optionally enables 删除语气词.
3. Teacher clicks 一键解析.
4. The system structures content into question stem, options, and correct answer.
5. Teacher can manually edit the generated structure.
6. The preview panel shows the classroom activity as a blackboard-style teaching preview.

Parsing can use deterministic local heuristics in phase one. The goal is credible demo behavior, not perfect natural-language understanding.

Video-to-text should appear as a visible future/demo area with:

- Upload/transcription placeholder.
- Transcript preview field.
- 删除语气词 toggle.
- Disabled state for video segment deletion with the explicit label 视频片段同步删除：暂未启用.

## Interactive Teaching Demo

The interactive teaching module is a simulated control console.

Phase one should support stateful UI for:

- Creating or opening a teaching session.
- Viewing member list.
- Setting a member as 授课老师.
- Setting a member as 学生.
- Shared remote whiteboard status.
- Shared computer desktop status.
- Screenshot insert action.
- Answer responder controls.
- Live layout selection.
- Toggle for 教师发言时放大显示.

The module should not imply real video transport. It should use seeded session and member data, local UI state, and simulated status changes to make the demo flow smooth.

## Data Model Changes

Add database models conceptually equivalent to:

- User: id, username, displayName, passwordHash, status, createdAt, updatedAt.
- Role: id, code, name, description, createdAt, updatedAt.
- UserRole: userId, roleId.
- WorkbenchVisibility: dashboardId, roleId.
- Application: id, name, categoryId, platform, url, packageId, icon, status, sortOrder, createdAt, updatedAt.
- ApplicationCategory: id, name, sortOrder.
- ApplicationVisibility: applicationId, roleId.
- AlarmEvent: id, deviceIdentifier, deviceName, location, responsibleName, responsiblePhone, triggerMethod, status, reportedAt, recordingUrl, createdAt, updatedAt.
- AlarmDisposalRecord: id, alarmEventId, operatorName, action, note, createdAt.
- TeachingActivity: id, type, sourceText, removeFillers, structuredPayload, createdBy, createdAt, updatedAt.
- TeachingSession: id, title, status, activeTeacherMemberId, whiteboardShared, desktopShared, teacherAutoFocus, layoutMode, createdAt, updatedAt.
- TeachingMember: id, sessionId, name, role, microphoneStatus, cameraStatus, isSpeaking.

Existing Dashboard, DashboardPermission, DashboardVersion, DashboardShareLink, and AuditLog should remain, with Dashboard gaining workbench-focused metadata and status behavior as needed.

Dashboard metadata should distinguish lifecycle from enablement. The existing `status` field can continue to represent draft, published, and archived. A new boolean field such as `isEnabled` should represent enabled versus disabled visibility.

## API Surface

Recommended API groups:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/users`
- `/api/roles`
- `/api/workbenches`
- `/api/workbenches/:id/visibility`
- Existing dashboard draft, publish, copy, archive, versions, runtime, and share routes adapted or wrapped under workbench naming.
- `/api/applications`
- `/api/application-categories`
- `/api/alarms`
- `/api/alarms/:id`
- `/api/alarms/:id/disposal-records`
- `/api/blackboard/activities/parse`
- `/api/blackboard/activities`
- `/api/teaching/sessions`
- `/api/teaching/sessions/:id`
- `/api/teaching/sessions/:id/members/:memberId/role`
- `/api/teaching/sessions/:id/state`

All protected routes should derive actor and roles from the authenticated session instead of hardcoded demo constants.

## Frontend Structure

Keep the existing `features/big-screen` implementation initially, then add smart-education-facing modules around it.

Recommended frontend feature folders:

- `features/auth`
- `features/shell`
- `features/workbench`
- `features/application-center`
- `features/alarm-management`
- `features/smart-blackboard`
- `features/interactive-teaching`

The current designer files can remain under `features/big-screen` during phase one if renaming creates unnecessary churn. User-facing route names and copy should use 工作台 and 数据看板.

## Routes

Recommended phase-one routes:

- `/login`
- `/`
- `/workbenches`
- `/workbenches/new`
- `/workbenches/:id`
- `/workbenches/:id/runtime`
- `/dashboards`
- `/applications`
- `/alarms`
- `/blackboard/activities`
- `/teaching/sessions`
- `/roles`
- `/settings`

Existing `/big-screens` routes can temporarily redirect to `/workbenches` to preserve development continuity.

## Demo Flow

The expected on-site demo sequence is:

1. Log in as 系统管理员.
2. Open 首页总览 and show school-wide data, workbench tabs, device health, alarm summary, and application shortcuts.
3. Open 工作台配置 and create or edit 教育治理工作台.
4. Add components from the component library, including a 第三方网页 component.
5. Configure role visibility for 电教主任 and publish/enable the workbench.
6. Switch to 电教主任 account and confirm only role-allowed workbenches and apps are visible.
7. Open 应用中心, add an application, assign category and visible roles.
8. Open 告警管理, filter alarm records, open detail, show responsible phone, recording placeholder, and disposal records.
9. Open 智慧黑板, enter source text, run 一键解析, edit generated activity, and preview.
10. Open 互动教学, set a member as 授课老师, toggle whiteboard/desktop sharing, launch answer responder, and change live layout.

## Error Handling and Empty States

- Login failures show a short inline error.
- Unauthorized routes redirect to login or show a role-permission empty state.
- Empty workbench lists show a create action for admins and a no-visible-workbench message for restricted users.
- Empty application and alarm lists show filtered-empty states.
- Workbench save and publish conflicts use the existing revision-conflict behavior.
- Blackboard parsing failures show editable fallback structure instead of blocking the user.
- Interactive teaching actions update simulated state and show disabled states when no session/member is selected.

## Testing Strategy

Phase-one implementation should include:

- Shared validator tests for new schema and permission helpers.
- API tests for login, current user, role visibility, application CRUD, alarm filtering/detail, blackboard parse, and teaching session state.
- Frontend store/component tests for auth state, guarded navigation, role-filtered sidebars, application forms, alarm filters, blackboard parser UI, and teaching session controls.
- Existing designer tests must remain passing.
- Build verification through `npm run test` and `npm run build`.

Visual verification should cover:

- 1440 x 1024 admin screens.
- 1366 x 768 compact laptop view.
- 1920 x 1080 runtime/dashboard canvas.

## Implementation Order

The preferred order is:

1. Auth, users, roles, and route guard foundation.
2. Shell navigation and role-aware overview page.
3. Workbench naming, visibility, enable/disable, default seeded workbenches, and component expansion.
4. Web embed component.
5. Application center.
6. Alarm management.
7. Smart blackboard activity authoring.
8. Interactive teaching simulated console.
9. Demo seed data and final verification.

This order produces usable checkpoints while keeping the existing designer stable.

Because this design spans several independent subsystems, implementation planning should be split into sequential plans rather than one giant plan:

1. Auth and role foundation.
2. Shell, overview, and role-aware navigation.
3. Workbench designer adaptation, visibility, seeded dashboards, and web embed component.
4. Application center and alarm management.
5. Smart blackboard and interactive teaching demo modules.

Each plan should produce working, testable software on its own before moving to the next plan.

## Acceptance Criteria

- A user can log in and log out.
- Role-scoped navigation and page access work.
- The platform includes seeded users for 系统管理员, 全员, 电教主任, 德育主任, and 教研主任.
- At least four default workbenches and six dashboards are available from seed data.
- Admin can configure a workbench, assign visible roles, publish, enable, disable, and preview it.
- The component library exposes at least 30 selectable component entries.
- A third-party web embed component can be configured with a URL and rendered with an empty/error fallback.
- Application center supports add, edit, disable/uninstall, category, platform, and visible-role fields.
- Alarm management supports the required list fields, filters, detail drawer/page, recording placeholder, and disposal records.
- Smart blackboard supports the three activity types and one-click text parsing into editable structured activity data.
- Interactive teaching console supports all required stateful demo controls without real streaming.
- `npm run test` and `npm run build` pass after implementation.

## Open Decisions Resolved for Phase One

- Use seeded mock/demo data instead of live devices.
- Use deterministic local parsing for classroom activities.
- Keep video transcript and segment deletion as disabled/future-visible UI.
- Keep interactive teaching as simulated UI state.
- Keep SQLite for local demo; future production database migration is outside phase one.
- Keep existing big-screen internals where useful; change product-facing copy and routes incrementally.
