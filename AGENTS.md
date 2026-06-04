# Project AGENTS.md

This file adds project-specific instructions for `analytics-dashboard-`. It does not weaken the user's global AI-native full-stack engineering standard.

## Project Snapshot

This repository is a Vue 3 + Node/Express + Prisma SQLite monorepo for an AI data Q&A big-screen designer.

Current product slice:

- Dashboard library at `/big-screens`.
- Free-canvas designer at `/big-screens/new` and `/big-screens/:id`.
- Published runtime at `/runtime/:id`.
- Public share runtime at `/share/:token`.
- Mock data adapter with editor and runtime data preview.
- Publish, versions, rollback, archive, copy, and share-link workflows.
- Runtime proportional scaling for the full canvas.

Main workspaces:

- `apps/web`: Vue 3, Vite, Pinia, Vue Router, ECharts, Playwright.
- `apps/api`: Express, Prisma, SQLite, typed API routes.
- `packages/shared`: dashboard schema, API envelope, permissions, shared validators.

## Design Source of Truth

Read `DESIGN.md` before changing:

- Designer toolbar, canvas, palette, or property panel.
- Runtime screen or scaling behavior.
- Chart renderers, metric cards, tables, text, image, or decoration components.
- Presets or component defaults.
- Data source configuration UI.

Keep UI changes aligned with the existing direction:

- Light, compact editor shell.
- Dark command-center canvas/runtime.
- Dense operational workflows, not landing-page composition.
- Real data preview in both editor and runtime.

## Context Loading Policy

Load context by task, not by dumping the whole repository.

When the `load-project-context` skill is available, use it before substantial code changes or when switching feature areas.

Always start with:

1. `AGENTS.md`
2. `README.md`
3. The narrow task-relevant section of `DESIGN.md` when UI, chart, canvas, runtime, or preset behavior is involved.
4. The exact source files and tests you expect to touch.

For editor UI work, read only the relevant subset:

- Toolbar: `DesignerToolbar.vue`, `DesignerToolbar.test.ts`, and the `DESIGN.md` toolbar/layout rules.
- Canvas selection, drag, resize, or editor preview: `DesignerCanvas.vue`, `DesignerCanvasComponent.vue`, `DesignerCanvas.test.ts`, `designerLayout.ts`, and `useComponentData.ts` if data preview is involved.
- Property panel: `DesignerPropertyPanel.vue`, `DesignerPropertyPanel.test.ts`, `componentRegistry`, and shared schema types when fields persist.
- Palette/component creation: `ComponentPalette.vue`, `ComponentPalette.test.ts`, `componentRegistry.ts`, and schema defaults.

For runtime work, read:

- `RuntimeScreen.vue`
- `RuntimeScaler.vue`
- `RuntimeComponent.vue`
- `useComponentData.ts`
- `runtime-scale.ts`
- `runtime-behavior.test.ts`
- `runtime-scaler.test.ts`

For chart or component renderer work, read:

- `components/registry.ts`
- The specific renderer under `components/renderers/`
- Its helper and test file if present.
- `data-adapters/dataAdapter.types.ts`
- `presets/presets.ts` only if defaults or preset composition change.

For schema, API, persistence, or permission work, read:

- `packages/shared/src/dashboard-schema.ts`
- `packages/shared/src/api.ts`
- `packages/shared/src/permissions.ts`
- The relevant API route/repository file under `apps/api/src`
- Relevant API tests under `apps/api/tests`
- `docs/security/big-screen-security.md` when permissions, public runtime, sharing, data execution, or audit behavior changes.

Do not load these wholesale unless the task truly needs them:

- Full `DESIGN.md`; load the matching sections.
- Full `docs/superpowers/*`; use only when resuming that historical plan.
- Full API route/repository files when the task is purely visual.
- Full renderer directory when changing one renderer.
- Full test output; keep the failing test name, error, and stack lines.
- Generated/build artifacts, `node_modules`, Prisma generated client, screenshots, and Playwright trace output.

If requirements conflict with existing code, stop and surface the conflict with options instead of guessing.

## Current UI Architecture

Core files:

- `apps/web/src/features/big-screen/designer/DesignerShell.vue`
- `apps/web/src/features/big-screen/designer/DesignerToolbar.vue`
- `apps/web/src/features/big-screen/designer/DesignerCanvas.vue`
- `apps/web/src/features/big-screen/designer/DesignerCanvasComponent.vue`
- `apps/web/src/features/big-screen/designer/DesignerPropertyPanel.vue`
- `apps/web/src/features/big-screen/components/registry.ts`
- `apps/web/src/features/big-screen/components/renderers/*`
- `apps/web/src/features/big-screen/runtime/RuntimeScreen.vue`
- `apps/web/src/features/big-screen/runtime/RuntimeComponent.vue`
- `apps/web/src/features/big-screen/runtime/useComponentData.ts`
- `apps/web/src/features/big-screen/runtime/RuntimeScaler.vue`
- `apps/web/src/features/big-screen/presets/presets.ts`

Rules:

- Do not fork editor and runtime data-loading behavior. Reuse `useComponentData` or a shared successor.
- Do not bypass `componentRegistry` for new component types.
- Do not add property-panel controls that do not update schema-backed behavior.
- Do not add runtime-only preview behavior unless editor preview has a deliberate matching or fallback state.

## Schema and Data Rules

The dashboard schema lives in `packages/shared/src/dashboard-schema.ts`.

When adding or changing schema fields:

- Update shared Zod validators and types.
- Update defaults in `apps/web/src/features/big-screen/schema/defaults.ts`.
- Update component registry defaults or presets if needed.
- Update API tests for persistence and validation.
- Keep old stored data in mind; use forward-compatible defaults where possible.

Data source status:

- `mock` is implemented.
- `dataset`, `ai-question`, and `sql` are reserved schema source types, but not production data adapters yet.

Before real data-source execution:

- Enforce workspace, tenant, actor, and permission context.
- Validate dimensions, metrics, filters, sort, and limit.
- Normalize UI-facing errors.
- Add audit logging and rate limits for high-cost or public paths.
- Never send raw SQL errors or sensitive source metadata to the browser.

## UI Implementation Rules

Follow `DESIGN.md` plus these local constraints:

- Editor controls stay compact.
- The toolbar return-to-library icon remains fixed near the left edge unless the layout is intentionally redesigned.
- Cards use radius 8px or less.
- Do not nest UI cards inside UI cards.
- Use CSS variables from `apps/web/src/styles/tokens.css` for shell colors.
- Component/preset colors may live in schema style fields because users can configure them.
- Avoid decorative blobs, stock hero patterns, and explanatory in-app instructional text.
- All meaningful renderers must cover loading, empty, error, and success states.
- Text must not overflow toolbar controls, property fields, cards, or chart panels.

## Testing Expectations

Use the narrowest useful verification first, then widen when risk increases.

Useful commands:

```bash
npm --workspace apps/web run test -- DesignerToolbar
npm --workspace apps/web run test -- DesignerCanvas runtime-behavior
npm --workspace apps/web run lint
npm --workspace apps/api run test
npm run test
npm run lint
npm run build
npm run e2e
```

For visual or layout changes:

- Inspect at least one desktop viewport.
- Check 1366 x 768 and 1920 x 1080 for runtime or canvas changes.
- Check mobile/tablet if shell grid behavior changed.
- Verify chart canvases are not blank when data exists.

## Security and Product Boundaries

Keep `docs/security/big-screen-security.md` in sync with security-relevant work.

Required boundaries:

- No hardcoded secrets.
- No unsanitized HTML rendering.
- No direct real data querying without permission checks.
- No public runtime changes without share-token and published-status validation.
- Archive/delete/share/publish/rollback remain audited and guarded.

High-risk operations added later, such as permission changes, external messages, batch deletes, production publishes, or real source writes, need explicit confirmation and audit logging.

## Documentation Expectations

When changing product behavior, update the smallest relevant doc:

- `README.md` for setup or route changes.
- `DESIGN.md` for UI system, component, chart, or layout rules.
- `docs/testing/big-screen-testing.md` for verification strategy.
- `docs/security/big-screen-security.md` for permission, audit, or data-source changes.

Avoid creating broad documentation trees unless the task needs them.
