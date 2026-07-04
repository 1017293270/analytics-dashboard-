# 翡翠学府 · UI 设计系统规范

Version: 2026-07-03

本文档是智慧教育集控平台（Smart Education Console）的前端 UI 设计系统规范，是 `DESIGN.md` 产品方向的视觉落地。所有新增页面、组件、样式都必须遵循本规范。Token 的唯一事实来源是 `apps/web/src/styles/tokens.css`，本文档与之同步。

## 0. 设计理念

**翡翠学府 Emerald Academy** —— 精致浅色内容区 + 翡翠绿/青品牌色 + 深色墨绿侧边栏。

参考 Linear / Stripe / Vercel 的精致留白与克制层级。这不是默认 Element Plus 的"安全蓝"——它有一个清晰的视觉观点：

- **签名对比**：深墨绿侧边栏 × 暖白内容区，是高端后台的通用范式，赋予平台辨识度。
- **克制而非花哨**：用留白、层级、字重、品牌色点睛建立秩序，不用渐变堆叠或装饰性元素。
- **数据优先**：一切服务于可读性。表格、KPI、状态语义永远清晰可辨。

一个铁律：**选一个方向，干净地执行它**。不要把翡翠色和旧蓝色混用，不要在浅色内容区塞深色块，不要用装饰性动画分散对数据的注意力。

## 1. 色彩系统

### 1.1 品牌（翡翠）

| Token | 值 | 用途 |
|---|---|---|
| `--color-accent` | `#059669` (emerald-600) | 主品牌色，按钮/链接/选中态 |
| `--color-accent-strong` | `#047857` (emerald-700) | hover/active 加深 |
| `--color-accent-cyan` | `#0891B2` (cyan-600) | 辉光、渐变第二色 |
| `--color-accent-soft` | `#d1fae5` (emerald-100) | 柔底填充 |
| `--color-accent-50…900` | emerald 完整阶 | Element Plus 主色阶映射 |

**完整主色阶必须全部覆盖**（`--el-color-primary-light-1..9` + `dark-2`）。早期只映射了 `light-9`，导致 hover/active 状态泛蓝——这是已被修复的 bug，新增主题色时不要重蹈。

### 1.2 表面（暖中性，非冷蓝）

| Token | 值 | 用途 |
|---|---|---|
| `--color-page` | `#F5F8F6` | 页面底，暖白微绿 |
| `--color-panel` | `#FFFFFF` | 卡片/面板 |
| `--color-panel-muted` | `#F3F7F5` | 弱底（表头、summary 卡） |
| `--color-panel-sunken` | `#EEF3F0` | 更深一层（表格 hover 行） |

### 1.3 文字

| Token | 值 | 用途 |
|---|---|---|
| `--color-text` | `#0F1B16` | 正文，绿调墨黑 |
| `--color-text-strong` | `#06120D` | 强调（KPI 数值） |
| `--color-text-muted` | `#5B6B66` | 次要文字、label |
| `--color-text-faint` | `#8A988F` | 占位符、禁用 |
| `--color-text-on-accent` | `#FFFFFF` | 品牌色上的文字 |

### 1.4 侧边栏签名面（深墨绿）

| Token | 值 | 用途 |
|---|---|---|
| `--color-sidebar` | `#0E1A14` | 侧边栏底，深墨绿 |
| `--color-sidebar-soft` | `#142621` | 子面板、暗预览块 |
| `--color-sidebar-hover` | `rgba(255,255,255,0.06)` | 导航 hover |
| `--color-sidebar-active` | `rgba(16,185,129,0.16)` | 导航选中 |
| `--color-sidebar-text` | `#AEBCB3` | 侧边栏正文 |
| `--color-sidebar-text-strong` | `#FFFFFF` | 选中/标题 |
| `--color-sidebar-text-muted` | `#6F8079` | 分组标题 |

### 1.5 语义状态色（统一映射）

| 状态 | 主色 | 柔底 | 含义 |
|---|---|---|---|
| success | `--color-success` `#10B981` | `--color-success-soft` `#D1FAE5` | 健康/已启用/已处理/已配置 |
| warning | `--color-warning` `#F59E0B` | `--color-warning-soft` `#FEF3C7` | 处理中/草稿/延迟 |
| danger | `--color-danger` `#DC2626` | `--color-danger-soft` `#FEE2E2` | 未处理/已停用/归档/错误 |
| info | `--color-info` `#0891B2` | `--color-info-soft` `#CFFAFE` | 待接入/低优先级 |

**业务状态映射已固化**，不要为单个页面另造映射：

- 告警：未处理→danger，处理中→warning，已处理→success
- 工作台：已启用→success，草稿/已停用→warning/danger
- 看板：已配置→success，待接入→info
- 演示准备：已完成→success，可演示→primary，下一阶段→info

### 1.6 色彩使用铁律

- **禁止硬编码 hex**。组件 CSS 里只能用 token；Element Plus 组件用 `--el-*`（已映射到 token）。
- **禁止旧蓝色残留**：`#2563eb`、`#dbeafe`、`#eff6ff`、`rgba(37,99,235,...)`、`rgba(15,23,42,...)`（旧暗底）一律不允许新增。
- 一个 dominant field + 选择性点睛，不要彩虹色平铺。

## 2. 排版

字体栈：`--font-sans` = `Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`

| Token | 字号 | 字重 | 用途 |
|---|---|---|---|
| `--fs-display` | 28px | 900 (`--fw-black`) | 页面 H1 |
| `--fs-title` | 16px | 800/900 | 面板标题 |
| `--fs-stat` | 32px | 900 | KPI 主数值 |
| `--fs-stat-sm` | 26px | 900 | summary 数值 |
| `--fs-body` | 14px | 400 | 正文 |
| `--fs-subtitle` | 13px | 400 | 副标题、表格 |
| `--fs-label` | 12px | 700 | label、表头、chip |

**等宽数字**：所有数值（KPI、表格数字、metric）必须带 `font-feature-settings: var(--num-feature)`（`'tnum' 1`），让数字对齐、更精致。

字距：标题用 `--tracking-tight`（-0.01em）收紧；全大写 label 用 `--tracking-label`（0.06em）。

## 3. 间距

刻度（正式化）：`--space-1..8` = `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40` px。

- 页面内容 padding：`--space-page-y`(22) × `--space-page`(20)
- 面板内 padding：`--space-panel`(16)
- 卡片之间 gap：多用 `--space-3`(12) 或 `--space-4`(16)
- 组件内紧凑 gap：`--space-2`(8)

不要用 10/14/18/22 这类未 token 化的零散值（历史代码里的残留，新代码不要新增）。

## 4. 圆角

| Token | 值 | 用途 |
|---|---|---|
| `--radius-sm` | 6px | tag、小按钮、输入 |
| `--radius-md` | 10px | 按钮、输入、预览块 |
| `--radius-lg` / `--radius-panel` | 14px | 面板/卡片 |
| `--radius-pill` | 999px | chip、状态药丸、头像 |

**面板统一 14px**，不要再用 8px（旧默认）。

## 5. 阴影（分层柔化，绿调）

| Token | 用途 |
|---|---|
| `--shadow-xs` | 极轻（分段控件选中） |
| `--shadow-sm` | 卡片默认 |
| `--shadow-md` | 卡片 hover |
| `--shadow-panel` | 面板/大卡片 |
| `--shadow-lift` | 品牌辉光，hover 抬升（绿调） |
| `--shadow-glow` | 输入聚焦光环 |

不用单层过重阴影（旧的 `0 18px 45px` 已废弃）。

## 6. 动效

L1 克制（沿用 `DESIGN.md`）：

- `--motion-fast` 120ms：hover/focus
- `--motion-base` 180ms：卡片抬升、位移
- `--motion-medium` 250ms：面板切换
- 缓动统一用 `--ease-out` / `--ease-enter`，**不要**用 `--ease-spring`（弹性，仅极少签名场景）

允许：卡片 hover 微抬升（`translateY(-2px)` + lift 阴影）、侧边栏选中条平滑过渡、页面进入一次淡入、状态点脉冲。

禁止：布局位移动画、循环装饰动画、密集微交互。**所有循环/闪烁动画必须 `prefers-reduced-motion` 兜底**。

## 7. 布局规范

### 7.1 应用外壳

- 侧边栏固定宽 `--sidebar-width`(248)，深墨绿签名面。
- 顶栏高 `--topbar-height`(64)，白底 + 底边。
- 内容区 `max-width: --content-max`(1680) 居中，padding `--space-page-y/x`。
- full-bleed 路由（设计器）用 `.app-shell__main--full-bleed`，去掉 padding 占满。

### 7.2 侧边栏导航

- 按「概览/运营/教学/系统」分组，组标题用 `--color-sidebar-text-muted`、10px、大写、letter-spacing。
- 选中项：翡翠半透明药丸背景 + 左侧 3px 翡翠强调条（带辉光）。
- 非选中：hover 提亮文字 + 半透明白底。

### 7.3 页面通用骨架

```
<header>  eyebrow tags + H1 + 副标题 …… 右侧操作按钮
<KPI/summary 卡>  4 列栅格
<主面板>  过滤条 + 表格 / 内容
```

## 8. 核心组件规格

### 8.1 KPI 卡（签名组件）

- 顶部 3px 状态色强调条（按 status 着色）
- label（12px/700/muted）+ 趋势 chip（药丸，语义色）
- 主数值 32px/900 + 等宽数字
- 底部分割线 + 二级指标行（label + value）
- hover：`translateY(-2px)` + `--shadow-md`

### 8.2 面板（Panel）

- `--radius-lg` + `--shadow-sm` + 1px `--color-border`
- 头部：标题(16px/900) + 副标题(12px/muted)，底分割线，右侧可放分段控件或图标
- 不要"卡片套卡片"。

### 8.3 表格（统一密度规范 ⭐）

**所有 ElTable 一律不写 `size="small"`**，用默认中等密度（已在 `element-theme.css` 全局设定）：

- 默认尺寸单元格 padding：上下 14px
- 字号 `--fs-subtitle`(13px)，表头 `--fs-label`(12px)
- 表头底 `--color-panel-muted`，hover 行 `--color-panel-sunken`
- 数字列加等宽数字

历史代码中 `size="small"` + `font-size: 12px` + 硬编码 `#f8fafc` 表头的组合是"表格过紧"的根因，已在数据看板/应用中心/告警管理清除——**新页面不要重现**。

原生 `<table>`（如大屏库）参照同样密度：单元格 padding `14px var(--space-4)`，`table-layout: auto` 让列自适应铺满，不要用 `fixed` 锁死宽度导致右侧大片留白。

### 8.4 操作列

- 用 `ElButton link type="primary"` 文字按钮，横向排列
- 危险操作（归档/删除）用 `type="danger"` 或独立 danger 样式
- 不要把多个文字按钮竖排堆叠；空间不足时 `flex-wrap` 横向换行，而非挤压

### 8.5 状态标签

- 统一用 `ElTag` + `effect="light"` + `round`（药丸）
- 语义色遵循 §1.5 映射，不要临时传 `type="info"` 之外的随意值
- 原生 chip（非 ElTag）用 `--radius-pill` + 对应 `*-soft` 底 + 主色文字

### 8.6 暗色预览块

- 底用 `--color-sidebar`（深墨绿），子面板用 `--color-sidebar-soft`
- 文字用 `--color-text-on-dark` / `--color-sidebar-text`
- 强调数值用 `--color-accent-300`
- **不要**用旧的 `#07111f` / `rgba(15,23,42,...)` 蓝黑底

## 9. BEM 命名约定

- 块名 = 特性名：`.overview`、`.dashboard-list`、`.alarm-management`
- 元素：`block__element`（`.overview__kpi-card`）
- 状态修饰用 `is-` 前缀：`.is-active`、`.is-disabled`、`.is-published`
- `:deep()` 仅用于覆盖 Element Plus 内部（`.el-card__body`、`.el-table` 变量）
- 测试断言依赖的 class（如 `.overview-view__console-grid`、`.app-shell__main--full-bleed`）不可随意改名。

## 10. Element Plus 主题

- 主题映射在 `element-theme.css`，全部通过 `--el-*` 间接引用 token。
- 改色只动 `tokens.css`，不要在组件里覆盖 `--el-color-primary`。
- 已映射：primary 全阶、success/warning/danger/info、背景、文字、边框、圆角、字体、表格密度、按钮字重、输入聚焦环。

## 11. 可访问性

- 键盘聚焦必须可见：`button/input/select/textarea/a:focus-visible` → 2px `--color-accent` 描边。
- 语义色不依赖单一色相传递信息（色盲友好）：状态点 + 文字标签双重编码。
- 图标按钮必须有 `aria-label`。
- 分段控件用 `aria-pressed`。
- 所有循环动画 `prefers-reduced-motion` 兜底（已在 `global.css` 全局处理）。

## 12. Do / Don't

### Do

- 用 token，不用裸 hex。
- 表格用默认密度，铺满宽度。
- 一个清晰的视觉观点贯彻到底。
- 数字加等宽特性。
- 状态用统一语义映射。
- 改 UI 后跑 `npm run test`（web workspace 内）确认不破坏契约。

### Don't

- 引入旧蓝色（`#2563eb` 系）或旧蓝黑底（`rgba(15,23,42,...)`）。
- 在表格上写 `size="small"` + `font-size: 12px`（已废弃的紧凑配方）。
- 卡片套卡片。
- 用固定宽度锁死内容区（如 `width: min(1180px)`）造成留白。
- 装饰性渐变堆叠、彩虹色平铺、循环装饰动画。
- 为单页面另造状态色映射。

## 13. 文件归属

| 文件 | 职责 |
|---|---|
| `apps/web/src/styles/tokens.css` | Token 唯一事实来源 |
| `apps/web/src/styles/element-theme.css` | Element Plus 主题映射 + 组件全局精修 |
| `apps/web/src/styles/global.css` | reset、氛围底、字体特性、选区、滚动条、reduced-motion |
| `DESIGN.md` | 产品方向与交互约束 |
| `DESIGN-SYSTEM.md` | 本文档，视觉系统规范 |

## 14. 验证清单

新增/改动 UI 后：

- [ ] 只用 token，无裸 hex（`grep` 检查 `#[0-9a-f]{3,6}` 在新代码中）
- [ ] 表格无 `size="small"` + 12px 组合
- [ ] 内容区铺满，无固定宽度锁导致留白
- [ ] 数值带等宽特性
- [ ] 状态色遵循统一映射
- [ ] 循环动画有 reduced-motion 兜底
- [ ] `npm run lint`（vue-tsc）通过
- [ ] `npx vitest run`（apps/web 内）全绿
- [ ] 桌面视距肉眼检查，必要时查平板/移动断点
