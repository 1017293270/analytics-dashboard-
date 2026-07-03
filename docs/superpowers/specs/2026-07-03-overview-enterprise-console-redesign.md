# Overview Enterprise Console Redesign

Date: 2026-07-03

## Goal

Redesign `/overview` from a basic admin dashboard into a polished enterprise console suitable for an on-site smart education demo. The target feel is Stripe / Linear style: precise spacing, quiet surfaces, crisp hierarchy, compact data density, and restrained status color. This is the visual baseline later pages should inherit.

## Scope

This spec covers the current `/overview` page only. It may extend `overviewData.ts`, `OverviewView.vue`, and its tests. It should not implement the full Application Center, Alarm Management, Smart Blackboard, or Interactive Teaching pages.

The page remains inside the existing `AppShell`, uses Element Plus for standard controls and data display, and follows `2026-07-03-smart-education-ui-guidelines.md`.

## Visual Direction

Use an enterprise SaaS console pattern:

- White and near-white surfaces on the existing quiet page background.
- 1px borders, 8px radius or less, low shadow usage.
- Strong grid alignment and compact vertical rhythm.
- Small, meaningful status colors instead of large colorful blocks.
- Dense but readable tables and lists.
- No hero banner, marketing copy, decorative gradients, or illustrative assets.

The first viewport should immediately communicate:

- School operations are healthy or need attention.
- The system has prioritized alerts.
- Workbench, application, and dashboard modules are ready for demo.
- The product feels like a mature management platform, not a template dashboard.

## Information Architecture

The redesigned page uses five zones.

1. Page header
   - Title: `首页总览`
   - Context: school name, current demo date, current role visibility.
   - Actions: `进入演示模式`, `刷新数据`
   - Status tags: `现场演示`, `数据已同步`

2. KPI strip
   - Four compact tiles:
     - `设备在线率`
     - `未处理告警`
     - `已发布工作台`
     - `启用应用`
   - Each tile shows value, short trend, semantic status, and one tiny secondary metric.

3. Primary operations grid
   - Left wide panel: `告警优先级队列`
     - Table-first layout with severity, device, location, owner, status, reported time, action.
     - Top micro filters: `全部`, `未处理`, `处理中`.
   - Right narrow panel: `系统健康`
     - Service rows for device connection, whiteboard sharing, app center, data dashboard, auth service.
     - Each row uses a status dot/tag, uptime or latency, and short state text.

4. Demo launch grid
   - Compact application/workflow shortcuts:
     - `工作台配置`
     - `数据看板`
     - `应用中心`
     - `告警管理`
     - `智慧黑板`
     - `互动教学`
   - Use Element Plus buttons/tags/icons. Shortcuts can be links or visible action buttons.

5. Bottom summary row
   - `角色工作台发布` table/list.
   - `数据看板覆盖` list with six dashboard categories.
   - `演示准备进度` checklist/timeline with current phase readiness.

## Component Rules

Use Element Plus for:

- `ElButton`, `ElButtonGroup` or `ElSegmented` style controls where available.
- `ElTag`, `ElBadge`, `ElTooltip`, `ElProgress`.
- `ElTable`, `ElTableColumn`.
- `ElCard` only for individual panels, not nested cards.
- `ElRow` and `ElCol` if useful, or CSS grid around Element Plus panels.

Native elements are allowed for page landmarks and headings. Custom CSS is allowed for panel grids, metric alignment, status dots, and responsive behavior.

## Data Model

`overviewData.ts` should expose deterministic mock data:

- `overviewKpis`
  - label, value, suffix, trend, status, secondary label/value.
- `priorityAlarms`
  - severity, deviceId, deviceName, location, owner, trigger, status, reportedAt.
- `systemHealth`
  - name, status, detail, metric.
- `demoLaunchItems`
  - label, description, path, icon key or route key, status.
- `dashboardCoverage`
  - name, owner, status, updatedAt.
- `roleWorkbenches`
  - name, role, status, visibleTo, updatedAt.
- `demoReadiness`
  - label, status, detail.

The mock data should look real enough for a demo but remain local and deterministic.

## Interactions

Minimum interactions for this phase:

- Alarm queue filter chips switch the visible alarm rows between all, unhandled, and processing.
- Demo launch buttons navigate to their configured routes with `RouterLink` or router-aware Element Plus links.
- Refresh button visibly exists and can be disabled or no-op for phase one; it should not imply live polling.
- Tables and lists must show meaningful empty states if filters hide all rows.

## Responsive Behavior

Desktop is primary.

- At 1366 x 768, the first viewport must show the page header, KPI strip, and most of the primary operations grid without awkward clipping.
- At 1440 x 1024, the full first two zones and primary operations grid should feel balanced.
- Below 900px, panels stack vertically and table columns may reduce widths, but text must not overlap.

## Acceptance Criteria

- `/overview` no longer reads as a generic dashboard template.
- The page uses Element Plus controls for buttons, tags, tables, progress, and state chips.
- The page has a Stripe / Linear-like enterprise console feel: precise, quiet, dense, and aligned.
- No decorative gradients, orbs, marketing hero, large illustrative art, or nested card layout.
- Tests cover the new major labels and the alarm filter interaction.
- `npm --workspace apps/web run test -- OverviewView` passes.
- `npm --workspace apps/web run lint` passes.
- A browser verification at `http://localhost:5174/overview` confirms:
  - No visible text overlap at 1366 x 768.
  - Header, KPI strip, alarm queue, system health, and demo launch areas render.
  - The page still sits correctly inside the management shell.
