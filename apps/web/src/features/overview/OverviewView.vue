<script setup lang="ts">
import {
  ArrowRight,
  Bell,
  Collection,
  DataAnalysis,
  Grid,
  Monitor,
  Refresh,
  Tickets,
  TrendCharts,
  VideoPlay,
} from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import type { AlarmQueueStatus, OverviewStatus } from './overviewData'
import {
  dashboardCoverage,
  demoLaunchItems,
  demoReadiness,
  overviewKpis,
  priorityAlarms,
  roleWorkbenches,
  systemHealth,
} from './overviewData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'
type AlarmFilter = 'all' | AlarmQueueStatus

const alarmFilter = ref<AlarmFilter>('all')
const refreshedAt = ref('09:46')
const router = useRouter()

const launchIcons: Record<string, Component> = {
  工作台配置: Grid,
  数据看板: DataAnalysis,
  应用中心: Collection,
  告警管理: Bell,
  智慧黑板: Tickets,
  互动教学: Monitor,
}

const overviewStatusTypes: Record<OverviewStatus, TagType> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  primary: 'primary',
  info: 'info',
}

const alarmStatusTypes: Record<AlarmQueueStatus, TagType> = {
  未处理: 'danger',
  处理中: 'warning',
  已处理: 'success',
}

const alarmSeverityTypes: Record<string, TagType> = {
  高: 'danger',
  中: 'warning',
  低: 'info',
}

const dashboardStatusTypes: Record<string, TagType> = {
  已配置: 'success',
  草稿: 'warning',
  待接入: 'info',
}

const readinessStatusTypes: Record<string, TagType> = {
  已完成: 'success',
  可演示: 'primary',
  下一阶段: 'info',
}

const launchStatusTypes: Record<string, TagType> = {
  可演示: 'success',
  待完善: 'warning',
  待开发: 'info',
}

const alarmFilters: { key: AlarmFilter; label: string; testid: string }[] = [
  { key: 'all', label: '全部', testid: 'alarm-filter-all' },
  { key: '未处理', label: '未处理', testid: 'alarm-filter-unhandled' },
  { key: '处理中', label: '处理中', testid: 'alarm-filter-processing' },
]

const filteredAlarms = computed(() =>
  alarmFilter.value === 'all'
    ? priorityAlarms
    : priorityAlarms.filter((alarm) => alarm.status === alarmFilter.value),
)

function getOverviewTagType(status: OverviewStatus): TagType {
  return overviewStatusTypes[status]
}

function getAlarmStatusType(status: AlarmQueueStatus): TagType {
  return alarmStatusTypes[status]
}

function getAlarmSeverityType(severity: string): TagType {
  return alarmSeverityTypes[severity] ?? 'info'
}

function getDashboardStatusType(status: string): TagType {
  return dashboardStatusTypes[status] ?? 'info'
}

function getWorkbenchStatusType(status: string): TagType {
  return status === '已启用' ? 'success' : 'warning'
}

function getReadinessStatusType(status: string): TagType {
  return readinessStatusTypes[status] ?? 'info'
}

function getLaunchStatusType(status: string): TagType {
  return launchStatusTypes[status] ?? 'info'
}

function setAlarmFilter(value: AlarmFilter) {
  alarmFilter.value = value
}

function refreshOverview() {
  refreshedAt.value = '刚刚'
}

async function openDemoMode() {
  await router.push('/workbenches')
}

async function openAlarmDetail(deviceId: string) {
  await router.push({ path: '/alarms', query: { device: deviceId } })
}
</script>

<template>
  <main class="overview">
    <!-- ════ Page header ════ -->
    <header class="overview__header">
      <div class="overview__title-block">
        <div class="overview__eyebrow">
          <ElTag size="small" effect="plain">现场演示</ElTag>
          <ElTag type="success" size="small" effect="plain">数据已同步 {{ refreshedAt }}</ElTag>
        </div>
        <h1>首页总览</h1>
        <p>未来实验学校 · 系统管理员视角 · 统一查看设备、告警、应用与角色工作台运行状态。</p>
      </div>

      <div class="overview__header-actions">
        <ElButton :icon="Refresh" @click="refreshOverview">刷新数据</ElButton>
        <ElButton data-testid="demo-mode-link" type="primary" :icon="VideoPlay" @click="openDemoMode">
          进入演示模式
        </ElButton>
      </div>
    </header>

    <!-- ════ KPI grid ════ -->
    <section class="overview__kpi-grid" aria-label="关键运营指标">
      <article
        v-for="item in overviewKpis"
        :key="item.label"
        class="overview__kpi-card overview__kpi-card--accent"
        :class="`overview__kpi-card--${item.status}`"
      >
        <div class="overview__kpi-top">
          <span class="overview__kpi-label">{{ item.label }}</span>
          <span class="overview__kpi-trend" :class="`overview__kpi-trend--${item.status}`">{{ item.trend }}</span>
        </div>
        <div class="overview__kpi-value">
          <ElStatistic :value="item.value" :precision="item.precision" :suffix="item.suffix" />
        </div>
        <div class="overview__kpi-meta">
          <span>{{ item.secondaryLabel }}</span>
          <strong>{{ item.secondaryValue }}</strong>
        </div>
      </article>
    </section>

    <!-- ════ Console grid: alarm queue + system health ════ -->
    <section class="overview-view__console-grid">
      <!-- Alarm queue -->
      <article class="overview__panel overview__panel--alarms">
        <header class="overview__panel-head">
          <div class="overview__panel-title">
            <strong>告警优先级队列</strong>
            <p>按处置优先级展示当前需要关注的设备事件。</p>
          </div>
          <div class="overview__seg" role="group" aria-label="告警筛选">
            <button
              v-for="filter in alarmFilters"
              :key="filter.key"
              type="button"
              class="overview__seg-btn"
              :class="{ 'is-active': alarmFilter === filter.key }"
              :data-testid="filter.testid"
              :aria-pressed="alarmFilter === filter.key"
              @click="setAlarmFilter(filter.key)"
            >
              {{ filter.label }}
            </button>
          </div>
        </header>

        <ElTable v-if="filteredAlarms.length > 0" :data="filteredAlarms" size="small" class="overview__table">
          <ElTableColumn label="级别" width="64">
            <template #default="{ row }">
              <span class="overview__sev" :class="`overview__sev--${getAlarmSeverityType(row.severity)}`">
                {{ row.severity }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="设备" min-width="160">
            <template #default="{ row }">
              <div class="overview__device-cell">
                <strong>{{ row.deviceId }}</strong>
                <span>{{ row.deviceName }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="location" label="发生位置" min-width="126" />
          <ElTableColumn prop="owner" label="责任人" width="76" />
          <ElTableColumn prop="trigger" label="触发方式" min-width="126" />
          <ElTableColumn label="状态" width="86">
            <template #default="{ row }">
              <ElTag :type="getAlarmStatusType(row.status)" size="small" effect="light" round>
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="reportedAt" label="上报" width="66" />
          <ElTableColumn label="操作" width="68">
            <template #default="{ row }">
              <ElButton
                link
                type="primary"
                size="small"
                :data-testid="`alarm-detail-link-${row.deviceId}`"
                @click="openAlarmDetail(row.deviceId)"
              >
                查看
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <div v-else class="overview__empty">
          <ElEmpty description="当前筛选条件下暂无告警" :image-size="64" />
        </div>

        <div class="overview__alarm-compact-list" aria-label="移动端告警队列">
          <div v-for="alarm in filteredAlarms" :key="alarm.deviceId" class="overview__alarm-compact-row">
            <div>
              <strong>{{ alarm.deviceId }}</strong>
              <span>{{ alarm.deviceName }} · {{ alarm.location }}</span>
            </div>
            <ElTag :type="getAlarmStatusType(alarm.status)" size="small" effect="light" round>
              {{ alarm.status }}
            </ElTag>
            <ElButton
              link
              type="primary"
              size="small"
              :data-testid="`alarm-compact-detail-link-${alarm.deviceId}`"
              @click="openAlarmDetail(alarm.deviceId)"
            >
              查看
            </ElButton>
          </div>
        </div>
      </article>

      <!-- System health -->
      <article class="overview__panel overview__panel--health">
        <header class="overview__panel-head">
          <div class="overview__panel-title">
            <strong>系统健康</strong>
            <p>核心服务状态与演示稳定性。</p>
          </div>
          <span class="overview__health-badge">
            <span class="overview__health-pulse" :class="`overview__health-pulse--success`" />
            运行中
          </span>
        </header>

        <div class="overview__health-list">
          <div v-for="item in systemHealth" :key="item.name" class="overview__health-row">
            <span class="overview__status-dot" :class="`overview__status-dot--${item.status}`" />
            <div class="overview__health-info">
              <strong>{{ item.name }}</strong>
              <span>{{ item.detail }}</span>
            </div>
            <span class="overview__health-metric" :class="`overview__health-metric--${item.status}`">
              {{ item.metric }}
            </span>
          </div>
        </div>
      </article>
    </section>

    <!-- ════ Demo launch ════ -->
    <article class="overview__panel overview__panel--launch">
      <header class="overview__panel-head">
        <div class="overview__panel-title">
          <strong>演示快捷入口</strong>
          <p>现场讲解时可从这里进入关键功能面。</p>
        </div>
      </header>

      <div class="overview__launch-grid">
        <RouterLink
          v-for="item in demoLaunchItems"
          :key="item.label"
          :to="item.path"
          class="overview__launch-item"
        >
          <span class="overview__launch-icon">
            <ElIcon><component :is="launchIcons[item.label]" /></ElIcon>
          </span>
          <span class="overview__launch-text">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
          <ElTag :type="getLaunchStatusType(item.status)" size="small" effect="light" round>
            {{ item.status }}
          </ElTag>
          <ElIcon class="overview__launch-arrow"><ArrowRight /></ElIcon>
        </RouterLink>
      </div>
    </article>

    <!-- ════ Bottom grid ════ -->
    <section class="overview__bottom-grid">
      <!-- Dashboard coverage -->
      <article class="overview__panel">
        <header class="overview__panel-head">
          <div class="overview__panel-title">
            <strong>数据看板覆盖</strong>
            <p>默认六类看板接入状态。</p>
          </div>
          <ElIcon class="overview__panel-glyph"><TrendCharts /></ElIcon>
        </header>

        <div class="overview__coverage-list">
          <div v-for="item in dashboardCoverage" :key="item.name" class="overview__coverage-row">
            <div class="overview__coverage-info">
              <strong>{{ item.name }}</strong>
              <span>{{ item.owner }} · {{ item.updatedAt }}</span>
            </div>
            <ElTag :type="getDashboardStatusType(item.status)" size="small" effect="light" round>
              {{ item.status }}
            </ElTag>
          </div>
        </div>
      </article>

      <!-- Role workbenches -->
      <article class="overview__panel">
        <header class="overview__panel-head">
          <div class="overview__panel-title">
            <strong>角色工作台状态</strong>
            <p>角色可见范围与启用状态。</p>
          </div>
          <ElIcon class="overview__panel-glyph"><Grid /></ElIcon>
        </header>

        <ElTable :data="roleWorkbenches" size="small" class="overview__table">
          <ElTableColumn prop="name" label="工作台" min-width="132" />
          <ElTableColumn prop="role" label="角色" width="92" />
          <ElTableColumn label="状态" width="84">
            <template #default="{ row }">
              <ElTag :type="getWorkbenchStatusType(row.status)" size="small" effect="light" round>
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="updatedAt" label="更新" width="76" />
        </ElTable>
      </article>

      <!-- Demo readiness -->
      <article class="overview__panel">
        <header class="overview__panel-head">
          <div class="overview__panel-title">
            <strong>演示准备进度</strong>
            <p>当前阶段可讲解能力。</p>
          </div>
          <ElIcon class="overview__panel-glyph"><Tickets /></ElIcon>
        </header>

        <div class="overview__readiness-list">
          <div v-for="(item, index) in demoReadiness" :key="item.label" class="overview__readiness-row">
            <span class="overview__readiness-index">{{ index + 1 }}</span>
            <div class="overview__readiness-info">
              <strong>{{ item.label }}</strong>
              <small>{{ item.detail }}</small>
            </div>
            <ElTag :type="getReadinessStatusType(item.status)" size="small" effect="light" round>
              {{ item.status }}
            </ElTag>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.overview {
  display: grid;
  gap: var(--space-4);
  max-width: var(--content-max);
  margin: 0 auto;
  color: var(--color-text);
  animation: overview-enter 0.4s var(--ease-enter);
}

@keyframes overview-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ════ Page header ════ */
.overview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
}

.overview__title-block {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.overview__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.overview__header h1 {
  margin: 0;
  font-size: var(--fs-display);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  line-height: var(--lh-tight);
}

.overview__header p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--fs-subtitle);
  max-width: 560px;
}

.overview__header-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-2);
}

/* ════ KPI cards ════ */
.overview__kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.overview__kpi-card {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-panel);
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--motion-base) var(--ease-out),
    box-shadow var(--motion-base) var(--ease-out),
    border-color var(--motion-base) var(--ease-out);
}

.overview__kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-accent);
  opacity: 0.85;
}

.overview__kpi-card--success::before {
  background: var(--color-success);
}
.overview__kpi-card--danger::before {
  background: var(--color-danger);
}
.overview__kpi-card--primary::before {
  background: var(--color-accent);
}
.overview__kpi-card--warning::before {
  background: var(--color-warning);
}

.overview__kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.overview__kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-width: 0;
}

.overview__kpi-label {
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-label);
  text-transform: none;
}

.overview__kpi-trend {
  flex: none;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: var(--fw-bold);
  background: var(--color-accent-50);
  color: var(--color-accent-700);
}

.overview__kpi-trend--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}
.overview__kpi-trend--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.overview__kpi-trend--warning {
  background: var(--color-warning-soft);
  color: #b45309;
}

.overview__kpi-value :deep(.el-statistic__number) {
  font-size: var(--fs-stat);
  font-weight: var(--fw-black);
  line-height: 1;
  color: var(--color-text-strong);
}

.overview__kpi-value :deep(.el-statistic__suffix) {
  font-size: 18px;
  font-weight: var(--fw-bold);
  color: var(--color-text-muted);
}

.overview__kpi-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--fs-label);
  color: var(--color-text-muted);
}

.overview__kpi-meta strong {
  color: var(--color-text);
  font-weight: var(--fw-bold);
  font-feature-settings: var(--num-feature);
}

/* ════ Console grid (preserved BEM class for test contract) ════ */
.overview-view__console-grid {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.85fr);
  gap: var(--space-3);
}

/* ════ Panels ════ */
.overview__panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-panel);
  box-shadow: var(--shadow-sm);
}

.overview__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.overview__panel-title {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.overview__panel-title strong {
  font-size: var(--fs-title);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
}

.overview__panel-title p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--fs-label);
}

.overview__panel-glyph {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
  font-size: 17px;
}

/* ── Alarm segmented control ── */
.overview__seg {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
}

.overview__seg-btn {
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition:
    background var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.overview__seg-btn:hover {
  color: var(--color-text);
}

.overview__seg-btn.is-active {
  background: var(--color-panel);
  color: var(--color-accent-700);
  box-shadow: var(--shadow-xs);
}

/* ── Alarm table ── */
.overview__panel--alarms {
  display: grid;
}

.overview__panel--alarms > .overview__panel-head {
  border-bottom: 1px solid var(--color-border);
}

.overview__table {
  margin: 0 var(--space-4) var(--space-3);
  width: auto;
  font-size: var(--fs-label);
}

.overview__table :deep(.el-table__inner-wrapper) {
  border-radius: var(--radius-md);
}

.overview__sev {
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  height: 22px;
  padding: 0 7px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: var(--fw-black);
}

.overview__sev--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.overview__sev--warning {
  background: var(--color-warning-soft);
  color: #b45309;
}
.overview__sev--info {
  background: var(--color-info-soft);
  color: var(--color-info);
}

.overview__device-cell {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.overview__device-cell strong {
  font-size: 13px;
  font-weight: var(--fw-bold);
  font-feature-settings: var(--num-feature);
}

.overview__device-cell span {
  color: var(--color-text-muted);
  font-size: 11px;
}

.overview__empty {
  display: grid;
  place-items: center;
  padding: var(--space-6) var(--space-4);
}

.overview__alarm-compact-list {
  display: none;
}

/* ── System health ── */
.overview__health-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-success-soft);
  color: var(--color-success);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

.overview__health-pulse {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-circle);
  background: var(--color-success);
}

.overview__health-pulse::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: var(--radius-circle);
  background: var(--color-success);
  opacity: 0.35;
  animation: overview-pulse 2.2s var(--ease-out) infinite;
}

@keyframes overview-pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.4;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}

.overview__health-list {
  display: grid;
  padding: var(--space-2) var(--space-4) var(--space-3);
}

.overview__health-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border);
}

.overview__health-row:last-child {
  border-bottom: 0;
}

.overview__health-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.overview__health-info strong {
  font-size: 13px;
  font-weight: var(--fw-bold);
}

.overview__health-info span {
  color: var(--color-text-muted);
  font-size: 11px;
}

.overview__health-metric {
  font-size: 12px;
  font-weight: var(--fw-black);
  font-feature-settings: var(--num-feature);
  color: var(--color-success);
}

.overview__health-metric--warning {
  color: #b45309;
}

/* ── Status dots ── */
.overview__status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-circle);
  background: var(--color-text-muted);
}

.overview__status-dot--success {
  background: var(--color-success);
}
.overview__status-dot--warning {
  background: var(--color-warning);
}
.overview__status-dot--danger {
  background: var(--color-danger);
}
.overview__status-dot--primary,
.overview__status-dot--info {
  background: var(--color-accent);
}

/* ════ Launch grid ════ */
.overview__launch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
}

.overview__launch-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-3);
  min-height: 76px;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: inherit;
  text-decoration: none;
  transition:
    transform var(--motion-base) var(--ease-out),
    border-color var(--motion-base) var(--ease-out),
    box-shadow var(--motion-base) var(--ease-out);
}

.overview__launch-item:hover,
.overview__launch-item:focus-visible {
  transform: translateY(-2px);
  border-color: var(--color-border-accent);
  box-shadow: var(--shadow-lift);
  outline: 0;
}

.overview__launch-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-accent-50), var(--color-accent-100));
  color: var(--color-accent-700);
  font-size: 19px;
}

.overview__launch-text {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.overview__launch-text strong {
  font-size: 14px;
  font-weight: var(--fw-black);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview__launch-text small {
  color: var(--color-text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview__launch-arrow {
  color: var(--color-text-faint);
  transition:
    transform var(--motion-base) var(--ease-out),
    color var(--motion-base) var(--ease-out);
}

.overview__launch-item:hover .overview__launch-arrow {
  transform: translateX(3px);
  color: var(--color-accent);
}

/* ════ Bottom grid ════ */
.overview__bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

/* ── Coverage list ── */
.overview__coverage-list {
  display: grid;
  padding: var(--space-2) var(--space-4) var(--space-3);
}

.overview__coverage-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border);
}

.overview__coverage-row:last-child {
  border-bottom: 0;
}

.overview__coverage-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.overview__coverage-info strong {
  font-size: 13px;
  font-weight: var(--fw-bold);
}

.overview__coverage-info span {
  color: var(--color-text-muted);
  font-size: 11px;
}

/* ── Readiness list ── */
.overview__readiness-list {
  display: grid;
  padding: var(--space-2) var(--space-4) var(--space-3);
}

.overview__readiness-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  padding: 11px 0;
  border-bottom: 1px solid var(--color-border);
}

.overview__readiness-row:last-child {
  border-bottom: 0;
}

.overview__readiness-index {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-circle);
  background: var(--color-accent-50);
  color: var(--color-accent-700);
  font-size: 12px;
  font-weight: var(--fw-black);
  font-feature-settings: var(--num-feature);
}

.overview__readiness-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.overview__readiness-info strong {
  font-size: 13px;
  font-weight: var(--fw-bold);
}

.overview__readiness-info small {
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: var(--lh-normal);
}

/* ════ Responsive ════ */
@media (max-width: 1280px) {
  .overview__bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1680px) {
  .overview__launch-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .overview__header {
    align-items: stretch;
    flex-direction: column;
  }

  .overview__kpi-grid,
  .overview-view__console-grid {
    grid-template-columns: 1fr;
  }

  .overview__launch-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .overview__header-actions,
  .overview__eyebrow {
    align-items: stretch;
    flex-direction: column;
  }

  .overview__launch-grid {
    grid-template-columns: 1fr;
  }

  .overview__panel--alarms :deep(.el-table) {
    display: none;
  }

  .overview__alarm-compact-list {
    display: grid;
    gap: var(--space-2);
    padding: 0 var(--space-4) var(--space-3);
  }

  .overview__alarm-compact-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-panel-muted);
  }

  .overview__alarm-compact-row div {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .overview__alarm-compact-row strong,
  .overview__alarm-compact-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overview {
    animation: none;
  }

  .overview__health-pulse::after {
    animation: none;
  }
}
</style>
