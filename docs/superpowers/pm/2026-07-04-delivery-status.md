# July 9 Demo Delivery Status

Date: 2026-07-04

Purpose: lock the current requirement coverage, demo boundaries, and remaining gaps for the July 9 on-site software demonstration. This document is written from the project manager perspective: freeze scope, prevent over-claiming, and show how close the project is to a credible live demo.

## Executive Status

Overall decision: **ready for software-function demonstration, with video ASR/editing and production RTC clearly deferred**.

The current build covers the four tender-facing demo clauses with clickable routes:

- 智慧黑板 ♦29: classroom activity intelligent filling is demonstrable; video ASR/editing is visibly deferred.
- 交互智能平板 ♦27: role switching, simulated share states, screenshot insertion, answer responder, layout switching, and teacher focus are demonstrable; optional local WebSocket state sync exists behind `?room=`.
- 集控 ♦1: workbench configuration, 30+ component templates, role workbenches, data dashboards, third-party web component, and application center are demonstrable.
- 集控 ♦15: alarm list, filtering, detail drawer, responsible person phone, recording control, disposal records, and status flow are demonstrable.

The formal rehearsal gate is `npm run demo:rehearsal`; the latest verified run passed both 1366x768 and 1920x1080 projects after commit `3385313`.

## Verification Evidence

Latest passing commands from the current delivery slice:

| Gate | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Passed | TypeScript and Vue type checks passed. |
| `npm run test` | Passed | Shared, web, and API unit/integration suites passed. |
| `npm run build` | Passed | Existing Rollup pure-comment and chunk-size warnings only. |
| `npm run demo:rehearsal` | Passed | Desktop Chrome 1366x768 and Large Screen Chrome 1920x1080 passed. |
| Subagent final review | Passed | No Critical or Important findings after realtime teaching fixes. |

Current key commits:

| Commit | Scope |
| --- | --- |
| `3385313` | Interactive teaching local WebSocket state sync and honest copy. |
| `2eb7604` | Smart blackboard activity completion record loop. |
| `3d9d3ec` | Management pages connected to APIs. |
| `7b00e01` | Management module APIs. |
| `ef1f5f7` | Demo account reset flow. |
| `08778e2` | Accounts page connected to API. |

## Requirement Coverage Matrix

| Tender Clause | Requirement Item | Current Demo Coverage | Status | Route / Evidence |
| --- | --- | --- | --- | --- |
| 智慧黑板 ♦29 | 提取视频声音并转换成文字 | Video tab shows transcript preview/deferred state, not real media extraction. | **Deferred** | `/blackboard`, `不接入真实视频处理` |
| 智慧黑板 ♦29 | 自动识别语气词，可选择删除 | Text activity parser supports filler-word removal for input text. | **Demo Ready** | `/blackboard`, filler-word parse gate |
| 智慧黑板 ♦29 | 手动删除文字后自动删除对应视频片段 | Explicitly not enabled this round. | **Deferred** | `/blackboard`, `视频片段同步删除：暂未启用` |
| 智慧黑板 ♦29 | 选词填空、判断对错、趣味选择 | Three activity types can be selected and parsed. | **Demo Ready** | `/blackboard` |
| 智慧黑板 ♦29 | 输入文本一键解析并结构化填充 | Parses source text into stem/options/correct answer, then editable preview. | **Demo Ready** | `/blackboard` |
| 智慧黑板 ♦29 | 完成课堂活动制作 | `完成制作` creates an activity record; `查看` restores saved state. | **Demo Ready** | `/blackboard`, e2e gate |
| 交互智能平板 ♦27 | 设置成员为授课老师/学生 | Member role buttons update the member list. | **Demo Ready** | `/teaching` |
| 交互智能平板 ♦27 | 共享远程白板/电脑桌面 | Implemented as honest simulated share states, not real remote media. | **Demo Ready with Scope Note** | `/teaching`, `模拟白板共享`, `桌面状态共享` |
| 交互智能平板 ♦27 | 截屏插入 | Creates screenshot record in the current demo session. | **Demo Ready** | `/teaching` |
| 交互智能平板 ♦27 | 答题器 | Launches responder and displays answer counts/names. | **Demo Ready** | `/teaching` |
| 交互智能平板 ♦27 | 更改直播画面布局 | Layout controls update stage class and visible layout. | **Demo Ready** | `/teaching` |
| 交互智能平板 ♦27 | 教师发言放大显示，可取消 | Operator-controlled focus toggle enlarges/highlights teacher tile. | **Demo Ready** | `/teaching` |
| 交互智能平板 ♦27 | 实时互动教学 | Optional local WebSocket room state sync behind `?room=demo`; not RTC/WebRTC. | **Optional Dev Check** | `/teaching?room=demo&persona=teacher` |
| 集控 ♦1 | 拖拉拽配置工作台 | Existing big-screen designer supports drag/drop editing. | **Demo Ready** | `/workbenches/dashboard-electro` |
| 集控 ♦1 | 可配置组件数量 ≥30 | Palette gate asserts at least 30 addable component templates. | **Demo Ready** | `/workbenches/dashboard-electro` |
| 集控 ♦1 | 不同角色看到对应工作台 | Four role workbenches and account-role preview are visible. | **Demo Ready** | `/accounts`, `/workbenches` |
| 集控 ♦1 | 默认全员、电教主任、德育主任、教研主任工作台 | Four default workbenches are seeded and visible. | **Demo Ready** | `/workbenches` |
| 集控 ♦1 | 工作台启用/停用管理 | Workbench availability is API-backed and visible in list. | **Demo Ready** | `/workbenches` |
| 集控 ♦1 | 自定义不少于 6 个数据看板 | Six managed dashboards are seeded. | **Demo Ready** | `/data-dashboards` |
| 集控 ♦1 | 默认教育治理、教师发展、学生成长看板 | Three default dashboards are visible. | **Demo Ready** | `/data-dashboards` |
| 集控 ♦1 | 嵌入第三方数据看板 | Third-party web component and dashboard preview show URL/fallback metrics. | **Demo Ready** | `/workbenches`, `/data-dashboards` |
| 集控 ♦1 | 应用中心网页端/移动端应用管理 | Application totals, platform, category, visible scope, enable/uninstall controls are visible. | **Demo Ready** | `/applications` |
| 集控 ♦15 | 告警列表字段完整 | Identifier, name, location, owner, trigger, status, report time are visible. | **Demo Ready** | `/alarms` |
| 集控 ♦15 | 时间、设备、位置、状态筛选查询 | Keyword/status/time filters are implemented for demo list. | **Demo Ready** | `/alarms` |
| 集控 ♦15 | 告警详情 | Detail drawer shows responsible person and phone. | **Demo Ready** | `/alarms` |
| 集控 ♦15 | 事件触发录音 | Recording track and play/pause control are visible demo states. | **Demo Ready with Scope Note** | `/alarms` |
| 集控 ♦15 | 事件处置记录 | Disposal timeline and status action are visible. | **Demo Ready** | `/alarms` |

## Demo Boundaries

These boundaries must be spoken consistently:

- This is a **software-function demonstration**, not production deployment acceptance.
- Video extraction, real ASR, and text-linked video segment deletion are **not in this round**.
- Interactive teaching uses simulated control states; `?room=` enables **local WebSocket state sync only**, not real RTC/WebRTC media or remote desktop.
- Account-role management demonstrates role visibility and demo account operations; it is not SSO, MFA, organization sync, or a production IAM matrix.
- Third-party dashboard embed may show stable preview/fallback if the third-party page blocks iframe loading.
- Recording playback in alarm detail is a visible demo control, not live hardware audio ingestion.

## Remaining Gaps

| Priority | Gap | Why It Matters | Recommendation |
| --- | --- | --- | --- |
| P0 | Manual rehearsal and screenshot refresh | Latest UI copy changed from remote wording to simulated wording; fallback screenshots may be stale. | Capture fresh fallback screenshots after one manual walkthrough. |
| P1 | Real video ASR/editing | Tender asks for extraction/transcription/text-linked clipping; current page clearly defers it. | Only build if time remains and dependencies are controlled; otherwise keep deferred wording. |
| P2 | Native RTC/WebRTC media | Tender asks interactive teaching; current implementation is control-state demo plus optional local state sync. | Do not attempt LiveKit/SFU/TURN before July 9; optional local WebRTC only if it does not threaten gates. |
| P2 | Production IAM/tenant ACL | Current account-role demo is enough for visible scope, but not a production identity system. | Keep as post-demo enhancement unless evaluator demands deeper backend proof. |

## Formal Run Order

Use this exact path:

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

## Stop Conditions

Stop and fix before live use if:

- `npm run demo:rehearsal` fails.
- Any scripted route opens a placeholder or error page.
- `/teaching` visible copy drifts back to claiming real remote desktop/RTC.
- `/blackboard` copy implies video segment deletion is enabled.
- Overview metrics drift from the scripted seed values.
- Workbench designer opens with fewer than 30 visible component entries.

## PM Call

The current product is close enough for a July 9 software demonstration. The strongest next action is not new scope; it is a human rehearsal plus fresh screenshots after the latest interaction-teaching copy change.
