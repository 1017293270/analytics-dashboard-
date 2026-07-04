# Smart Education Demo Script

Date: 2026-07-03

## Demo Environment

- Frontend: `http://127.0.0.1:5174`
- API: `http://localhost:4000`
- Recommended browser width: desktop, 1280px or wider.
- Login account: `admin / Admin@123`
- Visible alarm and dashboard seed date: `2026-07-09`, aligned to the July 9 presentation.
- Demo position: this is a software-function demonstration. Interactive teaching, recording playback, and third-party embed loading are simulated demo states unless explicitly connected to a real service.

## Pre-Demo Checks

Run these checks before the formal rehearsal and again before the live presentation:

- Start API on port `4000` and frontend on port `5174`.
- Open the browser at desktop width, preferably 1280px or wider, with zoom at 90%-100%.
- Log in with `admin / Admin@123`.
- Confirm the sidebar only shows the eight demo routes: 首页总览、工作台配置、数据看板、应用中心、告警管理、智慧黑板、互动教学、账号与角色.
- Confirm `/overview` shows these aligned seed values:
  - 未处理告警: `4`; 演示样例今日口径: `8 条`.
  - 角色工作台: `4`; 已启用: `4 个`.
  - 演示应用: `8`; 网页端: `5`; 移动端: `3`; 已启用: `6 个`.
  - 数据看板服务: `2 个第三方嵌入看板接入`; metric: `可演示`.
- Do not demo `/settings` or any route outside the scripted path.
- Keep the speaking position consistent: this is a guided software-function demo, not a production deployment acceptance test.

## Opening

1. Open `/login`.
2. Log in as `admin / Admin@123`.
3. Land on `/overview`.
4. Point out the overview is only a launch and status page, then say: “先从首页总览进入现场演示路径，重点展示工作台配置、告警管理、互动教学和智慧黑板。”
5. Use the overview numbers only as current demo seed data:
   - “当前演示样例数据中，今日口径为 8 条告警、未处理 4 条。”
   - “4 个角色工作台都处于启用演示状态。”
   - “应用中心当前有 8 个演示应用，其中网页端 5 个、移动端 3 个。”

## Account And Role Checkpoint

Route: `/accounts`

1. Open `账号与角色`.
2. Show the five seeded demo accounts:
   - `admin` / 系统管理员
   - `all_staff` / 全员
   - `electro_director` / 电教主任
   - `moral_director` / 德育主任
   - `research_director` / 教研主任
3. Show the role preview selector.
4. Select `电教主任`.
5. Point out:
   - Visible menus include `应用中心` and `告警管理`.
   - Visible workbenches include `电教主任工作台`.
6. Toggle `research_director` to stopped, then click `重置演示状态`.
7. Say: “这里是演示级账号与角色管理，用于说明不同岗位账号会联动工作台、应用和告警入口可见范围；生产统一身份认证、组织同步和完整权限矩阵属于后续集成。”

## Clause ♦1 工作台配置

Route: `/workbenches`

1. Show the four default workbenches:
   - 全员工作台
   - 电教主任工作台
   - 德育主任工作台
   - 教研主任工作台
2. Point out role chips and enablement state.
3. Say: “这里预设了全员、电教主任、德育主任、教研主任四类工作台；启停状态为本机演示保存，角色可见性用于现场演示。”
4. Click `电教主任工作台`.
5. In the designer, show:
   - Drag-and-drop editing canvas.
   - 30+ configurable component templates in the palette.
   - Third-party web component named `第三方网页`.
6. Add `第三方网页`.
7. Open the property panel and show the URL field with `https://demo.school.local/alarm-bi`.
8. Fallback line if embed content does not load: “第三方网页受对方系统 X-Frame-Options/CSP 限制时可能只展示配置与占位；本系统已经完成链接配置和融合入口。”
9. Do not say “30 个完全独立渲染器”; say “30+ 组件模板” or “30+ 可配置组件入口”.

Route: `/data-dashboards`

1. Show the six managed dashboards and the three default dashboards:
   - 教育治理
   - 教师发展
   - 学生成长
2. Open `告警态势` preview.
3. Show third-party URL `https://demo.school.local/alarm-bi`.
4. Show the preview metrics:
   - 今日告警 `8`
   - 未处理 `4`
5. Say: “第三方看板在演示环境使用稳定预览框展示融合效果，生产环境按第三方页面安全策略加载。”

Route: `/applications`

1. Show application totals:
   - 应用总数 `8`
   - 网页端 `5`
   - 移动端 `3`
   - 已启用 `6`
2. Point out application category, platform, access URL/package identifier, visible scope, enable/disable, uninstall, and open actions.
3. Say: “这里覆盖网页端和移动端应用管理，包括分类、可见范围和启停状态。”

## Clause ♦15 告警管理

Route: `/alarms`

1. Show the alarm list columns:
   - 设备标识符
   - 设备名称
   - 发生位置
   - 通知人/责任人
   - 触发方式
   - 事件状态
   - 上报时间
2. Use keyword or status filter once.
3. Open alarm `HB-3F-021`.
4. In the detail drawer, show:
   - Responsible person and phone.
   - Event trigger recording.
   - Play/pause recording control and duration.
   - Disposal timeline.
5. Click `播放`, then click `标记为处理中`.
6. Say: “这里展示的是本页告警记录查看、处置状态流转和记录追加；首页 KPI 仍以演示种子数据为准。”

## Clause ♦27 互动教学

Route: `/teaching`

1. Show the dedicated 互动教学 page.
2. In the member list:
   - Click `设为授课老师` for 陈同学.
   - Click `设为学生` for 周老师.
3. Click `共享远程白板`.
4. Click `共享电脑桌面`.
5. Click `截屏插入`.
6. Click `答题器`.
7. Select `白板优先`.
8. Toggle `教师发言时放大显示`.
9. Say: “这里演示的是互动教学控制台的可操作状态，不接入真实 RTC 或远程桌面服务。”
10. Do not say the page performs real voice detection; the focus toggle is an operator-controlled demo state.

## Clause ♦29 智慧黑板

Route: `/blackboard`

1. Show classroom activity generation on the activity tab.
2. Paste or use existing text.
3. Switch through the three activity types and demonstrate one-click parsing:
   - 选词填空
   - 判断对错
   - 趣味选择
4. Demonstrate filler-word deletion if visible.
5. Click `完成制作`, then show the generated activity record and use `查看` to restore it into the preview.
6. Click the video/transcript tab and show:
   - `不接入真实视频处理`
   - `转写结果预览`
   - `视频片段同步删除：暂未启用`
7. Say clearly: “本次交付重点演示课堂活动智能填写和本页活动记录闭环；视频提取、语音转文字和按文字删除视频片段已暂缓，不在本轮现场闭环中。”

## Closing

1. Return to `/overview`.
2. Show demo launch items all pointing to real routes.
3. Say:
   - “工作台、告警、互动教学、智慧黑板活动生成都可现场点击演示。”
   - “生产级后台持久化、真实 RTC、真实视频处理属于后续增强，不影响本轮软件演示。”

## Fallback Plan

- If login state expires: return to `/login` and sign in again with `admin / Admin@123`.
- If an external embed cannot render: show the URL field and explain iframe restrictions.
- If browser zoom causes overflow: set zoom to 90% or use 1280px+ width.
- If a route appears stale during development: refresh the page once; both frontend and API dev servers should remain running.

## Do-Not-Say List

- Do not claim production backend persistence for workbench enable/disable.
- Do not claim backend ACL enforcement for direct workbench URLs.
- Do not claim “角色权限服务” means full production ACL; describe it as role menu and workbench visibility demo.
- Do not claim 30 independent renderer implementations; claim 30+ configurable component templates.
- Do not claim real RTC, real remote desktop, real whiteboard protocol, or automatic teacher voice detection.
- Do not claim real audio-stream playback unless a media backend is connected.
- Do not claim real video transcription or text-linked video segment deletion in this demo.
