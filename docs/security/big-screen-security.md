# Big Screen Security Notes

## Boundaries

- Dashboard schema is validated with Zod before draft save and publish.
- Stored dashboard schemas are parsed through the shared schema validator before being returned to the UI.
- Unknown component types, invalid layout values, invalid data binding shapes, and malformed API request bodies are rejected at typed boundaries.
- Text values render through Vue interpolation rather than raw HTML.
- Public share runtime requires an enabled `public-runtime` share token, a non-expired link, an active dashboard in the current workspace, published status, and a published schema.
- Archived dashboards are hidden from the library and cannot be fetched, edited, published, copied, shared, rolled back, or opened through runtime routes.
- Local draft reservation reuse does not resurrect archived or cross-workspace dashboards and returns a stable API envelope instead of leaking database uniqueness errors.

## Permissions

- Authenticated API sessions use an `analytics_session` cookie with `HttpOnly`, `SameSite=Lax`, and `Path=/`.
- Session cookies are marked `Secure` when `AUTH_COOKIE_SECURE=true` or `NODE_ENV=production`; local HTTP development can set `AUTH_COOKIE_SECURE=false`.
- Malformed session cookie values are treated as missing sessions rather than internal server errors.
- Current-user responses are validated against the shared auth contract before crossing API and frontend auth boundaries.
- `view` allows dashboard detail, versions list, and runtime access.
- `edit` allows metadata, draft save, copy, and archive actions.
- `owner` allows publish, unpublish, rollback, and share-link creation.
- Invalid stored permission values are treated as no permission.
- Dashboard listing only includes dashboards in the current workspace with a valid `view`, `edit`, or `owner` permission for the active actor.

## Data

- The first version uses mock data only.
- Real dataset, SQL, and AI question sources must pass workspace, tenant, actor, and permission context into the data adapter before query execution.
- SQL or query-backed sources must use parameterized access, input normalization, rate limits, and audit logging before production use.
- AI-generated chart or query configuration must be parsed and validated before it reaches persistence or data execution.

## Auditing

- Publish, metadata update, draft update, copy, archive, unpublish, rollback, and share-link creation create audit entries.
- High-risk production actions that are added later, such as permission changes, external sharing, batch deletes, and real data source updates, should require confirmation and audit logging.

## Production Follow-Ups

- Replace the demo actor/workspace constants with authenticated actor and workspace context.
- Add rate limits for public runtime tokens and high-cost data query endpoints.
- Move images and other assets into managed asset records with URL allowlists or signed asset delivery.
- Add explicit CSRF tokens for high-risk state-changing routes before production use; current demo sessions rely on `SameSite=Lax`.
- Add observability for API latency, publish cost, runtime data refresh failures, and share-token access volume.
