# Workbench Fullscreen Preview Design

## Goal

Make the data-center `浏览大屏` action open a pure fullscreen viewing page, without the workbench designer toolbar, component palette, property panel, or other configuration controls.

## User-Facing Behavior

- `数据看板` -> `数据中心总览` -> role workbench card -> `浏览大屏` opens `/workbenches/:id/preview`.
- The preview page occupies the whole browser viewport and renders only the big-screen canvas.
- The page reads the workbench `draftSchema`, so the demo can browse seeded draft workbenches without publishing them first.
- `/workbenches/:id` remains the configuration/designer entrance.
- `/runtime/:id` remains the published runtime entrance and is not used for this demo browse action.

## Architecture

Add a new top-level protected route instead of adding a query flag to the designer route. This keeps browsing separate from editing, avoids accidental exposure of configuration controls, and prevents draft workbenches from hitting the published-only runtime API.

New component:

- `apps/web/src/features/big-screen/runtime/DraftPreviewScreen.vue`
- Fetches `bigScreenApi.getDashboard(id)`.
- Uses `record.draftSchema`.
- Renders with existing `RuntimeScaler` and `RuntimeComponent`.
- Handles loading, error, stale-response protection, and empty canvas state in the same style as `RuntimeScreen`.

Route update:

- Add `/workbenches/:id/preview` as a top-level route in `apps/web/src/router.ts`.
- It is not public, so it still requires login.
- Because it is not nested under `AppShell`, it has no sidebar/topbar.

Data center update:

- `DataDashboardsView.vue` role-workbench cards point `浏览大屏` to `/workbenches/:id/preview`.
- Disabled or inaccessible role workbench cards remain non-clickable.

## Testing

Add focused tests for:

- Draft preview route is protected, resolves as a top-level fullscreen route, and does not go through the shell child route.
- Draft preview screen fetches `getDashboard(id)` and renders `draftSchema`.
- Data-center `浏览大屏` links point to `/workbenches/:id/preview`, not `/workbenches/:id` and not `/runtime/:id`.
- Existing data-dashboard preview drawer behavior remains unchanged.

## Non-Goals

- Do not auto-publish workbenches.
- Do not change `/runtime/:id` published runtime behavior.
- Do not add editing controls to the preview page.
- Do not add browser Fullscreen API prompts; this is a fullscreen route/layout, not an OS/browser fullscreen takeover.

