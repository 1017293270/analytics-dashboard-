# Demo Fallback Assets

Date: 2026-07-03

Purpose: backup visual evidence for the July 9 on-site demonstration. Use these images only if the live browser environment is unstable. The preferred delivery remains the guided live demo on `http://127.0.0.1:5174`.

## Asset Directory

`docs/superpowers/pm/screenshots/2026-07-03-final-rehearsal/`

## Latest Final Audit

Latest browser-verified evidence was refreshed after the July 4 PM closeout:

`docs/superpowers/pm/screenshots/2026-07-04-final-audit/`

This audit logs in as `admin / Admin@123`, walks the scripted business pages, captures nine screenshots, and writes `visual-audit.json`. The JSON recorded zero local page or console errors and zero page-level horizontal overflow at the time it was captured.

Important status: the interactive teaching wording changed after these screenshots were captured. Treat `06-interactive-teaching*.png` as stale backup evidence until refreshed; prefer the live `/teaching` route for Clause ♦27.

## Screenshot Index

| File | Demo point | Use when |
| --- | --- | --- |
| `01-overview-readiness.png` | Overview KPIs, sidebar route set, workbench/app/alarm/dashboard readiness | Opening summary or proving seed numbers |
| `02-workbench-designer-web-embed.png` | Workbench designer, 30+ palette, selected third-party webpage component, URL property panel | Clause ♦1 workbench configuration |
| `03-data-dashboard-third-party-preview.png` | Six dashboards and `告警态势` third-party preview metrics | Clause ♦1 data-dashboard embedding |
| `04-application-center.png` | Web/mobile application management, categories, visibility, enable state, actions | Clause ♦1 application center |
| `05-alarm-detail-recording.png` | Alarm detail drawer, responsible person, phone, recording control, disposal records | Clause ♦15 alarm detail |
| `06-interactive-teaching-stage.png` | Stale backup image from before the current simulated-share wording | Refresh before using for Clause ♦27 |
| `06-interactive-teaching-controls.png` | Share controls, screenshot insert, answer responder, teacher-focus switch | Clause ♦27 control proof |
| `06-interactive-teaching.png` | Stale backup image from before the current simulated-share wording | Refresh before using for Clause ♦27 |
| `07-blackboard-activity-parser.png` | Classroom activity one-click parse, structured stem/options/correct answer | Clause ♦29 activity generation |
| `08-blackboard-video-deferred.png` | Video transcription tab with deferred video-closure wording | Clause ♦29 deferred video boundary |

## Presenter Notes

- Start with live demo. Switch to these images only if the browser, network, projector, or dev server blocks a route.
- Say these are screenshots from the verified July 3 final rehearsal state.
- Do not use `08-blackboard-video-deferred.png` to imply real video extraction, real transcription, or transcript-linked segment deletion is enabled.
- Do not use the stale interactive teaching images unless refreshed; their old wording must not be used to imply real RTC, real remote desktop, teacher audio detection, or real remote whiteboard protocol.
- For workbench compliance, say `30+ 组件模板` or `可配置组件入口`, not `30 个独立渲染器`.

## Coverage Map

| Tender clause | Live route | Backup files |
| --- | --- | --- |
| 集控 ♦1 工作台配置 | `/workbenches`, `/workbenches/dashboard-electro` | `02-workbench-designer-web-embed.png` |
| 集控 ♦1 数据看板 | `/data-dashboards` | `03-data-dashboard-third-party-preview.png` |
| 集控 ♦1 应用中心 | `/applications` | `04-application-center.png` |
| 集控 ♦15 告警管理 | `/alarms` | `05-alarm-detail-recording.png` |
| 交互智能平板 ♦27 | `/teaching` | `06-interactive-teaching-stage.png`, `06-interactive-teaching-controls.png` |
| 智慧黑板 ♦29 | `/blackboard` | `07-blackboard-activity-parser.png`, `08-blackboard-video-deferred.png` |

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
