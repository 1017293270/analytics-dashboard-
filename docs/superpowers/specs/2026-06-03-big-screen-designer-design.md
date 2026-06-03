# AI Data Q&A Big Screen Designer Design

Date: 2026-06-03
Repository: `1017293270/analytics-dashboard-`
Status: written for user review

## 1. Goal

Build a Vue 3 embeddable big-screen dashboard designer for an AI data Q&A platform.

The product should support a complete front-end and back-end loop:

- Create, edit, copy, delete, preview, publish, and view big screens.
- Drag and resize components on a free 16:9 canvas.
- Add and configure charts, KPI cards, tables, text, images, and decoration components.
- Configure component data, visual style, analysis options, and refresh behavior.
- Save draft schema and publish runtime schema.
- Render a read-only runtime screen with permissions and share links.
- Use mock data in the first version, while reserving a data adapter for later AI Q&A, dataset, or SQL integration.

This is a product-grade implementation target, not a static demo.

## 2. Confirmed Scope

The selected approach is a free-canvas big-screen designer.

The first stable product version should include:

- A Vue 3 application or feature module that can later be embedded into another Vue 3 program.
- A three-panel designer: component library, canvas, and property panel.
- A 1920 x 1080 default design canvas.
- Runtime full-screen proportional scaling when the user screen does not match the design canvas.
- Mock data support first; real data integration will be designed later.
- Back-end persistence for dashboards, draft schema, published schema, versions, permissions, and share links.
- A read-only runtime renderer for published dashboards.

Out of scope for the first stable version:

- Real AI Q&A data integration.
- Collaborative multi-user editing.
- Template marketplace.
- Complex animation authoring.
- Advanced cross-chart interactions.

These should remain extension points.

## 3. Global Rules and Quality Bar

Preset big screens, chart components, and visual design must follow the global AGENTS rules for `D:\kanban`, including:

- AI-native states: loading, streaming or progressive rendering where applicable, retry, cancellation where applicable, empty, error, permission denied, timeout, and degraded-service states.
- Full-stack consistency: UI state, API contract, backend service, data model, permission model, logging, error handling, tests, deployment impact, and docs.
- Security: schema validation, permission enforcement, no hardcoded secrets, sanitized user-rendered content, safe asset URLs, audit trails for high-risk operations.
- Testing: unit tests for schema and transforms, integration tests for APIs, Playwright flows for critical designer and runtime behavior.
- Design quality: one primary focus per screen, no generic template aesthetics, stable layout, intentional typography/color/spacing, responsive behavior, visible focus states.
- Motion quality: calm, purposeful motion only; respect `prefers-reduced-motion`; no chaotic, decorative, flashing, bouncing, or excessive looping motion.

## 4. Product Shape

### 4.1 Designer Mode

Designer mode should provide:

- Left component library.
- Center free canvas.
- Right property panel.
- Top toolbar with save, preview, publish, undo, redo, zoom, and fullscreen preview.

Users can:

- Add components by dragging from the component library.
- Select, move, resize, copy, delete, lock, and layer components.
- Configure basic, data, style, and analysis settings.
- Save draft changes.
- Preview the current draft.
- Publish a version.

### 4.2 Runtime Mode

Runtime mode should:

- Render only the published dashboard content.
- Avoid loading editor-only dependencies.
- Apply permission or share-token checks.
- Load mock data through the data adapter.
- Refresh data based on component or dashboard refresh settings.
- Preserve previous valid data when refresh fails.
- Show loading, empty, error, retry, and permission-denied states.

### 4.3 Screen Scaling

The design canvas uses fixed design coordinates. Runtime display scales the whole canvas proportionally:

```ts
scale = Math.min(screenWidth / canvasWidth, screenHeight / canvasHeight)
```

Default behavior:

- Design canvas: 1920 x 1080.
- Runtime scale mode: `fit-screen`.
- Canvas is centered.
- Extra space is filled by the page background.
- Components do not reflow or stretch independently.

Designer mode should only scale the canvas viewport. The editor shell, toolbar, component library, and property panel keep normal UI sizing.

## 5. Architecture

The feature should be organized as an independent domain module:

```text
src/features/big-screen/
  designer/
  runtime/
  schema/
  components/
  data-adapters/
  stores/
  api/
```

Recommended front-end stack:

- Vue 3
- TypeScript
- Pinia
- ECharts / vue-echarts
- Moveable for editor selection, resizing, snapping, and transform controls
- REST API client following the host project's existing request patterns

Recommended back-end shape:

- REST endpoints for dashboard CRUD, draft save, publish, versions, permissions, share links, and mock data query.
- Schema validation at all API boundaries.
- Audit logging for publish, unpublish, delete, permission changes, and share-link changes.
- Stable API error shape.

Because the target repository is currently empty, the initial implementation can establish the Vue 3 project structure and backend service structure from scratch.

## 6. Core Modules

### 6.1 Designer Shell

Responsibilities:

- Layout the three-panel designer.
- Own toolbar actions.
- Coordinate save, preview, publish, zoom, and history operations.
- Display global loading, saving, publishing, permission-denied, and error states.

### 6.2 Canvas Stage

Responsibilities:

- Render the design canvas.
- Apply designer zoom.
- Render component instances in design coordinates.
- Manage selection, move, resize, snapping, z-index, lock state, and copy/delete.
- Dispatch immutable schema patches into Pinia.

### 6.3 Component Registry

Each component type declares:

- Type id.
- Display name.
- Icon.
- Default layout.
- Default props.
- Default style.
- Data requirement.
- Property groups.
- Renderer component.
- Validation rules.

The registry prevents the property panel and renderer from becoming large switch statements.

### 6.4 Property Panel

The property panel is schema-driven. It renders field definitions from the selected component definition.

Common groups:

- Basic: title, component type, description, visibility.
- Data: source type, dimensions, metrics, filters, sorting, refresh.
- Style: background, font, colors, legend, axis, labels, grid, border.
- Analysis: aggregation, Top N, sorting, summary, derived display options.

### 6.5 Data Adapter

The first version uses a mock adapter:

- KPI data.
- Time series data.
- Category distribution data.
- Table data.
- Ranking data.

Adapter interface should already support:

- `mock`
- `dataset`
- `ai-question`
- `sql`

Only `mock` is implemented in the first version.

### 6.6 Runtime Renderer

Responsibilities:

- Load published schema.
- Apply runtime proportional scaling.
- Render component instances from the same registry.
- Fetch data through the adapter.
- Refresh data safely.
- Show per-component loading/error/empty states.
- Avoid editor dependencies.

## 7. Dashboard Schema

The schema is the system contract between designer, backend, runtime, templates, and future AI generation.

```ts
type DashboardSchema = {
  version: '1.0'
  canvas: {
    width: number
    height: number
    background: BackgroundConfig
    scaleMode: 'fit-screen' | 'fit-width' | 'fixed'
  }
  theme: {
    name: string
    colors: string[]
    fontFamily: string
  }
  components: DashboardComponent[]
  dataBindings: Record<string, DataBinding>
  refresh: {
    mode: 'manual' | 'interval'
    intervalSeconds?: number
  }
}

type DashboardComponent = {
  id: string
  type:
    | 'metric-card'
    | 'line-chart'
    | 'bar-chart'
    | 'pie-chart'
    | 'table'
    | 'text'
    | 'image'
    | 'decoration'
  name: string
  layout: {
    x: number
    y: number
    width: number
    height: number
    zIndex: number
    locked?: boolean
    visible?: boolean
  }
  props: Record<string, unknown>
  style: Record<string, unknown>
  dataBindingId?: string
}

type DataBinding = {
  id: string
  sourceType: 'mock' | 'dataset' | 'ai-question' | 'sql'
  sourceId?: string
  query: {
    dimensions?: string[]
    metrics?: string[]
    filters?: unknown[]
    sort?: unknown[]
    limit?: number
    question?: string
  }
  refreshSeconds?: number
}
```

Schema rules:

- The schema must include a version.
- Unknown component types are rejected.
- Component ids and data binding ids must be unique.
- Layout values must be numeric and bounded.
- Text content must be escaped or sanitized.
- Asset URLs must be validated.
- Payload size must be limited.
- Published schema is immutable for that version.

## 8. Backend Data Model

Recommended tables:

```text
dashboards
- id
- name
- description
- owner_id
- workspace_id / tenant_id
- status: draft | published | archived
- draft_schema
- published_schema
- created_at
- updated_at
- published_at

dashboard_versions
- id
- dashboard_id
- version
- schema
- publish_note
- created_by
- created_at

dashboard_permissions
- id
- dashboard_id
- subject_type: user | role | org | public_link
- subject_id
- permission: view | edit | owner

dashboard_share_links
- id
- dashboard_id
- token
- access_scope
- expires_at
- is_enabled

dashboard_assets
- id
- dashboard_id
- type: image | icon | background
- url
- metadata
```

## 9. API Contract

Designer APIs:

```text
GET    /api/big-screens
POST   /api/big-screens
GET    /api/big-screens/:id
PATCH  /api/big-screens/:id/draft
POST   /api/big-screens/:id/copy
DELETE /api/big-screens/:id
```

Publishing APIs:

```text
POST   /api/big-screens/:id/preview
POST   /api/big-screens/:id/publish
POST   /api/big-screens/:id/unpublish
GET    /api/big-screens/:id/versions
POST   /api/big-screens/:id/versions/:version/rollback
```

Runtime APIs:

```text
GET    /api/public/big-screens/:shareToken
GET    /api/big-screens/:id/runtime
```

Data APIs:

```text
POST   /api/big-screens/data/query
POST   /api/big-screens/data/mock-preview
```

Every API response should use a stable envelope compatible with the repository's eventual backend pattern.

## 10. First-Version Components

Required components:

- Metric card.
- Line chart.
- Bar chart.
- Pie or donut chart.
- Table.
- Text.
- Image.
- Decoration or border panel.

Each component must support:

- Default state.
- Hover state where meaningful.
- Selected state in designer mode.
- Loading state.
- Empty state.
- Error state with retry when data-backed.
- Disabled or locked state in designer mode.
- Runtime read-only state.

## 11. Preset Dashboards

The product-grade version should ship 3 to 5 preset big-screen templates.

Recommended presets:

- AI Q&A operations overview.
- Business KPI command center.
- Customer/service analysis screen.
- Data quality and system health screen.
- Department performance screen.

Preset rules:

- Each preset uses real-looking mock data.
- Each preset has a clear primary focus.
- Each preset avoids generic card-grid aesthetics.
- Each preset includes loading, empty, error, and degraded examples where useful.
- Each preset follows the global motion and design constraints.

## 12. Phased Plan

Stable product version target: 8 to 12 weeks.

Week 1:

- Finalize Dashboard Schema v1.
- Validate canvas scaling POC.
- Validate Moveable, ECharts, and Pinia integration.
- Define mock data adapter format.

Weeks 2 to 3:

- Dashboard list, create, edit, copy, delete.
- Draft schema save.
- Published schema and version records.
- Permissions: owner, edit, view, share link.
- Mock data query API.

Weeks 4 to 5:

- Three-panel designer.
- Component add, select, move, resize.
- Layer, lock, delete, copy.
- Undo and redo.
- Canvas zoom, centering, and basic snapping.

Weeks 6 to 7:

- Metric card, line chart, bar chart, pie chart, table, text, image, decoration.
- Component registry.
- Basic, data, style, and analysis property groups.
- Chart type switching and mock data binding.

Weeks 8 to 9:

- Read-only runtime renderer.
- Runtime proportional scaling.
- Share-link access.
- Auto refresh, retry, and previous-data preservation.
- Preview, publish, and rollback.

Weeks 10 to 12:

- 3 to 5 preset dashboards.
- Visual polish and restrained motion.
- Playwright critical flow tests.
- Desktop and large-screen screenshot checks.
- Permission and schema validation checks.
- Documentation and handoff notes.

## 13. Acceptance Criteria

Business acceptance:

- A user can create a big screen.
- A user can drag chart and KPI components onto the canvas.
- A user can configure title, colors, fonts, chart type, and mock data.
- A user can save a draft.
- A user can preview the draft.
- A user can publish a runtime version.
- A user can open a share/runtime page and view the full-screen result.
- The runtime screen scales proportionally on mismatched screens.

Technical acceptance:

- Schema has versioning and validation.
- Designer and runtime modes are separated.
- Components are extended through a registry.
- View, edit, publish, delete, and share permissions are enforced.
- Publish, unpublish, delete, and permission changes have confirmation and audit entry points.
- Mock data states include loading, empty, error, retry, and stale-data preservation.
- Playwright covers create, edit, save, publish, and runtime access flows.
- Visual checks cover at least 1366 x 768, 1920 x 1080, and a 2K or 4K equivalent viewport.

## 14. Risks

### Schema instability

Risk: A weak schema will cause rework when real data or AI generation is added.

Mitigation: Freeze Dashboard Schema v1 before implementation and validate every boundary.

### Property panel growth

Risk: Hardcoded per-component forms will become unmaintainable.

Mitigation: Use registry-driven property groups and field definitions.

### Designer and runtime coupling

Risk: The published screen becomes heavy or exposes editor behavior.

Mitigation: Keep runtime renderer separate and avoid editor-only dependencies.

### Visual-only implementation

Risk: The product looks good in screenshots but fails under loading, permission, error, or refresh conditions.

Mitigation: Apply the global AGENTS quality bar and include state coverage in acceptance criteria.

### Data integration drift

Risk: Mock data works but future real data requires large rewrites.

Mitigation: Implement the mock layer behind the same adapter contract planned for real data.

## 15. Next Step

After this design is approved in the repository, create an implementation plan.

The next plan should define:

- Initial Vue 3 project scaffold.
- Backend technology choice.
- Schema validation library.
- Exact component registry format.
- API implementation tasks.
- Test plan and milestones.
- First preset dashboard list.
