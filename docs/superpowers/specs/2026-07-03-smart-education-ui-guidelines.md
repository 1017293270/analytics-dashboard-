# Smart Education UI Guidelines

Date: 2026-07-03

## Purpose

This document is the UI source of truth for the smart education demo platform. It extends the existing `DESIGN.md` big-screen designer rules into a full school operations console covering auth, shell navigation, role workbenches, application center, alarm management, smart blackboard, and interactive teaching.

Subagents implementing UI must read this file before touching Vue components or CSS. When this document conflicts with a generated image, follow this document. When this document conflicts with existing low-level big-screen behavior, preserve the existing implementation unless the current task explicitly changes that behavior.

## Visual References

Reference images live in `docs/superpowers/assets/`:

- `smart-education-overview.png`: global shell, overview dashboard, workbench tabs, quick application entry.
- `workbench-designer.png`: three-column workbench editor, component library, canvas, property panel, role visibility controls.
- `alarm-application-management.png`: table-first alarm management and compact application center controls.
- `smart-blackboard-activity-authoring.png`: activity generation workspace and teaching preview.
- `interactive-teaching-console.png`: teaching stage, member roles, answer responder, live layout controls.

Use these images for product hierarchy and density, not pixel-perfect copying. The implementation should feel like a real Vue admin product built from existing local patterns.

## Product Feel

The platform should feel like a serious school operations system:

- Calm, compact, and utilitarian.
- Built for repeated work by school administrators.
- Clear enough for on-site demonstration without explanatory decoration.
- Data-heavy where needed, but not visually noisy.
- Premium through alignment, spacing, and typography rather than gradients or illustration.

Do not make it look like:

- A marketing website.
- A landing page.
- A decorative dashboard template.
- A single-hue blue or purple theme.
- A prototype made from unrelated cards.

## Existing Design Inheritance

Use the current app's base tokens from `apps/web/src/styles/tokens.css`:

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

The global font stack remains:

```css
Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif
```

Add new tokens only when a value is reused across at least two smart education surfaces. Otherwise keep color values local to the component.

## Component Library Rules

New management UI must use Element Plus as the standard component library. Use Element Plus for menus, buttons, forms, filters, tables, tags, badges, cards, statistics, progress, dropdowns, dialogs, drawers, popovers, alerts, and empty states. Use `@element-plus/icons-vue` for icons.

Native semantic elements are allowed for page landmarks and text structure, including `main`, `section`, `header`, `nav`, `h1`, `h2`, `p`, and `span`. Custom CSS is allowed for layout shells, spacing, role-aware surfaces, dark canvas areas, responsive behavior, and existing big-screen renderer internals.

Do not hand-roll custom button, input, select, table, menu, dropdown, dialog, drawer, tag, badge, or tooltip components for new management pages when Element Plus provides the behavior.

Element Plus theming must be bridged to the existing project tokens in `apps/web/src/styles/element-theme.css`. The visual result must still follow the smart education rules in this document: compact, calm, table-first, 8px radius or less, no marketing hero, no decorative gradient orbs, and no nested cards.

## Color Rules

Primary colors:

- Page background: `#eef2f7`.
- Panel background: `#ffffff`.
- Muted panel: `#f8fafc`.
- Border: `#d8e2f3`.
- Text: `#0f172a`.
- Muted text: `#64748b`.
- Primary action: `#2563eb`.
- Primary soft fill: `#dbeafe`.

Status colors:

- Success, enabled, online, published: `#16a34a` or `#22c55e`.
- Warning, draft, processing, partial: `#f59e0b`.
- Danger, unhandled, offline, failed: `#dc2626` or `#ef4444`.
- Neutral, disabled, inactive: `#64748b`.
- Info, selected, editing: `#2563eb` or canvas cyan `#38bdf8`.

Dark surfaces:

- Dashboard canvas: `#07111f` or `#0b1220`.
- Runtime background: `#030712`.
- Teaching/blackboard preview: dark slate or blackboard tone, not pure black.

Avoid:

- Dominant purple or purple-blue gradients.
- Decorative gradient orbs.
- Beige, brown, or espresso themes.
- Low-contrast gray-on-gray labels.
- Random chart colors.

## Typography

Use compact product typography:

- Page title: 22-28px, 800 or 900 weight.
- Section heading: 16-20px, 800 or 900 weight.
- Table header: 12-13px, 800 or 900 weight.
- Body text: 13-15px.
- Form label: 12-13px, 800 weight.
- Button text: 13-14px, 800 or 900 weight.
- KPI value: 24-38px depending on container size.
- Runtime dashboard title: may be larger, but only inside canvas/runtime surfaces.

Rules:

- Do not scale font size with viewport width.
- Letter spacing should stay `0` except for tiny uppercase English eyebrows.
- Chinese labels must fit naturally; avoid overlong label text inside buttons.
- Text inside buttons, chips, tabs, tables, and property panels must not wrap awkwardly or overflow.

## Layout System

Use these app-level layout patterns:

### Auth Page

- Centered login panel on `--color-page`.
- Panel width around 400-440px.
- Use one panel only; do not create a marketing hero.
- Show demo account hints compactly below the form.

### App Shell

- Left sidebar plus top bar is the default for management pages.
- Sidebar width: 220-260px on desktop.
- Top bar height: 56-64px.
- Main content should scroll independently when needed.
- Keep shell background quiet so work surfaces remain primary.

Sidebar content order:

1. 首页总览
2. 工作台配置
3. 数据看板
4. 应用中心
5. 告警管理
6. 智慧黑板
7. 互动教学
8. 账号权限
9. 系统设置

Top bar should support:

- School name.
- Current role or role switch.
- Date/time or demo status.
- Notification indicator.
- Current user menu.

### Management Pages

Use table-first layouts for application center, alarm management, users, and roles:

- Header row with title, short context, and primary action.
- Filter row below header when the page has searchable data.
- One main table surface with lightweight row separators.
- Detail drawer or side panel for selected records.

Avoid turning every row into a standalone card.

### Workbench Designer

Preserve the existing designer mental model:

- Top toolbar.
- Left component palette.
- Center scaled canvas.
- Right property panel.

Smart education additions:

- Role visibility belongs in toolbar modal or property panel tab.
- Third-party web embed URL belongs in property panel data/settings area.
- Publish and enable/disable must be visually distinct.

### Preview and Runtime

Runtime screens should show only content, no editor shell.

For embedded previews inside management pages:

- Keep preview panels visually secondary to the editor/form unless the task is presentation review.
- Use fixed aspect ratios for blackboard, desktop share, and dashboard previews.

## Surface and Card Rules

Cards are allowed for:

- KPI tiles.
- Repeated dashboard components inside a canvas.
- Modal/dialog content.
- Individual app entries only when shown as an app launcher grid.

Cards are not allowed for:

- Every page section.
- A full page floating inside another background.
- Table rows in a dense management list.
- Nested content inside another card.

Radius:

- Use 8px or less for cards, panels, inputs, buttons, and modals.
- Icon buttons can use 6-8px.

Elevation:

- Use borders and surface tint first.
- Use `--shadow-panel` for modals or major floating panels only.
- Avoid heavy shadows in dense pages.

## Controls

Use familiar controls:

- Icon buttons for tool actions.
- Text buttons only for clear commands.
- Segmented controls for modes and view switches.
- Tabs for mutually exclusive page sections.
- Toggles for enabled/disabled binary settings.
- Checkboxes for role visibility and multi-select.
- Select controls for finite option sets.
- Numeric inputs for x, y, width, height, z-index, and refresh intervals.
- Color swatches for color fields.
- Compact input groups for filters.

Buttons:

- Primary button: blue filled.
- Secondary button: white or muted panel with border.
- Danger button: red only for destructive actions.
- Disabled button: opacity reduction plus non-click cursor.

Do not use pill-like decorative buttons when an icon button or normal button is clearer.

## Navigation and Role Visibility

Role-aware UI must be visible and understandable:

- Role chips should use text labels: 系统管理员, 全员, 电教主任, 德育主任, 教研主任.
- Role chips can be neutral by default and blue when selected.
- Visibility settings should use checkboxes with role names.
- Do not hide the reason for an empty view; show a short state such as 当前角色暂无可见工作台.

Admin-only controls:

- Show admin controls only for system administrators.
- Do not show disabled admin-only buttons to non-admin users unless the page is explicitly demonstrating permissions.

## Data Visualization

Use ECharts-style visual density:

- Every chart needs a title or nearby label.
- Axes and legends must remain readable.
- Keep chart colors semantic and stable.
- Use no-data states instead of blank charts.
- Use skeleton loading for charts and KPI tiles when needed.

Default chart mapping:

- Education governance: line, bar, KPI, alarm trend.
- Teacher development: radar, bar, KPI, table.
- Student growth: trend, pie/donut, ranking, table.
- Device operations: online rate, status table, alarm distribution.
- Application usage: category bars, app launcher grid, usage table.

## Tables and Filters

Tables:

- Header row uses muted background or strong text.
- Rows use separators, not individual card borders.
- Actions stay grouped on the right.
- Status columns use chips.
- Long fields truncate with tooltip/title where practical.

Filter rows:

- Place filters above the table.
- Keep filters one line on desktop when possible.
- Use clear labels: 时间范围, 设备编号, 设备名称, 设备位置, 事件状态, 触发方式.
- Search and reset actions stay at the end of the filter row.

## Status Chips

Use compact chips for state:

- 已发布: green.
- 草稿: amber.
- 已启用: green.
- 已停用: neutral.
- 未处理: red.
- 处理中: amber.
- 已处理: green.
- 在线: green.
- 离线: red or neutral depending severity.
- 共享中: blue or green.
- 未共享: neutral.

Chips should be 24-28px tall and should not dominate table rows.

## Alarm Management

Alarm pages must be operational and table-first.

List columns:

- 设备标识符
- 设备名称
- 发生位置
- 通知人/责任人
- 触发方式
- 事件状态
- 上报时间
- 操作

Detail drawer rules:

- Use a side drawer or integrated detail panel.
- Put responsibility info near the top.
- Show 责任人电话 as selectable/copyable text.
- Event recording is a stable audio-player placeholder in phase one.
- Disposal records use a timeline, not a chat bubble layout.
- Status transition buttons should be grouped and clearly disabled when not available.

## Application Center

Application management should feel like enterprise app administration:

- Main list can be table or compact grid, depending context.
- Application launcher on overview pages can be a grid.
- Management pages should prefer table-first layout.
- Category chips: 网页端, 移动端, 教学工具, 管理工具, 数据看板.
- Visibility tags show role names.
- Add/edit forms use drawer or modal.

Application fields:

- 应用名称
- 应用分类
- 端类型: 网页端 or 移动端
- 访问地址 or 包标识
- 应用图标
- 可见范围
- 状态

## Smart Blackboard

The smart blackboard activity authoring page should read as a teacher tool, not a generic form.

Layout:

- Left: source input and video transcription placeholder.
- Center: structured activity editor.
- Right: blackboard-style classroom preview.

Required controls:

- 文本输入 / 视频转写 tabs.
- 删除语气词 toggle.
- 一键解析 primary action.
- Activity type tabs: 选词填空, 判断对错, 趣味选择.
- Editable question stem and options.
- Correct answer marker.
- Preview panel.

Video deletion:

- Show 视频片段同步删除：暂未启用 as a disabled capability.
- Do not build visible timeline-editing controls in phase one.

Preview:

- Use a dark blackboard surface.
- Answer chips should be large enough for classroom display.
- Avoid cartoon classroom illustration.

## Interactive Teaching

The interactive teaching console is a simulated control surface.

Layout:

- Center: shared whiteboard or desktop stage.
- Right: member list and role assignment.
- Bottom or secondary side panel: answer responder and layout controls.

Required controls:

- 共享远程白板.
- 共享电脑桌面.
- 截屏插入.
- 答题器.
- 设为授课老师.
- 设为学生.
- 直播画面布局.
- 教师发言时放大显示 toggle.

Rules:

- Do not imply real video transport.
- Use neutral avatar placeholders, not real faces.
- Speaking or active teacher state can use blue/green chips.
- Muted/offline states use red or neutral chips.
- The stage should feel active but not like a video-conferencing marketing page.

## Forms

Form layout:

- Labels above fields in narrow panels.
- Labels left of fields only in dense property panels.
- Required markers should be subtle.
- Validation errors appear under the field.
- Form actions align right in drawers/modals and left or right consistently in full pages.

Field sizes:

- Default input height: 36-40px.
- Compact property input height: 32-36px.
- Textarea min height: 96px.

## Drawers and Modals

Use drawers for:

- Alarm detail.
- Application add/edit.
- Role visibility configuration when launched from a list.

Use modals for:

- Confirm archive/delete/uninstall.
- Short publish or enable/disable confirmations.

Drawer width:

- 420-520px for forms.
- 520-640px for details with timelines.

## Empty, Loading, and Error States

Every page and meaningful panel needs states:

- Loading: skeletons, not spinners alone.
- Empty: short explanation plus one obvious action when allowed.
- Filtered empty: explain that filters produced no results and offer reset.
- Error: visible message and retry action when practical.
- Permission empty: say the current role has no access, without exposing backend permission internals.

Keep state copy short. Do not add in-app tutorial paragraphs.

## Motion

Motion level is restrained:

- 120-250ms transitions.
- Hover/focus color changes.
- Drawer slide can be subtle.
- Skeleton shimmer is allowed.
- Canvas selection outlines and drag opacity are allowed.

Avoid:

- Bouncy animation.
- Continuous decorative motion.
- Layout-shifting animation.
- Heavy runtime effects that distract from data.

Always respect `prefers-reduced-motion` for shimmer or looping effects.

## Responsive Behavior

Desktop is primary.

Required desktop checks:

- 1440 x 1024.
- 1366 x 768.
- 1920 x 1080 for runtime/canvas.

Tablet behavior:

- Shell may collapse sidebar or stack secondary panels.
- Designer property panel can move below canvas following existing rules.

Mobile behavior:

- Pages should remain readable for review and light edits.
- Full designer authoring does not need to be ideal on mobile.

## Accessibility

Minimum expectations:

- Keyboard focus visible on all interactive controls.
- Inputs have labels.
- Icon-only buttons have accessible names.
- Tables have meaningful headers.
- Loading areas use `aria-busy` when practical.
- Error messages use `role="alert"` or visible status patterns.
- Color is not the only indicator for status; include text chips.

## Copywriting

Use concise Chinese product copy.

Preferred terms:

- 智慧教育集控平台
- 首页总览
- 工作台配置
- 数据看板
- 应用中心
- 告警管理
- 智慧黑板
- 互动教学
- 账号权限
- 可见范围
- 启用 / 停用
- 发布 / 草稿

Avoid:

- Explaining obvious UI mechanics in visible page text.
- Marketing slogans.
- Long feature descriptions in panels.
- English labels where a natural Chinese label exists.

## Implementation Guardrails

Subagents must follow these rules:

- Read this file and `DESIGN.md` before implementing any UI task.
- Reuse `apps/web/src/styles/tokens.css`.
- Reuse existing big-screen components and patterns when touching designer/runtime surfaces.
- Do not fork editor and runtime data-loading behavior.
- Do not bypass `componentRegistry` for dashboard components.
- Do not add controls that do not update backed state.
- Do not introduce a new CSS framework.
- Do not add decorative image assets unless explicitly requested.
- Do not use inline SVG for icons when a standard icon library is available in the task context.
- Keep all page-specific CSS scoped unless creating a deliberate shared shell primitive.

## UI Review Checklist

Before a UI task is accepted:

- The page uses the shared shell or deliberately documents why it does not.
- Text does not overflow buttons, chips, table cells, or panels.
- Table and filter spacing remains readable at 1366 x 768.
- All actions have disabled/loading states where needed.
- Empty and error states are present.
- Role and status chips use semantic colors and text.
- No card-inside-card layout was introduced.
- No decorative gradient blobs or marketing hero sections were introduced.
- Existing designer/runtime tests still pass if those surfaces were touched.
- At least one desktop screenshot or visual inspection is performed for meaningful UI work.

## Relationship to Existing Documents

- `DESIGN.md` remains the detailed rulebook for the current big-screen designer, component renderers, chart presets, and runtime behavior.
- `2026-07-02-smart-education-demo-platform-design.md` defines the phase-one product scope.
- `2026-07-03-auth-role-foundation.md` defines the first implementation plan.
- This UI guidelines document defines how the smart education pages should look and behave across all implementation plans.
