# Data Dashboards Management Design

Date: 2026-07-03

## Summary

Build a dedicated `/data-dashboards` management page for the smart education demo platform. The page proves the tender requirement that the school can configure at least six data dashboards, ships with the default dashboards `教育治理`, `教师发展`, and `学生成长`, and supports third-party dashboard fusion through a custom web link configuration.

This is a demo-first frontend slice. It uses deterministic local data and Element Plus controls, follows the existing smart education shell, and does not change the existing big-screen/workbench designer internals.

## Brief

The user approved implementing a separate data dashboard management page before moving to the smart blackboard and interactive teaching modules. The page should be stable for an on-site software demo, compact like the existing alarm and application pages, and clear enough to explain dashboard count, role visibility, enable/disable management, and third-party URL embedding without relying on live external systems.

## Source Context

- Existing project: `analytics-dashboard-`, Vue 3, Vue Router, Pinia, TypeScript, Element Plus, Vite, Vitest.
- Existing shell: authenticated layout, sidebar, top bar, `/overview`, `/workbenches`, `/applications`, and `/alarms`.
- Current route state: `/data-dashboards` still renders `OverviewView.vue` as a placeholder.
- UI source of truth: `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`.
- Product scope source: `docs/superpowers/specs/2026-07-02-smart-education-demo-platform-design.md`.

## Goals

- Replace the `/data-dashboards` placeholder with a real management page.
- Show at least six configurable dashboard records.
- Mark `教育治理`, `教师发展`, and `学生成长` as default dashboards.
- Support dashboard role visibility for `全员`, `电教主任`, `德育主任`, and `教研主任`.
- Support dashboard enable/disable state in local UI state.
- Support third-party dashboard URL configuration with HTTP/HTTPS validation.
- Provide a credible embedded preview/fallback state for third-party dashboards.
- Keep the implementation isolated in `features/data-dashboards` for later API-backed replacement.

## Non-Goals

- No real external data warehouse or BI connection.
- No backend CRUD in this slice.
- No changes to the existing big-screen designer canvas, renderer, or schema.
- No production-grade iframe allowlist policy.
- No live health check for third-party URLs.
- No new charting dependency for this page.

## Recommended Approach

Create a focused frontend module:

- `apps/web/src/features/data-dashboards/dashboardData.ts`
- `apps/web/src/features/data-dashboards/dashboardData.test.ts`
- `apps/web/src/features/data-dashboards/DataDashboardsView.vue`
- `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`

Then route `/data-dashboards` to `DataDashboardsView.vue`.

The module mirrors the application/alarm structure already implemented: deterministic seed data, pure helper functions for filtering and validation, a single route view, Element Plus table/forms/drawer/dialogs, and component tests for the demo workflow.

## Dashboard Management Design

### Layout

The page uses a table-first management layout:

1. Header row:
   - Title: `数据看板`
   - Short context: `统一管理校级数据看板、角色可见范围和第三方看板嵌入。`
   - Primary action: `配置第三方看板`
2. Summary strip:
   - `看板总数`
   - `已启用`
   - `默认看板`
   - `第三方嵌入`
3. Filter form:
   - 看板名称
   - 看板类型
   - 使用角色
   - 状态
   - 来源类型
   - 查询
   - 重置
4. Main `ElTable`:
   - 看板名称
   - 看板类型
   - 使用角色
   - 来源
   - 状态
   - 更新时间
   - 操作
5. Right-side `ElDrawer` for configuration and preview.

At 1366 x 768, the table remains the primary surface. The preview should be inside the drawer or a compact panel, not a second full page.

### Seed Dashboards

Initial records:

- `教育治理`
  - Type: `治理分析`
  - Default: yes
  - Source: `内置看板`
  - Visible roles: `全员`, `电教主任`
  - Status: `已启用`
- `教师发展`
  - Type: `教师发展`
  - Default: yes
  - Source: `内置看板`
  - Visible roles: `教研主任`
  - Status: `已启用`
- `学生成长`
  - Type: `学生成长`
  - Default: yes
  - Source: `内置看板`
  - Visible roles: `德育主任`
  - Status: `已启用`
- `设备运维`
  - Type: `设备运维`
  - Default: no
  - Source: `内置看板`
  - Visible roles: `电教主任`
  - Status: `已启用`
- `告警态势`
  - Type: `告警态势`
  - Default: no
  - Source: `第三方嵌入`
  - Visible roles: `电教主任`
  - Status: `已停用`
  - URL: `https://demo.school.local/alarm-bi`
- `应用使用`
  - Type: `应用使用`
  - Default: no
  - Source: `第三方嵌入`
  - Visible roles: `全员`, `电教主任`
  - Status: `已启用`
  - URL: `https://demo.school.local/app-usage`

Additional demo records may be added later, but the implementation must keep the first six stable so tests and demo talk tracks stay predictable.

### Interactions

- Filters update the visible dashboard table.
- Reset clears filters and restores all rows.
- `启用` / `停用` toggles a dashboard status in local component state.
- `预览` opens the drawer for the selected dashboard.
- `配置` opens the same drawer in edit mode.
- `配置第三方看板` opens the drawer with a new third-party dashboard draft.
- Saving validates:
  - Dashboard name is required.
  - At least one role is required.
  - Third-party source requires a URL.
  - Third-party URL must start with `http://` or `https://`.
- Saving an existing dashboard updates local state.
- Saving a new third-party dashboard appends a row with source `第三方嵌入`.

### Configuration Drawer

The drawer title is either `配置数据看板` or `配置第三方看板`.

Fields:

- 看板名称: text input.
- 看板类型: select.
- 来源类型: segmented radio group with `内置看板` and `第三方嵌入`.
- 第三方链接: URL input, visible and required only when source is `第三方嵌入`.
- 可见范围: checkbox group for `全员`, `电教主任`, `德育主任`, `教研主任`.
- 启用状态: switch with `已启用` / `已停用`.

The drawer includes a preview area below the form:

- Built-in dashboards show deterministic KPI/chart-like preview blocks using normal HTML and Element Plus progress/statistic components.
- Third-party dashboards with a valid URL show a framed preview shell with the URL text and a disabled/open-in-new action. An iframe may be rendered when feasible, but the acceptance path must not depend on the remote page loading.
- Third-party dashboards with no URL show an empty/fallback state: `请填写第三方看板链接后预览`.

## Data Model

Local dashboard records include:

- `id`
- `name`
- `type`
- `source`
- `url`
- `isDefault`
- `visibleRoles`
- `status`
- `updatedAt`
- `metrics`

Types:

- Dashboard type: `治理分析`, `教师发展`, `学生成长`, `设备运维`, `告警态势`, `应用使用`.
- Source: `内置看板` or `第三方嵌入`.
- Status: `已启用` or `已停用`.
- Visible roles: `全员`, `电教主任`, `德育主任`, `教研主任`. `系统管理员` is not a selectable visibility role because administrators can view and manage all dashboard records.

Helper functions:

- `dashboardSummary(dashboards)`
- `applyDashboardFilters(dashboards, filters)`
- `createDashboardDraft(source?)`
- `validateDashboardDraft(draft)`
- `isValidDashboardEmbedUrl(url)`

## Visual Rules

- Follow the alarm/application pages: compact header, summary tiles, filter form, primary table, drawer for detail/configuration.
- Use Element Plus for cards, statistics, table, tags, form items, inputs, selects, radio buttons, checkboxes, switches, drawers, buttons, empty states, and alerts.
- Use icons from `@element-plus/icons-vue`.
- Use `--color-page`, `--color-panel`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-danger`, and `--color-success`.
- No nested cards.
- No marketing hero.
- No decorative gradients or image assets.
- Long URLs truncate in table cells with a `title`.
- Text must fit buttons, chips, table cells, and drawer fields at 1366 x 768.

## Error, Empty, And Disabled States

- Filtered empty table uses `ElEmpty` with a reset action.
- Validation errors appear under fields and trigger `ElMessage.error` for the first error.
- Built-in dashboards can be configured but their source type should not be changed to avoid confusing demo meaning.
- Default dashboards are clearly tagged as `默认`.
- Disabled dashboards remain visible with a neutral status chip.
- Third-party preview failure is represented as a stable fallback state, not a blank frame.

## Accessibility

- Table headers remain semantic through `ElTableColumn`.
- Drawer fields have labels.
- Icon-only controls require accessible labels if used.
- Status is shown as text chips, not color alone.
- Validation messages use visible text and `role="alert"` where practical.
- Preview frames have accessible titles.

## Testing Strategy

### Unit Tests

`dashboardData.test.ts` verifies:

- Summary counts for total dashboards, enabled dashboards, default dashboards, and third-party embeds.
- Filtering by keyword, type, source, status, and visible role.
- Empty filters return all dashboards.
- Draft defaults for built-in and third-party dashboards.
- Validation catches missing name, missing role, missing third-party URL, and non-HTTP/HTTPS URL.

### Component Tests

`DataDashboardsView.test.ts` verifies:

- Page renders title, summary, filters, required table columns, and seed dashboards.
- The six required dashboards are present.
- Default dashboards are tagged.
- Keyword filtering and reset work.
- Opening preview drawer shows dashboard detail and preview content.
- Toggling status updates visible state.
- Third-party configuration validates URL and saves a new row.

### Verification Commands

Focused checks:

```powershell
npm --workspace apps/web run test -- dashboardData DataDashboardsView router smoke
```

Full checks:

```powershell
npm run test
npm run lint
npm run build
```

### Visual QA

Use the local app at `http://localhost:5174` and login with:

```text
admin / Admin@123
```

Inspect:

- `/data-dashboards` at 1366 x 768.
- Filtered table state.
- Preview drawer for built-in dashboards.
- Configuration drawer for third-party dashboards.
- Empty/fallback state when a third-party URL is missing or invalid.

Visual acceptance:

- No obvious text overlap.
- Table remains readable at 1366 x 768.
- Drawer form and preview fit without broken labels.
- No card-inside-card layout.
- Standard controls are Element Plus.

## File Plan

Expected implementation files:

- Create `apps/web/src/features/data-dashboards/dashboardData.ts`.
- Create `apps/web/src/features/data-dashboards/dashboardData.test.ts`.
- Create `apps/web/src/features/data-dashboards/DataDashboardsView.vue`.
- Create `apps/web/src/features/data-dashboards/DataDashboardsView.test.ts`.
- Modify `apps/web/src/router.ts` so `/data-dashboards` loads the new view.
- Modify `apps/web/src/smoke.test.ts` or router tests only if they assert placeholder behavior.
- Update `apps/web/src/features/overview/overviewData.ts` if overview readiness still describes data dashboards as incomplete after the page ships.
- Update `README.md` if the route summary needs to mention the completed `/data-dashboards` route.

## Acceptance Criteria

- `/data-dashboards` no longer renders the overview placeholder.
- The page shows at least six dashboard records.
- `教育治理`, `教师发展`, and `学生成长` are visibly marked as default dashboards.
- Dashboard records show type, role visibility, source, status, update time, and operations.
- Filters support keyword, type, role, status, and source.
- Users can enable and disable dashboards in local UI state.
- Users can open a configuration/preview drawer.
- Users can configure a third-party dashboard link.
- Third-party URLs are validated to `http://` or `https://`.
- Third-party preview has a safe fallback when the URL is empty or cannot render.
- The page uses Element Plus for standard controls.
- The page follows the smart education UI guidelines and existing management-page visual direction.
- Focused tests, full tests, lint, and build pass after implementation.

## Self-Review Notes

- Placeholder scan: no unresolved `TBD` or `TODO` markers are present. The only intentionally non-live behavior is the stable third-party preview fallback, which is part of the approved demo scope.
- Consistency check: the scope matches the approved A approach and does not modify the existing workbench designer internals.
- Scope check: this is focused enough for one implementation plan because it is a single route view with local deterministic data and isolated helpers.
- Ambiguity check: third-party embed acceptance does not depend on remote network availability; the validated URL and stable preview/fallback are the required phase-one behavior.
