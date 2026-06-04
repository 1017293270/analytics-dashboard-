# Analytics Dashboard Big Screen UI Specification

Version: 2026-06-04

This document is the project UI standard for the Vue 3 big-screen dashboard designer. It records the product direction that already exists in the codebase and the rules future AI or human collaborators must follow when adding screens, components, chart presets, data-source configuration, and runtime experiences.

## 1. Product Direction

The product is an AI data Q&A platform extension: users create operational big screens from data returned by AI question answering, datasets, SQL, or mock sources. The first shipped slice is a big-screen management library, free-canvas editor, mock-data preview, publish/version workflow, and scaled runtime renderer.

The UI should feel like a serious operations tool, not a marketing site. It must be dense enough for repeated work, but still readable and premium. Prefer a quiet editor shell around a dark command-center canvas.

Primary user jobs:

- Manage big-screen drafts and published screens.
- Compose a 1920 x 1080 dashboard on a free canvas.
- Add, select, move, resize, lock, hide, and configure components.
- Bind components to data.
- See real preview data in both editor and runtime.
- Publish and preview a read-only runtime that scales proportionally to mismatched screens.

## 2. Current Product State

Implemented surfaces:

- Dashboard library: `/big-screens`
- New designer draft: `/big-screens/new`
- Existing designer: `/big-screens/:id`
- Published runtime: `/runtime/:id`
- Public share runtime: `/share/:token`

Implemented component types:

- Metric card
- Line chart
- Bar chart
- Pie chart
- Data table
- Text
- Image
- Decoration

Implemented data behavior:

- Mock data adapter.
- Editor canvas data preview.
- Runtime data loading and refresh.
- Empty, loading, and error states in renderers.

Current main preset:

- AI Operations Command Center, using a dark 1920 x 1080 canvas, metric cards, trend chart, workload pie, queue table, title, subtitle, and footer note.

## 3. Visual Theme

Editor shell:

- Light, utilitarian, calm.
- Surface hierarchy is created by borders, small shadows, and restrained blue accents.
- The shell must not compete visually with the canvas.
- Controls should be compact and predictable. This is a workbench, not a landing page.

Canvas and runtime:

- Dark command-center tone.
- Data components sit on translucent navy panels with colored accents.
- Runtime should feel display-ready and stable, with no visible editor affordances.
- The primary signal is data readability: labels, units, values, chart axes, and table rows must remain legible.

Avoid:

- Decorative gradient blobs, bokeh orbs, stock hero layouts, large marketing sections, and excessive cards.
- One-note purple/blue gradients.
- Card-inside-card layouts.
- Textual instructions inside the app explaining obvious mechanics.

## 4. Color Tokens

Use `apps/web/src/styles/tokens.css` as the source of truth for shell colors.

Current shell tokens:

```css
:root {
  --color-page: #eef2f7;
  --color-panel: #ffffff;
  --color-panel-muted: #f8fafc;
  --color-border: #d8e2f3;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-accent: #2563eb;
  --color-accent-soft: #dbeafe;
  --color-danger: #dc2626;
  --color-success: #16a34a;
  --shadow-panel: 0 18px 45px rgba(15, 23, 42, 0.12);
  --radius-panel: 8px;
  --motion-fast: 120ms;
  --motion-medium: 250ms;
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Runtime and component defaults:

- Canvas dark base: `#07111f` or `#0b1220`
- Runtime page base: `#030712`
- Main chart/selection cyan: `#38bdf8`
- Line chart accent: `#60a5fa`
- Success/automation green: `#22c55e`
- Workload amber: `#f59e0b`
- Danger/red: `#ef4444` or `#f87171`
- Secondary series purple: `#a78bfa`

Rules:

- Use semantic color. Blue means primary/editing/selection, green means healthy/success, red means dangerous/error, amber means warning or mixed workload.
- For new shell CSS, prefer existing CSS variables. Add a token only if it is reused or represents a new semantic role.
- For schema-level component styles, keep color values inside component `style` and preset definitions because users can later configure them.
- Preserve contrast on dark canvas panels. Data labels should not depend only on low-opacity color.

## 5. Typography

Current app font stack:

```css
font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
```

Rules:

- Keep editor UI compact: 12-15px labels, 13-14px buttons, 15px inputs.
- Use 800-900 weight for operational labels and compact action buttons.
- Do not use viewport-scaled font sizes.
- Letter spacing stays `0` unless a small uppercase label needs clarity.
- Runtime dashboard titles may be large, but control text inside panels should stay tight and readable.
- Chinese product copy must remain readable with the Chinese fallback stack. Avoid forcing an English-only font.

## 6. Layout Standards

Dashboard library:

- Use a constrained content width and table-first management surface.
- Keep actions grouped per row.
- Preserve loading, empty, error, and disabled states.

Designer shell:

- Toolbar at top.
- Component palette on the left.
- Canvas in the center.
- Property panel on the right.
- The return-to-library icon is fixed at the toolbar left edge, 20px from the left, centered vertically.
- The dashboard name and status are the primary toolbar identity.
- Canvas ruler shows resolution and zoom.
- Canvas viewport may scroll; the free canvas itself uses explicit pixel dimensions.

Runtime:

- Render only the screen content.
- Scale the complete canvas proportionally when screen size mismatches.
- Keep the runtime canvas centered.
- Do not show editing affordances, palettes, property panels, or toolbars.

Responsive:

- Desktop is the primary editing target.
- At tablet width, property panel may move below the canvas.
- At mobile width, surfaces stack. This is for review and light edits, not the ideal authoring mode.
- Runtime must prioritize full-screen proportional scaling over reflow.

## 7. Component Rules

Every component renderer must support:

- Default state
- Loading state
- Empty state
- Error state
- Visible/hidden handling through layout
- Stable dimensions without content-driven layout jumps
- Text overflow handling
- `aria-busy` where loading applies

Metric card:

- Must show title, value, and trend when metric data exists.
- Must support prefix, suffix, and precision.
- Use skeleton bars while loading.

Charts:

- Must show title, readable axes or legend, tooltip support, and no-data text.
- Must not render an unlabeled chart if the data is ambiguous.
- Chart colors must come from component style/theme, not random palettes.
- Use ECharts renderer through the component registry.
- If a chart type cannot consume the bound data shape, show a clear empty/error state.

Tables:

- Must show title, columns, rows, and scroll within the component.
- Empty table should say no rows, not collapse.
- Keep cells truncated with readable headers.

Text:

- Use Vue interpolation; never render raw unsanitized HTML.
- Text blocks must wrap or truncate intentionally.

Image:

- Must handle missing image source.
- Future asset sources need allowlists, signed URLs, or managed asset records.

Decoration:

- Decoration should support framing and background structure without taking attention from data.
- Do not use decoration to fake a chart or data state.

## 8. Property Panel Rules

The property panel should follow Feishu-like progressive configuration:

- Basic: name, title, component type, id, lock/visible.
- Layout: x, y, width, height, z-index.
- Data: binding/source selection.
- Style: background, font color, accent/border colors, font size/weight where applicable.
- Analysis: AI-assisted or future chart interpretation features.

Rules:

- Keep field labels short.
- Use select controls for finite choices, checkboxes for booleans, and numeric inputs for layout.
- Never let property panel actions mutate locked components except lock/unlock itself.
- Unsupported future data sources must show a clear error instead of silently falling back.

## 9. Data Visualization Rules

All data-heavy components must expose:

- Data source or binding identity.
- Units or labels when relevant.
- Time range when time-series data is used.
- Empty, loading, error, and stale-data behavior.
- Readable hover/focus states where interaction is available.

Data source expansion order:

1. Keep mock adapter stable for demos and tests.
2. Add typed dataset metadata: fields, dimensions, metrics, units, and allowed aggregations.
3. Add query builder state in schema instead of ad hoc renderer props.
4. Enforce workspace, tenant, actor, and permission context before any real data query.
5. Add audit and latency logging for high-cost or AI-generated queries.

When adding chart presets:

- Add a component registry entry or preset schema.
- Add renderer/helper tests for supported data shapes.
- Add property panel support only for controls that actually work.
- Verify editor preview and runtime preview both render data.

## 10. Motion and Interaction

Motion level: L1 restrained operational motion.

Allowed:

- Fast hover/focus transitions on controls.
- Skeleton shimmer for loading.
- Selection outlines and resize handles.
- Stable opacity changes for hidden or dragging components.

Avoid:

- Bouncy, flashy, decorative motion.
- Layout-shifting animation.
- Continuous animation inside dense editor panels.
- Heavy runtime effects that distract from data.

Always support `prefers-reduced-motion` for animations that loop or shimmer.

## 11. Accessibility and States

Required:

- Keyboard focus visible on buttons, inputs, selects, and canvas component frames.
- Components selectable with keyboard.
- Delete/backspace behavior must respect locked/saving states.
- Disabled actions must have a visual disabled state.
- Loading states must not feel frozen.
- Error states must be visible and retryable where practical.

For AI-native or data-query features:

- Show thinking/loading/progress state.
- Provide cancellation or safe abort for long-running operations where practical.
- Normalize errors before showing them in UI.
- Never expose backend secrets, SQL internals, or permission details in user-facing copy.

## 12. Do and Do Not

Do:

- Keep editor UI compact and work-focused.
- Reuse component registry patterns.
- Keep schema immutable and validated.
- Keep editor preview and runtime rendering behavior aligned.
- Test loading, empty, error, and permission states.
- Use actual chart/table renderers for preview, not static screenshots.
- Preserve the 1920 x 1080 big-screen default unless the user chooses a different resolution.
- Keep runtime scaling proportional.

Do not:

- Add marketing landing-page composition to app routes.
- Add decorative cards around every section.
- Add UI text that explains obvious controls.
- Hardcode one-off colors in shell CSS when a token exists.
- Add chart types without data-shape validation.
- Let editor and runtime use separate data-loading logic.
- Bypass dashboard schema validation.
- Connect real data sources without permissions and audit considerations.

## 13. Verification Checklist

For frontend UI changes:

- Run focused component tests for touched surfaces.
- Run `npm --workspace apps/web run lint`.
- For meaningful visual work, inspect a desktop viewport.
- Check mobile/tablet if shell layout changed.
- Confirm text does not overflow buttons, cards, property fields, or toolbar clusters.

For cross-stack or data-source changes:

- Run `npm run test`.
- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run e2e` when publish/runtime flow changes.

Known build note:

- Vite currently warns about a large designer/chart chunk. It is not a failing condition, but future production hardening should code-split ECharts and designer-only bundles.
