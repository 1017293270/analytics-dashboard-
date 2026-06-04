# Big Screen Testing Notes

## Unit Tests

- Shared API envelope helpers.
- Shared dashboard schema validation.
- Permission helpers.
- Default dashboard schema.
- Runtime scale calculation.
- Component registry and renderer helper behavior.
- Mock data adapter validation.
- Designer store save, publish, dirty-state, and stale-request behavior.
- Dashboard list loading, empty, archive, versions, rollback, and row-action states.

## API Tests

- Create and fetch dashboards.
- Reject invalid create bodies and invalid draft schemas.
- Reuse local draft reservations safely.
- Reject archived and cross-workspace reservation reuse without uniqueness-error leaks.
- Enforce metadata and draft edit permissions.
- Publish dashboard runtime schemas.
- Copy, unpublish, archive, versions list, rollback, share-link creation, and public share runtime.
- Hide archived dashboards and schema fields from the list response.
- Reject archived or cross-workspace direct access.
- Treat invalid stored permissions as no permission.
- Reject non-public share scopes and disabled share tokens after unpublish or archive.
- Return mock data through the data query endpoint.

## E2E Tests

- Create a new screen.
- Apply the AI operations preset.
- Publish the saved draft.
- Open the runtime preview.
- Verify visible title, metric, table, and chart content.
- Verify ECharts renderers have real drawable dimensions.
- Verify runtime scaling at 1366 x 768 and 1920 x 1080.

## Visual Checks

Capture or inspect key states at:

- 1366 x 768
- 1920 x 1080
- 2560 x 1440 or a 4K-equivalent viewport
- A narrow mobile viewport for library and designer shell layout

Check that runtime content remains centered and proportionally scaled, text does not overflow controls, chart canvases are non-empty, and loading/error/empty states remain readable.

## Verification Commands

```bash
npm run test
npm run lint
npm run build
npm run e2e
```

The build currently passes with a Vite large chunk warning for the designer/runtime chart bundle. Treat this as a follow-up performance item, not a failing delivery check.
