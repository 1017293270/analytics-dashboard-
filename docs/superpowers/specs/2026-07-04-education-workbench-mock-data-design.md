# Education Workbench Mock Data Design

Date: 2026-07-04

## Goal

Make the workbench big-screen pages credible for the July 9 smart-education demonstration. The user chose **A+B**:

- A: seed the four default role workbenches with ready-to-show education-themed big-screen layouts.
- B: extend the mock data API so existing and newly added chart/table/metric components can query education metrics directly.

The goal is demo polish and believable data density, not production data integration.

## Scope

In scope:

- Default workbench schemas for:
  - `dashboard-all` / 全员工作台
  - `dashboard-electro` / 电教主任工作台
  - `dashboard-moral` / 德育主任工作台
  - `dashboard-research` / 教研主任工作台
- Education mock data for metrics, trend charts, category charts, radar/funnel charts, and tables.
- Data bindings using the existing `sourceType: 'mock'` contract.
- Existing component library only: `metric-card`, chart components, `table`, `text`, `decoration`, and existing `web-embed` if useful.
- Safe reseeding behavior for default demo workbenches so empty/old default schemas can be upgraded without breaking custom user-created dashboards.

Out of scope:

- Real school device telemetry.
- Real third-party dashboard iframe data.
- New renderer types or a new visual design system.
- Changing authentication, role permissions, or runtime routes.

## Data Design

Extend `apps/api/src/data/mock-data.ts` with education-oriented keys while keeping existing SaaS mock keys for backward compatibility.

Metric examples:

- `school_device_online_rate`: 98.6
- `school_online_devices`: 642
- `school_today_alarms`: 8
- `school_unresolved_alarms`: 4
- `blackboard_active_rooms`: 36
- `application_launches_today`: 1286
- `student_growth_index`: 91.8
- `teacher_development_index`: 88.6
- `teaching_activity_count`: 156
- `repair_completion_rate`: 93.5

Time-series examples:

- `device_alarm_trend`
- `device_online_trend`
- `application_usage_trend`
- `student_activity_trend`
- `teacher_research_trend`
- `teaching_activity_trend`

Category/radar/funnel examples:

- `device_type_status`
- `alarm_level_distribution`
- `application_platform_usage`
- `class_activity_rank`
- `student_growth_profile`
- `teacher_capability_profile`
- `repair_process_funnel`

Table examples:

- `alarm_queue_education`
- `device_repair_orders`
- `class_activity_detail`
- `teacher_research_tasks`
- `application_usage_detail`

The API response shape stays unchanged:

- Metrics return `{ kind: 'metric', value, label, trend }`.
- Time-series return `{ kind: 'time-series', rows: [{ date, count }] }`.
- Category-like charts return `{ kind: 'category', rows: [{ category, value }] }`.
- Tables return `{ kind: 'table', columns, rows }`.

## Workbench Schema Design

Add an education workbench schema factory in the API dashboard seed layer. Each default workbench gets a complete `DashboardSchema` with:

- Canvas: 1920 x 1080, `fit-screen`.
- Theme: green education console palette aligned with the current UI.
- Header text: school name, role workbench name, demo timestamp.
- KPI cards at the top.
- Charts in the middle.
- Tables and status lists at the bottom/right.
- Data bindings pointing to the mock keys above.

Recommended layout per role:

| Workbench | Demo Story | Main Components |
| --- | --- | --- |
| 全员工作台 | 校级总览，一眼看到设备、告警、应用、课堂活动运行态 | 设备在线率、今日告警、应用启动、课堂活动、告警趋势、应用使用、班级活跃排行 |
| 电教主任工作台 | 设备运维闭环，证明一体机/黑板/应用和告警可管 | 在线设备、未处理告警、维修完成率、设备类型分布、告警等级、维修工单表 |
| 德育主任工作台 | 学生成长与活动治理，证明角色工作台差异化 | 学生成长指数、行为事件、活动覆盖、班级活动排行、成长画像、事件明细 |
| 教研主任工作台 | 教师发展和教研活动，证明教师发展看板能力 | 教师发展指数、教研任务、课堂活动数、活动趋势、能力雷达、教研任务表 |

## Reseed Behavior

Default workbenches are special demo assets. On `ensureDefaultWorkbenchDashboards()`:

- If a default workbench is missing, create it with the education schema.
- If a default workbench exists but has an empty schema or the legacy blank schema, upgrade its draft schema to the education schema.
- If a default workbench already has user-edited components, do not overwrite it automatically.
- Keep status as draft unless the existing record is already published.

This protects ad hoc custom work while making the four tender-demo workbenches useful out of the box.

## Verification

Automated checks:

- Unit tests for education mock metric/category/table keys.
- Repository/route tests that default workbenches are seeded with non-empty schemas.
- Existing big-screen e2e should continue to pass.
- `npm run demo:rehearsal` should still pass because route gates are unchanged.

Manual/demo checks:

- Open `/workbenches`.
- Open each default workbench.
- Confirm the canvas is no longer empty.
- Add a chart from the component library and bind/select mock data as before.
- Publish/preview at least one workbench runtime.

## Risks And Boundaries

- Mock data must be described as演示数据, not live telemetry.
- Do not imply real device integration, real student records, or real BI backend ingestion.
- Avoid changing the renderer layer; the fastest safe route is richer schemas plus richer mock API data.
- The currently open custom URL `uLm01KpcLKvifbtXj_88n` may be a user-created workbench. It should not be overwritten unless it is one of the four default IDs or the user explicitly requests filling that exact dashboard too.
