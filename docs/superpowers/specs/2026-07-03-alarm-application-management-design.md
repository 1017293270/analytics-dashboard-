# Alarm And Application Management Design

Date: 2026-07-03

## Summary

Build the next smart education management slice: a realistic alarm management page and an enterprise application center page. Both pages use the existing authenticated shell, Element Plus controls, and the smart education UI guidelines. The implementation is demo-first: data is deterministic and local to the frontend feature modules in this slice, while the component boundaries mirror the API shapes needed for a later database-backed version.

## Brief

The user approved implementing **告警管理 + 应用中心** together because the two screens share the same visual reference and both belong to the centralized control management demo. The product should feel like a compact US big-tech enterprise console adapted to Chinese school operations: table-first, low decoration, precise spacing, fast to scan, and suitable for live software demonstration.

## Source Context

- Existing project: `analytics-dashboard-`, Vue 3, Vue Router, Pinia, TypeScript, Element Plus, Vite, Vitest.
- Existing shell: `/overview`, `/workbenches`, role-aware sidebar, top bar, login, and guarded management routes are already implemented.
- Current placeholders: `/applications` and `/alarms` currently render the overview page.
- UI source of truth: `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`.
- Visual reference: `docs/superpowers/assets/alarm-application-management.png`.
- Product scope source: `docs/superpowers/specs/2026-07-02-smart-education-demo-platform-design.md`.

## Goals

- Replace `/alarms` placeholder with a complete alarm management workflow.
- Replace `/applications` placeholder with a complete application center management workflow.
- Use Element Plus for tables, filters, forms, drawers, dialogs, tags, buttons, empty states, date picker, selects, switches, checkboxes, and pagination.
- Keep the UI dense but calm, matching the existing redesigned overview page and the supplied alarm/application reference image.
- Support live demo interactions without backend dependencies in this slice.
- Preserve clear seams for later API-backed records.

## Non-Goals

- No real device integration.
- No real audio recording playback source; the recording UI is a stable demo audio-player placeholder.
- No persistent backend CRUD for applications or alarms in this slice.
- No real application install/uninstall package management.
- No role-management backend changes.
- No new design system or CSS framework.

## Recommended Approach

Implement two separate route pages:

- `/alarms`: operational alarm list, filters, summary counts, selected detail drawer, and disposal actions.
- `/applications`: app administration list, category/platform/status filters, add/edit drawer, visibility controls, and disable/uninstall demo actions.

Both pages should share local data conventions but remain separate feature folders so each module can evolve independently:

- `features/alarms`
- `features/applications`

The implementation should start with tests for expected rendering and core interactions, then add the minimal production code needed to pass.

## Alarm Management Design

### Layout

The alarm page uses a table-first management layout:

1. Header row with title `告警管理`, short operational context, and secondary actions.
2. Summary strip with total count and status counts: `告警总数`, `未处理`, `处理中`, `已处理`.
3. Filter form above the table:
   - 时间范围
   - 设备编号/名称/位置
   - 事件状态
   - 触发方式
   - 查询
   - 重置
4. Main `ElTable` with required columns:
   - 设备标识符
   - 设备名称
   - 发生位置
   - 通知人/责任人
   - 触发方式
   - 事件状态
   - 上报时间
   - 操作
5. Right-side `ElDrawer` for the selected alarm detail.

At 1366 x 768 the table remains the dominant surface. The drawer may overlay on the right rather than forcing a three-column layout.

### Interactions

- Search filters update the visible alarm table.
- Reset clears filters and restores all rows.
- Opening `/alarms?device=HB-3F-021` selects the matching device and opens the drawer after route load.
- Clicking `查看` opens the detail drawer for the selected row.
- `标记为处理中` changes status from `未处理` to `处理中`.
- `标记为已处理` changes status from `未处理` or `处理中` to `已处理`.
- Status transition buttons are disabled when the current state already makes the action invalid.
- Status changes append a disposal record to the selected alarm timeline in local component state.

### Detail Drawer

The drawer title is `告警详情`. It includes:

- Status chip and event type near the top.
- Device identifier, device name, location, report time, trigger method.
- Responsible person name and selectable phone number.
- Event recording section with a stable audio placeholder:
  - play button visual
  - `0:00 / 0:15`
  - progress bar
  - volume icon
- Disposal records rendered with `ElTimeline`.
- Grouped action buttons at the bottom:
  - `标记为处理中`
  - `标记为已处理`
  - `误报反馈`

The audio placeholder is visual only. It must not claim to play real audio.

### Alarm Data

Local alarm records include:

- `id`
- `deviceIdentifier`
- `deviceName`
- `location`
- `responsibleName`
- `responsiblePhone`
- `triggerMethod`
- `eventType`
- `status`
- `reportedAt`
- `recordingDuration`
- `disposalRecords`

Initial demo records should cover all required states and triggers:

- `HB-3F-021`, 智慧黑板, 未处理
- `CAM-3-101-01`, 摄像头, 未处理
- `DVR-1-201-01`, NVR, 处理中
- `ENV-2-301-02`, 温湿度传感器, 未处理
- `ACC-1-001-01`, 门禁控制器, 已处理
- `SPK-2-401-01`, 广播, 处理中
- `IPC-3-202-02`, 操场球机, 未处理
- `UPS-1-001-01`, 机房 UPS, 已处理

## Application Center Design

### Layout

The application page uses a table-first administration layout:

1. Header row with title `应用中心`, short context, and `添加应用` primary button.
2. Summary strip with counts:
   - 应用总数
   - 网页端
   - 移动端
   - 已启用
3. Filter bar:
   - 应用名称
   - 应用分类
   - 端类型
   - 状态
   - 可见范围
   - 查询
   - 重置
4. Main `ElTable` with:
   - 应用名称
   - 应用分类
   - 端类型
   - 访问地址 / 包标识
   - 可见范围
   - 状态
   - 操作
5. Add/edit `ElDrawer` with form controls.

### Interactions

- Filters update the visible application table.
- Reset clears filters and restores all apps.
- `添加应用` opens an empty drawer with default values.
- `编辑` opens the drawer populated with the row values.
- Save validates required fields and then updates local state.
- `启用` / `停用` toggles application status in local state.
- `卸载` opens a confirm dialog and then marks the app as `已卸载`.
- Web app launch can open the configured URL in a new tab when present.
- Mobile app rows show package identifier instead of launch behavior.

### Application Drawer

The drawer title is `添加应用` or `编辑应用`. It includes:

- 应用名称: text input, required.
- 应用分类: select, required.
- 端类型: segmented radio group with `网页端` and `移动端`.
- 访问地址: URL input for web apps.
- 包标识: package identifier input for mobile apps.
- 图标类型: select with deterministic icon choices using Element Plus icons.
- 可见范围: checkbox group for `全员`, `电教主任`, `德育主任`, `教研主任`.
- 状态: switch for enabled/disabled.
- Drawer actions: `取消`, `保存`.

When platform is `网页端`, URL is required. When platform is `移动端`, package identifier is required.

### Application Data

Local application records include:

- `id`
- `name`
- `category`
- `platform`
- `url`
- `packageId`
- `icon`
- `visibleRoles`
- `status`
- `sortOrder`

Initial demo records should include:

- 校园通知发布系统
- 移动巡检
- 学生请假审批
- 能耗管理平台
- 家校沟通助手
- 教研资源库
- 教育治理看板
- 智慧黑板工具

## Shared Visual Rules

- Follow the current overview redesign: compact header, 12-16px grid spacing, strong table hierarchy, restrained borders.
- Use `--color-page`, `--color-panel`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-danger`, and `--color-success`.
- Cards and panels use radius 8px or less.
- No nested cards.
- No marketing hero layout.
- No decorative gradients, blobs, or stock images.
- Use Element Plus icons from `@element-plus/icons-vue`.
- Long table values truncate with tooltips or native `title` attributes where practical.
- Text must not overflow buttons, tags, drawer fields, or table cells at 1366 x 768.

## Error, Empty, And Disabled States

- Filtered empty tables show `ElEmpty` with short Chinese copy and a reset action.
- Drawer validation errors appear below fields through Element Plus form validation.
- Invalid status buttons are visible but disabled so the demo can explain state transitions.
- Uninstalled apps remain in the table with neutral status unless filtered out.
- Audio recording remains a disabled visual placeholder when no recording URL exists.

## Accessibility

- Table headers must remain semantic through `ElTableColumn`.
- Icon-only controls require accessible labels.
- Drawer forms have labels.
- Status is expressed as text chips, not color alone.
- Filters and primary actions are reachable through keyboard focus.
- Detail drawer has a clear title and close action.

## Testing Strategy

### Unit And Component Tests

Alarm tests should verify:

- Page renders title, filters, summary counts, table, required column labels, and at least one alarm.
- Filtering by status or keyword changes visible rows.
- Reset restores rows.
- Clicking `查看` opens the drawer and shows responsible phone, recording placeholder, and timeline.
- Status transition updates the selected alarm status and appends a disposal record.
- Query parameter `device` opens the matching alarm drawer.

Application tests should verify:

- Page renders title, filters, summary counts, table, required column labels, and seed apps.
- Filtering by platform/status/category changes visible rows.
- Add drawer validates required fields.
- Adding a valid web application inserts a row.
- Editing an app updates the row.
- Toggling status updates the status chip.
- Uninstall confirmation marks a row as `已卸载`.

### Verification Commands

Run focused tests first:

```powershell
npm --workspace apps/web run test -- AlarmManagementView ApplicationCenterView router smoke
```

Then run wider checks:

```powershell
npm run test
npm run lint
npm run build
```

### Visual QA

Use the local app at `http://localhost:5174` and login with the seeded admin account. Inspect:

- `/alarms` at 1366 x 768.
- `/applications` at 1366 x 768.
- Drawer open states for both pages.
- Filtered empty states.
- Table text and button fit.

## File Plan

Expected implementation files:

- Create `apps/web/src/features/alarms/alarmData.ts`.
- Create `apps/web/src/features/alarms/AlarmManagementView.vue`.
- Create `apps/web/src/features/alarms/AlarmManagementView.test.ts`.
- Create `apps/web/src/features/applications/applicationData.ts`.
- Create `apps/web/src/features/applications/ApplicationCenterView.vue`.
- Create `apps/web/src/features/applications/ApplicationCenterView.test.ts`.
- Modify `apps/web/src/router.ts` so `/alarms` and `/applications` load their new views.
- Modify router or smoke tests only where they assert placeholder behavior.
- Update `README.md` only if the route/demo flow summary needs to mention the newly completed pages.

## Acceptance Criteria

- `/alarms` no longer renders the overview placeholder.
- `/applications` no longer renders the overview placeholder.
- Alarm management includes all required list fields from the tender requirement.
- Alarm management supports time, keyword, status, and trigger filtering.
- Alarm detail shows responsible person name, phone number, recording placeholder, and disposal records.
- Alarm status can be moved through demo states with clear disabled states.
- Application center supports add, edit, enable/disable, uninstall, category, platform, and visible-role fields.
- Application center includes web and mobile application records.
- Both pages use Element Plus for standard controls.
- Both pages follow the smart education UI guidelines and existing overview visual direction.
- Focused tests, full tests, lint, and build pass after implementation.

## Self-Review Notes

- Placeholder scan: no placeholder implementation language is left as an acceptance requirement. The only intentional placeholder is the demo audio-player UI, which is explicitly a phase-one non-real media control.
- Consistency check: the scope matches the approved next slice and keeps alarm and application pages separate while sharing visual rules.
- Scope check: the design is focused enough for one implementation plan because both pages are table-first management pages with local deterministic state.
- Ambiguity check: backend persistence is explicitly out of this slice; frontend demo state is the required behavior for this implementation cycle.
