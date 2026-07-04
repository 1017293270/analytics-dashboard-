# Smart Education Demo Delivery Priority And Governance

Date: 2026-07-03

## Summary

This document is the delivery governance layer for the smart education demo platform. It does not replace the platform design, UI guidelines, or feature plans already in `docs/superpowers/specs/` and `docs/superpowers/plans/`. It defines the current priority order, the demo-readiness standard, and the project-management role that should continuously audit whether implementation is drifting away from the tender demonstration target.

The confirmed product decision is:

- Video transcription and transcript-to-video-segment deletion remain deferred.
- The project now prioritizes all remaining tender-demo items that can materially improve on-site demonstration readiness.
- Future work should be judged by tender alignment, visible demo completeness, test confidence, and UI consistency, not by raw feature volume.

## Source Requirements

The current delivery scope comes from the tender excerpts verified in the document named `理塘县2026年中小学（幼儿园）一体机采购项目招标文件（N513334202600006020260617001）.docx` and the user's confirmed prioritization.

The active software demonstration requirements are:

1. 智慧黑板 ♦29
   - Keep classroom activity intelligent filling demo-ready.
   - Keep video transcription visible only as a deferred capability.
   - Do not spend near-term effort on real video extraction, speech recognition, or transcript-linked video segment deletion.
2. 交互智能平板 ♦27
   - Implement the interactive teaching console because the current `/teaching` route is still a placeholder.
   - Demonstrate member role assignment, remote whiteboard sharing, desktop sharing, screenshot insert, answer responder, layout switching, and teacher-speaking focus.
3. 集控控制管理系统 ♦1
   - Complete the workbench configuration compliance surface.
   - Make the existing drag-and-drop designer convincingly satisfy role workbenches, enable/disable management, at least 30 configurable component entries, and third-party web embed.
   - Keep data dashboard and application center management demo-ready.
4. 集控控制管理系统 ♦15
   - Keep alarm management table, filters, detail drawer, responsible-person details, recording placeholder, and disposal records demo-ready.
   - Improve the recording UI enough that it reads as an intentional audio-player demonstration rather than an unfinished placeholder.

## Project Manager Role

For the rest of this project, the assistant should act as a project manager in addition to being an implementation agent.

The project-manager responsibilities are:

1. Maintain the delivery priority order.
2. Review each proposed or completed change against the tender requirements.
3. Identify whether the project is drifting into low-demo-value work.
4. Track how far the platform is from a credible on-site software demonstration.
5. Require UI consistency with `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md`.
6. Keep implementation slices small enough for subagent execution and review.
7. Separate demo simulation from real production capability in all user-facing copy and final reports.
8. Keep the current deferred-video decision visible so it is not accidentally pulled back into P0 or P1 work.

The project manager should give status in this shape when asked for progress:

- Overall readiness percentage.
- Green/yellow/red module status.
- Largest current demo risk.
- Work completed since last checkpoint.
- Work needed before the next credible demo.
- Any drift from tender wording or from the agreed video-deferred route.

## Delivery Principles

### Tender Alignment First

Every feature must tie back to one of the active tender demonstration clauses or to the shell, account, or UI foundation needed to demonstrate those clauses.

Changes are considered drift when they:

- Build a generic admin feature that is not needed for the tender demo.
- Deepen backend persistence when a deterministic demo state is enough.
- Add production integrations for video, RTC, hardware, or AI when the agreed scope is simulated or frontend-first.
- Polish unrelated screens while `/teaching` remains unimplemented.
- Mark a module as `可演示` without a route, component test, and manual demo path.

### Demo Closure Over Production Depth

Phase-one delivery is an on-site software demonstration. A feature is acceptable when the evaluator can see the required action, understand the state change, and complete the expected flow without a live external system.

Simulation is acceptable for:

- Interactive teaching session state.
- Remote whiteboard and desktop share status.
- Screenshot insert history.
- Answer responder statistics.
- Alarm recording placeholder.
- Third-party dashboard preview fallback.

Simulation is not acceptable when the tender wording can be satisfied cheaply through current UI:

- Workbench component count.
- Role workbench visibility.
- Workbench enable/disable state.
- Application add/uninstall/category/visibility.
- Alarm filtering and detail fields.

### UI Consistency As A Gate

All new pages must follow the smart education UI guidelines:

- Element Plus controls for forms, tables, drawers, dialogs, tags, and filters.
- Compact management-product layout.
- No marketing hero.
- No decorative gradient orbs.
- No nested cards.
- 8px radius or less.
- Role chips, status chips, and table-first workflows.
- Stable responsive behavior at desktop and narrow widths.

### Tests And Browser Verification

Each priority slice must finish with:

- Unit or component tests for deterministic state.
- Router or smoke tests for route replacement when applicable.
- `npm run test`.
- `npm run lint`.
- `npm run build`.
- Browser verification on the route being claimed as demo-ready.

## Priority Order

### P0: Workbench Compliance

P0 is the highest priority because it is the strongest direct gap in 集控控制管理系统 ♦1 while also reusing the existing big-screen designer asset.

Current status:

- `/workbenches` and `/workbenches/:id` exist.
- Drag-and-drop designer exists.
- Existing component registry exposes about 11 component types.
- Role workbench rows appear in overview data, but workbench list/editor metadata does not yet fully implement the tender role and enable/disable model.
- A true custom web component is not yet present in the designer component registry.

P0 must deliver:

- At least 30 visible configurable component entries in the workbench palette.
- Component entries may reuse renderer families, but each visible entry must have a meaningful title, default layout, default props, and demo purpose.
- Third-party web embed component with URL and title settings.
- Workbench metadata for visible roles and enable/disable state.
- Default workbench presets:
  - 全员工作台
  - 电教主任工作台
  - 德育主任工作台
  - 教研主任工作台
- Role visibility filtering so role-matched users see the matching workbench and do not see disabled workbenches.
- Clear distinction between draft/published lifecycle and enabled/disabled availability.

P0 demo pass criteria:

- Evaluator opens 工作台配置.
- Evaluator can see at least 30 component entries or templates in the palette.
- Evaluator can add a third-party web component and enter a URL.
- Evaluator can edit role visibility for a workbench.
- Evaluator can enable or disable a workbench.
- Switching or selecting a role shows the corresponding workbench availability.

### P1: Interactive Teaching Console

P1 is second because 交互智能平板 ♦27 is currently the largest missing module. The `/teaching` route exists but points to the overview placeholder.

Current status:

- Navigation includes 互动教学.
- `/teaching` route exists.
- Dedicated interactive teaching feature files do not exist.

P1 must deliver:

- Dedicated `/teaching` page.
- Seeded teaching session data.
- Member list with identities:
  - 主讲人
  - 授课老师
  - 学生
- Actions to set any eligible member as 授课老师 or 学生.
- Remote whiteboard share toggle.
- Desktop share toggle.
- Screenshot insert action with visible inserted screenshot record.
- Answer responder flow with question launch, student answers, and result statistics.
- Live layout selection:
  - 宫格
  - 主讲
  - 桌面优先
  - 白板优先
- Teacher-speaking focus toggle that visibly enlarges or highlights the active teacher area.

P1 demo pass criteria:

- Evaluator opens 互动教学.
- Evaluator changes a member role.
- Evaluator starts remote whiteboard sharing.
- Evaluator starts desktop sharing.
- Evaluator inserts a screenshot into the session.
- Evaluator launches an answer responder question and sees answer statistics.
- Evaluator changes live layout and sees the stage update.
- Evaluator toggles teacher-speaking focus and sees the teacher area enlarge or become primary.

### P2: Demo Hardening And Readiness Controls

P2 consolidates already-built modules and makes the demo safer.

Current status:

- `/data-dashboards` is implemented.
- `/applications` is implemented.
- `/alarms` is implemented.
- `/blackboard` is implemented for text-based activity generation.
- `/overview` shows demo launch items and readiness data, but readiness should become a stronger project-management surface after P0/P1.

P2 must deliver:

- Alarm recording UI that looks like a stable audio-player placeholder.
- A demo checklist or readiness panel on `/overview`.
- Explicit statuses for each tender clause:
  - ♦1 工作台配置
  - ♦15 告警管理
  - ♦27 互动教学
  - ♦29 智慧黑板
- Fast route launch links for every demo module.
- Manual demo script in docs.
- Browser verification notes for the main demo routes.

P2 demo pass criteria:

- Evaluator can start at 首页总览 and follow the demo checklist.
- Each route opens without placeholder content except intentionally deferred video functionality.
- Alarm details show responsible person, phone, recording, and disposal timeline clearly.
- Existing data dashboard and app center flows remain intact after P0/P1 changes.

### P3: Video Transcription And Segment Deletion

P3 is intentionally deferred.

Current status:

- 智慧黑板 supports classroom activity authoring.
- Video transcription tab exists as a placeholder.
- Transcript-to-video segment deletion is explicitly not enabled.

P3 is not required before the next credible demo unless the evaluator demands the exact video deletion clause in the live demonstration.

If P3 becomes active later, the recommended first slice is a demo simulation:

- Upload or select demo video.
- Show timestamped transcript.
- Mark filler words.
- Delete transcript line.
- Remove matching timeline segment visually.
- Keep generated activity parsing connected to transcript text.

Real speech recognition, FFmpeg extraction, and destructive video editing should remain outside the immediate P3 simulation unless the project receives a production requirement.

## Readiness Scoring

Use this scoring model for project-management updates.

Overall readiness is the weighted sum:

- P0 Workbench compliance: 35%
- P1 Interactive teaching: 30%
- P2 Demo hardening: 20%
- Existing completed modules: 15%

Suggested current baseline after the latest audit:

- P0 Workbench compliance: 40% complete.
- P1 Interactive teaching: 10% complete.
- P2 Demo hardening: 45% complete.
- Existing completed modules: 80% complete.
- Overall readiness: about 42%.

Readiness labels:

- Green: can be demonstrated live with tests and browser QA.
- Yellow: visible UI exists but has missing tender details, weak demo flow, or incomplete QA.
- Red: route is placeholder, core requirement is absent, or UI claim is misleading.

## Definition Of Demo Ready

A module can be called `可演示` only when all of these are true:

1. It has a dedicated route or a clearly reachable route section.
2. The route does not point to an unrelated placeholder page.
3. The main tender actions can be performed by clicking UI controls.
4. The UI state visibly changes after each action.
5. Empty, disabled, and error states look intentional.
6. Tests cover core state logic.
7. The route passes manual browser verification.
8. The overview readiness surface reflects the real state.
9. Deferred items are labeled honestly and do not block the main flow.

## PM Review Checklist

Use this checklist after every implementation batch:

- Does the change advance P0, P1, or P2?
- Which tender clause does the change support?
- Did any route remain a placeholder while being marked `可演示`?
- Did the change introduce UI that violates the smart education guidelines?
- Did the change add production depth where simulation was enough?
- Did tests run and pass?
- Did browser verification cover the affected route?
- Did overview readiness data change, and is that change honest?
- Is video work still deferred unless explicitly re-prioritized?
- What is the new estimated demo readiness percentage?

## Escalation Rules

Escalate to the user when:

- A requested feature conflicts with the video-deferred decision.
- A task would expand into real RTC, real video editing, live device control, or production AI.
- A subagent proposes a feature not tied to P0, P1, P2, or the tender demo.
- The project is close to marking a module `可演示` without browser QA.
- The implementation discovers that existing API or schema design makes P0 role visibility more expensive than expected.

## Next Development Recommendation

The next implementation batch should be P0: Workbench Compliance.

Reason:

- It directly supports 集控控制管理系统 ♦1.
- It reuses existing code, so it should convert effort into visible demo progress quickly.
- It also fixes the mismatch between current overview claims and actual workbench designer capabilities.

After P0, move immediately to P1: Interactive Teaching Console.

P2 should run after P0/P1, or as short hardening tasks between them when a subagent is free.
