# Data Center Browse Overview Design

## Goal

Add a first-screen browsing overview to `/data-dashboards` so the demo can show where school-defined data boards, role workbenches, and third-party embedded dashboards are unified in one data center.

## Tender Fit

The tender asks for no fewer than 6 school-defined data dashboards, default dashboards for education governance, teacher development, and student growth, third-party dashboard embedding, and role-scoped workbenches. The existing `工作台配置` page is the configuration and role/enablement surface. This design keeps that page focused on editing, and makes `数据看板` the browsing hub for "go look at the screens now."

## Placement

Use the existing sidebar item `数据看板` (`/data-dashboards`) as the default browsing entrance. Do not add another sidebar item, because the current navigation already has `工作台配置` for editing and `数据看板` for data-center management. The new overview appears above the current management table.

## Experience

The page header remains `数据看板`, but the first panel becomes `数据中心总览`. It shows:

- Overall demo readiness counts for role workbenches, school data dashboards, third-party embedded dashboards, and enabled dashboards.
- `角色工作台` cards for all-staff, electro-education director, moral-education director, and teaching-research director screens.
- `默认数据看板` cards for education governance, teacher development, and student growth.
- `第三方融合看板` cards for alarm posture and application usage.

Each card has a clear primary action. Role workbench cards open the existing workbench screen because most seeded demo workbenches are draft/configurable demo screens, not necessarily published runtime screens. Managed data dashboard cards open the existing preview drawer, keeping the current stable preview behavior and avoiding dependency on a remote iframe.

## Data Flow

- Fetch managed data dashboards with the existing `dashboardApi.listDashboards()`.
- Fetch role workbench list items with the existing `bigScreenApi.listDashboards()`.
- Map known role-workbench IDs to presentational cards, using API names/status when available and stable fallbacks when not.
- Derive managed dashboard groups from `ManagedDashboard[]` so reset/search/create flows remain the source of truth for the overview counts and cards.

## Error Handling

If managed data dashboards fail, keep the existing Element Plus error message. If role workbenches fail, keep the page usable and render fallback cards with a short inline warning so the demo still has a visible browsing map.

## Tests

Add component tests that mount `/data-dashboards`, mock both data-dashboard and big-screen APIs, and assert:

- `数据中心总览`, `角色工作台`, `默认数据看板`, and `第三方融合看板` render on first load.
- All four role workbench cards are visible and their browse links point to the existing workbench routes.
- Built-in and embedded data dashboard cards open the current preview drawer rather than introducing a separate preview system.

## Non-Goals

Do not publish draft workbenches automatically, add a new runtime browsing route, or change the existing workbench designer behavior. Video ASR/cutting, RTC teaching, and backend persistence are separate demo closures and are not part of this increment.

