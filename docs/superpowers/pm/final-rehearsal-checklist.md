# Final Demo Rehearsal Checklist

Date: 2026-07-03

Purpose: use this checklist to decide whether the July 9 on-site demonstration is ready enough to run live. The goal is credible software demonstration, not production acceptance.

## Pass Gate

The demo passes the final rehearsal only if all required routes can be clicked in sequence without exposing placeholders or unsupported claims.

Minimum pass:

- Login succeeds with `admin / Admin@123`.
- Sidebar contains only the eight demo routes.
- `/accounts` shows the account-role demo page and role visibility preview.
- `/overview` metrics match current seed data.
- Workbench visibility settings are backend-seeded before the run, with the four default workbenches enabled.
- `/workbenches` shows four role workbenches and the designer can open.
- Workbench palette shows at least 30 component templates and includes `第三方网页`.
- `/data-dashboards` shows six dashboards and `告警态势` third-party preview metrics.
- `/applications` shows web/mobile application management, categories, visible scope, and enable state.
- `/alarms` can filter, open `HB-3F-021`, show phone, recording control, and disposal records.
- `/teaching` visibly changes state for role assignment, whiteboard sharing, desktop sharing, screenshot insert, answer responder, layout switch, and teacher focus.
- `/blackboard` completes activity parsing and shows the deferred video tab state.

## Environment

| Item | Expected | Result |
| --- | --- | --- |
| API server | `http://localhost:4000` reachable | |
| Frontend server | `http://127.0.0.1:5174` reachable | |
| Browser | Desktop width, 1280px+, 90%-100% zoom | |
| Account | `admin / Admin@123` login succeeds | |
| Visible seed date | Alarm and dashboard demo timestamps show `2026-07-09` | |
| Workbench settings | Four default workbenches are backend-seeded with enabled availability | |
| Console | No local application errors during scripted path | |
| Automated gate | `npm run demo:rehearsal` passes on 1366x768 and 1920x1080 projects | |

## Automated Rehearsal Gate

Run this after any UI-upgrade, route, seed-data, or demo-copy change:

```bash
npm run demo:rehearsal
```

Expected result:

- `Desktop Chrome 1366x768` passes.
- `Large Screen Chrome 1920x1080` passes.
- The gate logs in with `admin / Admin@123`.
- The gate uses API-backed workbench settings rather than browser-local availability state.
- The gate covers overview, account-role management, workbenches, data dashboards, application center, alarms, teaching, blackboard, then returns to overview.
- The gate fails on local page errors or local console errors, except the known third-party iframe storage-permission noise from `demo.school.local`.

Do not replace the live manual rehearsal with this command. Treat it as the fast regression gate before the human walkthrough.

## Route Order

Run the demo in this order:

1. `/login`
2. `/overview`
3. `/accounts`
4. `/workbenches`
5. `/workbenches/dashboard-electro`
6. `/data-dashboards`
7. `/applications`
8. `/alarms`
9. `/teaching`
10. `/blackboard`
11. `/overview`

Do not visit non-scripted routes during the formal run.

## Overview Gate

| Evidence | Expected |
| --- | --- |
| Sidebar routes | 首页总览、工作台配置、数据看板、应用中心、告警管理、智慧黑板、互动教学、账号与角色 |
| 未处理告警 | `4` |
| 演示样例今日口径 | `8 条` |
| 角色工作台 | `4` |
| 工作台启用 | `4 个` |
| 演示应用 | `8` |
| 网页端应用 | `5` |
| 移动端应用 | `3` |
| 应用启用 | `6 个` |
| 数据看板服务 | `2 个第三方嵌入看板接入 / 可演示` |
| Forbidden wording | No `42ms`, no `第三方看板延迟`, no stale device IDs |

## Account And Role Gate

| Step | Expected |
| --- | --- |
| Open `/accounts` | Account-role management page appears |
| Summary | 账号总数 `5`, 启用账号 `5`, 角色数量 `5` |
| Account table | `admin`, `electro_director`, and `research_director` are visible |
| Role preview | Can switch to `电教主任` |
| Menu preview | `应用中心` and `告警管理` are visible for 电教主任 |
| Workbench preview | `电教主任工作台` is visible |
| Status action | `research_director` can be stopped and restored with `重置演示状态` |
| Presenter wording | Says demo-grade account-role management; do not claim production identity federation or full permission matrix |

## Clause ♦1 Workbench Gate

| Step | Expected |
| --- | --- |
| Open `/workbenches` | Four default workbenches are visible |
| Role chips | 全员、电教主任、德育主任、教研主任 are visible where expected |
| Enable state | State is visible and backed by the workbench settings API |
| Open `电教主任工作台` | Designer loads, not a failure page |
| Palette | At least 30 component templates |
| Third-party web | `第三方网页` can be added |
| URL field | Shows or accepts `https://demo.school.local/alarm-bi` |
| Presenter wording | Says `30+ 组件模板`, not `30 个独立渲染器` |

## Clause ♦1 Dashboard And App Gate

| Step | Expected |
| --- | --- |
| Open `/data-dashboards` | Six dashboards are visible |
| Default dashboards | 教育治理、教师发展、学生成长 are marked or identifiable |
| Third-party dashboards | `告警态势` and `应用使用` show `第三方嵌入` |
| Preview `告警态势` | URL `https://demo.school.local/alarm-bi` is visible |
| Preview metrics | `今日告警 8 / 未处理 4` is visible |
| Open `/applications` | Application center appears |
| Application totals | 应用总数 `8`, 网页端 `5`, 移动端 `3`, 已启用 `6` |
| Application management | Category, platform, URL/package identifier, visible scope, enable state, uninstall, and open actions are visible |

## Clause ♦15 Alarm Gate

| Step | Expected |
| --- | --- |
| Open `/alarms` | List shows device identifier, name, location, owner, trigger, status, report time |
| Filter once | Table responds to keyword or status filter |
| Open `HB-3F-021` | Detail drawer opens |
| Responsible person | Name and phone are visible |
| Recording | Play button toggles to pause and back |
| Disposal | Timeline or disposal record is visible |
| Status action | `标记为处理中` visibly updates or confirms state |
| Presenter wording | Say this is current-page state flow and record append; do not claim overview KPI/backend state synchronizes |

## Clause ♦27 Interactive Teaching Gate

| Step | Expected |
| --- | --- |
| Open `/teaching` | Dedicated interactive teaching page appears |
| Set 陈同学 as teacher | Member role visibly changes |
| Set 周老师 as student | Member role visibly changes |
| Share whiteboard | Stage or status visibly changes |
| Share desktop | Stage or status visibly changes |
| Screenshot insert | Screenshot evidence appears |
| Answer responder | Question/result panel appears |
| Layout `白板优先` | Stage layout visibly changes |
| Teacher focus | Teacher tile is enlarged or highlighted |
| Presenter wording | Says simulated control console, not real RTC or real remote desktop |

## Clause ♦29 Smart Blackboard Gate

| Step | Expected |
| --- | --- |
| Open `/blackboard` | Activity generation page appears |
| One-click parse | Produces 选词填空、判断对错、趣味选择 |
| Manual edit | Structured fields can be edited |
| Filler-word deletion | Filler words can be removed where visible |
| Complete activity | `完成制作` creates an activity record |
| Activity record reopen | `查看` restores the saved activity into the preview |
| Video tab | Shows `不接入真实视频处理` |
| Transcript preview | Shows transcript preview state |
| Video closure label | Shows `视频片段同步删除：暂未启用` |
| Presenter wording | Says video extraction/transcription/text-linked deletion are deferred |

## Forbidden Clicks During Formal Run

Do not click these visible controls unless implementation is later completed and re-tested:

- Top-bar search.
- Top-bar notification.
- 告警详情 `误报反馈`.

## Stop Conditions

Stop and fix before live use if any of these occur:

- A scripted sidebar route opens a placeholder page.
- Overview numbers drift away from current seed data.
- The workbench designer fails to load for `dashboard-electro`.
- The palette drops below 30 visible templates.
- The teaching page only changes text but not visible layout or tile state.
- The blackboard page implies real video segment deletion is enabled.
- Browser console shows repeated local application errors on the scripted path.

## Captured Fallback Assets

Fallback screenshots have been captured under:

`docs/superpowers/pm/screenshots/2026-07-03-final-rehearsal/`

Use `docs/superpowers/pm/fallback-assets.md` as the screenshot index.

Current captured set:

- `01-overview-readiness.png`
- `02-workbench-designer-web-embed.png`
- `03-data-dashboard-third-party-preview.png`
- `04-application-center.png`
- `05-alarm-detail-recording.png`
- `06-interactive-teaching.png`
- `06-interactive-teaching-stage.png`
- `06-interactive-teaching-controls.png`
- `07-blackboard-activity-parser.png`
- `08-blackboard-video-deferred.png`

These fallback assets are only backup evidence; the preferred flow remains a live guided browser demonstration.
