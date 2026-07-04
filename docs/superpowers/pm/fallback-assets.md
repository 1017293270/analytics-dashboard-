# Demo Fallback Assets

Date: 2026-07-04

Purpose: backup visual evidence for the July 9 on-site demonstration. Use these images only if the live browser environment is unstable. The preferred delivery remains the guided live demo on `http://127.0.0.1:5174`.

## Current Asset Directory

`docs/superpowers/pm/screenshots/2026-07-04-final-walkthrough/`

## Latest Walkthrough Evidence

Latest browser-verified evidence was refreshed during the July 4 final walkthrough:

`docs/superpowers/pm/screenshots/2026-07-04-final-walkthrough/`

This walkthrough logs in as `admin / Admin@123`, walks the scripted business pages, captures ten screenshots, and writes `visual-audit.json`. The JSON recorded zero local page errors, zero local console errors, and zero page-level horizontal overflow at the time it was captured.

Historical screenshots remain under `2026-07-03-final-rehearsal/` and `2026-07-04-final-audit/`, but use the current directory first because it reflects the latest simulated-share wording on `/teaching`.

## Screenshot Index

| File | Demo point | Use when |
| --- | --- | --- |
| `01-overview-readiness.png` | Overview KPIs, sidebar route set, workbench/app/alarm/dashboard readiness | Opening summary or proving seed numbers |
| `02-accounts-role-scope.png` | Account-role page, role visibility preview, visible workbench scope | Account system and role visibility proof |
| `03-workbench-list.png` | Four role workbenches and availability management | Clause ♦1 role workbench proof |
| `04-workbench-designer-web-embed.png` | Workbench designer, 30+ palette, selected third-party webpage component, URL property panel | Clause ♦1 workbench configuration |
| `05-data-dashboard-third-party-preview.png` | Six dashboards and `告警态势` third-party preview metrics | Clause ♦1 data-dashboard embedding |
| `06-application-center.png` | Web/mobile application management, categories, visibility, enable state, actions | Clause ♦1 application center |
| `07-alarm-detail-recording.png` | Alarm detail drawer, responsible person, phone, recording control, disposal records | Clause ♦15 alarm detail |
| `08-interactive-teaching-simulation.png` | Simulated whiteboard/desktop share states, screenshot insert, answer responder, layout, teacher focus | Clause ♦27 control proof |
| `09-blackboard-activity-parser.png` | Classroom activity one-click parse, structured stem/options/correct answer, completion record | Clause ♦29 activity generation |
| `10-blackboard-video-deferred.png` | Video transcription tab with deferred video-closure wording | Clause ♦29 deferred video boundary |

## Presenter Notes

- Start with live demo. Switch to these images only if the browser, network, projector, or dev server blocks a route.
- Say these are screenshots from the verified July 4 final walkthrough state.
- Do not use `10-blackboard-video-deferred.png` to imply real video extraction, real transcription, or transcript-linked segment deletion is enabled.
- Use `08-interactive-teaching-simulation.png` for Clause ♦27 fallback evidence; it reflects simulated control states, not real RTC, real remote desktop, teacher audio detection, or real remote whiteboard protocol.
- For workbench compliance, say `30+ 组件模板` or `可配置组件入口`, not `30 个独立渲染器`.

## Coverage Map

| Tender clause | Live route | Backup files |
| --- | --- | --- |
| 账号与角色 | `/accounts` | `02-accounts-role-scope.png` |
| 集控 ♦1 工作台配置 | `/workbenches`, `/workbenches/dashboard-electro` | `03-workbench-list.png`, `04-workbench-designer-web-embed.png` |
| 集控 ♦1 数据看板 | `/data-dashboards` | `05-data-dashboard-third-party-preview.png` |
| 集控 ♦1 应用中心 | `/applications` | `06-application-center.png` |
| 集控 ♦15 告警管理 | `/alarms` | `07-alarm-detail-recording.png` |
| 交互智能平板 ♦27 | `/teaching` | `08-interactive-teaching-simulation.png` |
| 智慧黑板 ♦29 | `/blackboard` | `09-blackboard-activity-parser.png`, `10-blackboard-video-deferred.png` |

## Refresh Rule

Refresh this asset set if any of these change before July 9:

- Sidebar route list.
- Overview seed KPIs.
- Workbench palette or third-party webpage property panel.
- Data-dashboard metrics.
- Application totals.
- Alarm seed dates or device IDs.
- Interactive teaching layout/control wording.
- Smart blackboard video-deferred wording.
