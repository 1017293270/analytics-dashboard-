# Account And Role Management Demo Design

Date: 2026-07-03

## Summary

Build a demo-grade **账号与角色** page for the smart education demo platform. The page completes the account-management story needed to explain role-based workbench, dashboard, application, and menu visibility during the on-site tender demonstration.

This is not a production RBAC rebuild. The goal is to make the current account foundation visible, explainable, and testable in the demo:

- Demo users can be seen in one management page.
- Demo roles can be reviewed with clear responsibility descriptions.
- Role-to-workbench and role-to-menu visibility can be previewed.
- Common admin actions are visible and interactive through local demo state.
- The page strengthens the tender clause that different roles see different workbenches.

## Project Context

The platform already has the core foundation required for this slice:

- Auth routes and session loading exist.
- Demo users are seeded in `apps/api/src/auth/auth.seed.ts`.
- Demo roles include:
  - 系统管理员
  - 全员
  - 电教主任
  - 德育主任
  - 教研主任
- `/api/roles` already returns demo roles for system administrators.
- Frontend navigation already filters entries by role in `apps/web/src/features/shell/navigation.ts`.
- Workbench metadata already models role visibility and enable/disable state.
- The final rehearsal Playwright gate currently asserts that unrelated `账号权限` / `系统设置` entries are absent. That assertion must be updated when this approved page is added.

## Goals

1. Add a visible management page named **账号与角色**.
2. Show seeded demo accounts and their roles in a table-first management layout.
3. Show seeded demo roles with descriptions, visible menu count, visible workbench count, and bound account count.
4. Provide a role visibility preview so the presenter can select a role and show:
   - Visible sidebar menu items.
   - Visible workbenches.
   - Related dashboard/application/blackboard/teaching access notes.
5. Provide demo interactions for:
   - 新增账号
   - 编辑账号角色
   - 启用 / 停用账号
   - 重置密码
6. Keep all demo interactions deterministic, local, and reversible during the browser session.
7. Update tests and demo rehearsal coverage so the new page is part of the delivery gate.

## Non-Goals

The first delivery must not implement:

- Full production RBAC.
- Permission matrix editing by route, action, or API operation.
- Real password reset flow.
- Real SMS, email, or identity-provider integration.
- Organization tree, department synchronization, or batch import.
- Persistent user CRUD beyond seeded demo data.
- Audit-log storage.
- Backend enforcement changes outside existing auth/role checks.

These items would increase delivery risk without materially improving the July 9 demo.

## Route And Navigation

Add one protected route:

- Path: `/accounts`
- Page title: `账号与角色`
- Sidebar label: `账号与角色`
- Sidebar key: `accounts`
- Sidebar placement: add the item near the bottom of the current flat navigation. Do not introduce a new empty settings group for this slice.
- Icon: use the Element Plus `UserFilled` icon.
- Allowed roles: `['system-admin']`

Only system administrators should see this page in the sidebar. Non-admin users should continue to be filtered out by the existing `getVisibleShellNavItems` logic.

## Page Layout

Use Element Plus components and follow `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`.

The page should be a compact management surface, not a landing page.

### Header

The header contains:

- Title: `账号与角色`
- Subtitle: `维护演示账号、角色绑定和工作台可见范围`
- Primary action: `新增账号`
- Secondary action: `重置演示状态`

The secondary action may simply restore local demo state to seeded data.

### KPI Row

Show four compact metrics:

1. `账号总数`
2. `启用账号`
3. `角色数量`
4. `已绑定工作台`

Metrics should be derived from the demo data, not hard-coded in the template.

### Account Table

The default tab is `账号列表`, and it contains the account table.

Columns:

- `账号`
- `姓名`
- `手机号`
- `角色`
- `状态`
- `最近登录`
- `可见工作台`
- `操作`

Seed rows:

- `admin` / 系统管理员 / 系统管理员
- `all_staff` / 全员演示账号 / 全员
- `electro_director` / 电教主任 / 电教主任
- `moral_director` / 德育主任 / 德育主任
- `research_director` / 教研主任 / 教研主任

The existing seed does not include phone numbers or last-login timestamps. For the demo page, add frontend display fields in account management demo data:

- Phone examples should look realistic but not be real personal numbers, such as `13800000001`.
- Last-login values should be stable relative labels or fixed demo timestamps, such as `2026-07-03 09:18`.

Table actions:

- `编辑`
- `停用` for enabled accounts and `启用` for disabled accounts
- `重置密码`

Actions update local page state and show Element Plus success messages. They do not need to call production APIs.

### Role Table

The role section lists the five seeded roles.

Columns:

- `角色名称`
- `角色编码`
- `说明`
- `绑定账号`
- `可见菜单`
- `可见工作台`
- `状态`
- `操作`

The `编辑` action opens a drawer where the presenter can change the role display name, description, and visible demo workbenches in local state. It must not expose a deep permission matrix.

### Visibility Preview

Add a highly visible preview panel on the same page.

Controls:

- Role selector with the five demo roles.

Preview output:

- Visible sidebar menu list.
- Visible workbench list.
- Status chips for:
  - `数据看板`
  - `应用中心`
  - `告警管理`
  - `智慧黑板`
  - `互动教学`

The preview should use the same navigation role-filtering rules as the shell. This prevents the account page from telling a different story than the actual sidebar.

For workbenches, reuse the workbench metadata helpers where possible so disabled workbenches and role visibility stay consistent with `/workbenches`.

## Data Design

Create a small account-management demo data module in the web app, for example:

- `apps/web/src/features/accounts/accountData.ts`

Suggested exported data and helpers:

- `demoAccountRows`
- `demoRoleRows`
- `buildAccountSummary(accounts, roles, workbenches)`
- `getAccountsByRole(accounts, roleCode)`
- `getVisibleMenusForRole(roleCode, shellNavItems)`
- `getVisibleWorkbenchesForRole(roleName, workbenches)`
- `toggleAccountStatus(accountId)`
- `resetAccountDemoState()`

The page should not duplicate role codes by hand in many components. Keep the mapping between role code and Chinese role name in one helper table.

Backend use for the first implementation:

- Use frontend deterministic demo data for account list details.
- Use shared role codes and existing auth seed naming.
- Fetching `/api/roles` is allowed only as a non-blocking enrichment for role descriptions.
- Do not add `/api/users` in this slice.
- Keep local fallback data so the demo page works without backend changes.

## Component Design

Place feature files under:

- `apps/web/src/features/accounts/`

Suggested structure:

- `AccountsView.vue`
- `accountData.ts`
- `accountData.test.ts`
- `AccountsView.test.ts`

The view can use internal sections instead of creating many small components for the first implementation. Extract only if a section becomes hard to read.

Use Element Plus components:

- `el-table`
- `el-tag`
- `el-tabs`
- `el-drawer`
- `el-form`
- `el-select`
- `el-button`
- `el-message`
- `el-empty`

Do not add a new UI library.

## Interaction Behavior

### 新增账号

Open an `el-drawer` with:

- 账号
- 姓名
- 手机号
- 角色
- 状态

Validation:

- 账号 required.
- 姓名 required.
- At least one role required.
- Duplicate username not allowed in local state.

On save:

- Add row to local state.
- Show success message.
- Update KPI counts and role account counts.

### 编辑账号角色

Open the same drawer in edit mode.

Allowed changes:

- 姓名
- 手机号
- 角色
- 状态

On save:

- Update local state.
- Recompute visible workbench count.
- Show success message.

### 启用 / 停用

Toggle local status between `启用` and `停用`.

Disabled accounts should:

- Show a gray status chip.
- Still remain visible in the table.
- Not reduce role definitions.

### 重置密码

Show a confirmation dialog, then a success message:

`已生成演示密码：Demo@123`

No real password change is required.

### 重置演示状态

Restore seeded accounts and roles.

This is important for repeated demo rehearsals.

## Error Handling

The page should remain demo-ready even if the non-blocking role request fails.

If `/api/roles` fails:

- Use local seeded role data.
- Show a small non-blocking inline note: `已使用本地演示角色数据`.

If local validation fails:

- Show inline Element Plus form validation.

If an action is simulated:

- Use success messages that do not claim real production side effects.
- Preferred copy examples:
  - `演示账号已添加`
  - `角色绑定已更新`
  - `演示密码已重置`

Avoid copy such as `已同步至统一身份认证平台` because no such integration exists.

## Tests

Add or update tests in four layers.

### Data Tests

`accountData.test.ts` should verify:

- Seeded accounts include the five demo users.
- Summary counts are derived correctly.
- Role account counts are derived correctly.
- Visible menu preview matches `getVisibleShellNavItems`.
- Visible workbench preview matches workbench metadata helpers.
- Local status toggle and reset helpers behave deterministically.

### Component Tests

`AccountsView.test.ts` should verify:

- Page renders KPI row, account table, role table, and visibility preview.
- Role selector updates visible menu and workbench preview.
- 新增账号 validation rejects missing required fields.
- Adding a valid demo account updates the table and summary.
- 启用 / 停用 changes the account status chip.
- 重置密码 opens confirmation and shows success behavior.

### Router And Navigation Tests

Update:

- `apps/web/src/router.test.ts`
- `apps/web/src/features/shell/navigation.test.ts`
- `apps/web/src/smoke.test.ts`

Expected behavior:

- `/accounts` is a protected shell route.
- System administrator can see `账号与角色`.
- Non-admin roles do not see `账号与角色`.
- The route lazy-loads the accounts page.

### E2E Demo Rehearsal

Update:

- `apps/web/e2e/demo-rehearsal.spec.ts`

Required coverage:

- Sidebar includes `账号与角色` for admin.
- The page opens successfully.
- KPI row is visible.
- Account table contains `admin`, `electro_director`, and `research_director`.
- Visibility preview can switch to `电教主任`.
- Preview shows role-appropriate menus and workbenches.
- A simulated status-toggle action works.

Update the previous assertion so only unrelated `系统设置` navigation remains absent.

## Demo Pass Criteria

The page is demo-ready when the presenter can:

1. Log in as `admin`.
2. Open `账号与角色` from the sidebar.
3. Explain the five seeded demo roles.
4. Select `电教主任` in the visibility preview.
5. Show that the preview links the role to relevant menus and workbenches.
6. Toggle or edit an account state and show immediate feedback.
7. Reset demo state before another rehearsal.

The page must support this story:

> 平台通过账号角色控制不同岗位的可见范围。系统管理员可以维护账号和角色绑定；不同主任角色登录后，只看到对应的工作台、应用和数据入口。

## Development Boundaries

Implementation should be completed as one small slice:

1. Add demo data helpers and tests.
2. Add `AccountsView.vue`.
3. Add route and sidebar item.
4. Update navigation/router/smoke tests.
5. Update Playwright demo rehearsal.
6. Run `npm run test`, `npm run lint`, `npm run build`, and `npm run demo:rehearsal`.

Avoid broad refactors of:

- Auth session handling.
- Database schema.
- Existing role codes.
- Workbench designer internals.
- Application center and dashboard modules.

## Project Manager Review Notes

This slice is approved because it supports the existing tender demo route rather than adding unrelated administration depth.

It is still considered drift if implementation expands into:

- Organization hierarchy.
- Production permission matrix.
- Backend user mutation endpoints.
- Audit-log screens.
- A generic settings center.

The page should be treated as a credibility layer for the role-workbench demonstration, not as a new primary tender module.
