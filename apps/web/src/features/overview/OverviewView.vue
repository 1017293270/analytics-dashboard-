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
  <main class="overview-view">
    <header class="overview-view__header">
      <div class="overview-view__title-block">
        <div class="overview-view__eyebrow">
          <ElTag size="small" effect="plain">现场演示</ElTag>
          <ElTag type="success" size="small" effect="plain">数据已同步 {{ refreshedAt }}</ElTag>
        </div>
        <h1>首页总览</h1>
        <p>未来实验学校 · 系统管理员视角 · 统一查看设备、告警、应用与角色工作台运行状态。</p>
      </div>

      <div class="overview-view__header-actions">
        <ElButton :icon="Refresh" @click="refreshOverview">刷新数据</ElButton>
        <ElButton data-testid="demo-mode-link" type="primary" :icon="VideoPlay" @click="openDemoMode">
          进入演示模式
        </ElButton>
      </div>
    </header>

    <section class="overview-view__kpi-grid" aria-label="关键运营指标">
      <ElCard v-for="item in overviewKpis" :key="item.label" shadow="never" class="overview-view__kpi-card">
        <div class="overview-view__kpi-head">
          <span>{{ item.label }}</span>
          <ElTag :type="getOverviewTagType(item.status)" size="small" effect="plain">{{ item.trend }}</ElTag>
        </div>
        <ElStatistic :value="item.value" :precision="item.precision" :suffix="item.suffix" />
        <div class="overview-view__kpi-meta">
          <span>{{ item.secondaryLabel }}</span>
          <strong>{{ item.secondaryValue }}</strong>
        </div>
      </ElCard>
    </section>

    <section class="overview-view__console-grid">
      <ElCard shadow="never" class="overview-view__panel overview-view__panel--alarms">
        <template #header>
          <div class="overview-view__panel-header">
            <div class="overview-view__panel-title">
              <strong>告警优先级队列</strong>
              <p>按处置优先级展示当前需要关注的设备事件。</p>
            </div>
            <ElButtonGroup>
              <ElButton
                data-testid="alarm-filter-all"
                size="small"
                :type="alarmFilter === 'all' ? 'primary' : 'default'"
                :aria-pressed="alarmFilter === 'all'"
                @click="setAlarmFilter('all')"
              >
                全部
              </ElButton>
              <ElButton
                data-testid="alarm-filter-unhandled"
                size="small"
                :type="alarmFilter === '未处理' ? 'primary' : 'default'"
                :aria-pressed="alarmFilter === '未处理'"
                @click="setAlarmFilter('未处理')"
              >
                未处理
              </ElButton>
              <ElButton
                data-testid="alarm-filter-processing"
                size="small"
                :type="alarmFilter === '处理中' ? 'primary' : 'default'"
                :aria-pressed="alarmFilter === '处理中'"
                @click="setAlarmFilter('处理中')"
              >
                处理中
              </ElButton>
            </ElButtonGroup>
          </div>
        </template>

        <ElTable v-if="filteredAlarms.length > 0" :data="filteredAlarms" size="small" class="overview-view__table">
          <ElTableColumn label="级别" width="60">
            <template #default="{ row }">
              <ElTag :type="getAlarmSeverityType(row.severity)" size="small" effect="plain">
                {{ row.severity }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="设备" min-width="150">
            <template #default="{ row }">
              <div class="overview-view__device-cell">
                <strong>{{ row.deviceId }}</strong>
                <span>{{ row.deviceName }}</span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="location" label="发生位置" min-width="126" />
          <ElTableColumn prop="owner" label="责任人" width="74" />
          <ElTableColumn prop="trigger" label="触发方式" min-width="126" />
          <ElTableColumn label="状态" width="86">
            <template #default="{ row }">
              <ElTag :type="getAlarmStatusType(row.status)" size="small" effect="plain">
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="reportedAt" label="上报" width="64" />
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

        <ElEmpty v-else description="当前筛选条件下暂无告警" :image-size="64" />

        <div class="overview-view__alarm-compact-list" aria-label="移动端告警队列">
          <div v-for="alarm in filteredAlarms" :key="alarm.deviceId" class="overview-view__alarm-compact-row">
            <div>
              <strong>{{ alarm.deviceId }}</strong>
              <span>{{ alarm.deviceName }} · {{ alarm.location }}</span>
            </div>
            <ElTag :type="getAlarmStatusType(alarm.status)" size="small" effect="plain">
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
      </ElCard>

      <ElCard shadow="never" class="overview-view__panel overview-view__panel--health">
        <template #header>
          <div class="overview-view__panel-header">
            <div class="overview-view__panel-title">
              <strong>系统健康</strong>
              <p>核心服务状态与演示稳定性。</p>
            </div>
          </div>
        </template>

        <div class="overview-view__health-list">
          <div v-for="item in systemHealth" :key="item.name" class="overview-view__health-row">
            <span class="overview-view__status-dot" :class="`overview-view__status-dot--${item.status}`" />
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.detail }}</span>
            </div>
            <ElTag :type="getOverviewTagType(item.status)" size="small" effect="plain">{{ item.metric }}</ElTag>
          </div>
        </div>
      </ElCard>
    </section>

    <ElCard shadow="never" class="overview-view__panel">
      <template #header>
        <div class="overview-view__panel-header">
          <div class="overview-view__panel-title">
            <strong>演示快捷入口</strong>
            <p>现场讲解时可从这里进入关键功能面。</p>
          </div>
        </div>
      </template>

      <div class="overview-view__launch-grid">
        <RouterLink v-for="item in demoLaunchItems" :key="item.label" :to="item.path" class="overview-view__launch-item">
          <ElIcon><component :is="launchIcons[item.label]" /></ElIcon>
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
          <ElTag :type="getLaunchStatusType(item.status)" size="small" effect="plain">{{ item.status }}</ElTag>
          <ElIcon class="overview-view__launch-arrow"><ArrowRight /></ElIcon>
        </RouterLink>
      </div>
    </ElCard>

    <section class="overview-view__bottom-grid">
      <ElCard shadow="never" class="overview-view__panel">
        <template #header>
          <div class="overview-view__panel-header">
            <div class="overview-view__panel-title">
              <strong>数据看板覆盖</strong>
              <p>默认六类看板接入状态。</p>
            </div>
          </div>
        </template>

        <div class="overview-view__compact-list">
          <div v-for="item in dashboardCoverage" :key="item.name" class="overview-view__compact-row">
            <div>
              <strong>{{ item.name }}</strong>
              <span>{{ item.owner }} · {{ item.updatedAt }}</span>
            </div>
            <ElTag :type="getDashboardStatusType(item.status)" size="small" effect="plain">{{ item.status }}</ElTag>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="never" class="overview-view__panel">
        <template #header>
          <div class="overview-view__panel-header">
            <div class="overview-view__panel-title">
              <strong>角色工作台发布</strong>
              <p>角色可见范围与发布状态。</p>
            </div>
          </div>
        </template>

        <ElTable :data="roleWorkbenches" size="small" class="overview-view__table">
          <ElTableColumn prop="name" label="工作台" min-width="132" />
          <ElTableColumn prop="role" label="角色" width="92" />
          <ElTableColumn label="状态" width="84">
            <template #default="{ row }">
              <ElTag :type="getWorkbenchStatusType(row.status)" size="small" effect="plain">{{ row.status }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="updatedAt" label="更新" width="74" />
        </ElTable>
      </ElCard>

      <ElCard shadow="never" class="overview-view__panel">
        <template #header>
          <div class="overview-view__panel-header">
            <div class="overview-view__panel-title">
              <strong>演示准备进度</strong>
              <p>当前阶段可讲解能力。</p>
            </div>
          </div>
        </template>

        <div class="overview-view__readiness-list">
          <div v-for="(item, index) in demoReadiness" :key="item.label" class="overview-view__readiness-row">
            <span>{{ index + 1 }}</span>
            <div>
              <strong>{{ item.label }}</strong>
              <small>{{ item.detail }}</small>
            </div>
            <ElTag :type="getReadinessStatusType(item.status)" size="small" effect="plain">{{ item.status }}</ElTag>
          </div>
        </div>
      </ElCard>
    </section>
  </main>
</template>

<style scoped>
.overview-view {
  display: grid;
  gap: 16px;
  color: var(--color-text);
}

.overview-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.overview-view__title-block {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.overview-view__eyebrow,
.overview-view__header-actions,
.overview-view__kpi-head,
.overview-view__panel-header,
.overview-view__kpi-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-view__header h1,
.overview-view__header p,
.overview-view__panel-header p {
  margin: 0;
}

.overview-view__header h1 {
  font-size: 26px;
  font-weight: 900;
  line-height: 1.12;
}

.overview-view__header p,
.overview-view__panel-header p,
.overview-view__kpi-meta,
.overview-view__device-cell span,
.overview-view__health-row span,
.overview-view__compact-row span,
.overview-view__launch-item small,
.overview-view__readiness-row small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.overview-view__kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-view__kpi-card {
  min-width: 0;
}

.overview-view__kpi-card :deep(.el-card__body) {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.overview-view__kpi-head {
  justify-content: space-between;
  min-width: 0;
}

.overview-view__kpi-head span,
.overview-view__panel-header strong {
  font-size: 14px;
  font-weight: 900;
}

.overview-view__kpi-meta {
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.overview-view__kpi-meta strong {
  color: var(--color-text);
  font-size: 12px;
}

.overview-view :deep(.el-statistic__number) {
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

.overview-view__console-grid {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.8fr);
  gap: 12px;
}

.overview-view__bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.overview-view__panel {
  min-width: 0;
  border-color: color-mix(in srgb, var(--color-border) 74%, white);
}

.overview-view__panel :deep(.el-card__header) {
  padding: 13px 14px;
  border-bottom-color: color-mix(in srgb, var(--color-border) 76%, white);
}

.overview-view__panel :deep(.el-card__body) {
  padding: 14px;
}

.overview-view__panel-header {
  justify-content: space-between;
  min-width: 0;
}

.overview-view__panel-title {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.overview-view__table {
  --el-table-header-bg-color: #f8fafc;
  --el-table-row-hover-bg-color: #f8fafc;
  font-size: 12px;
}

.overview-view__alarm-compact-list {
  display: none;
}

.overview-view__device-cell {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.overview-view__health-list,
.overview-view__compact-list,
.overview-view__readiness-list {
  display: grid;
}

.overview-view__health-row,
.overview-view__compact-row,
.overview-view__readiness-row {
  display: grid;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, white);
}

.overview-view__health-row {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.overview-view__health-row:last-child,
.overview-view__compact-row:last-child,
.overview-view__readiness-row:last-child {
  border-bottom: 0;
}

.overview-view__health-row div,
.overview-view__compact-row div,
.overview-view__readiness-row div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.overview-view__status-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--color-text-muted);
}

.overview-view__status-dot--success {
  background: var(--color-success);
}

.overview-view__status-dot--warning {
  background: #f59e0b;
}

.overview-view__status-dot--danger {
  background: var(--color-danger);
}

.overview-view__status-dot--primary,
.overview-view__status-dot--info {
  background: var(--color-accent);
}

.overview-view__launch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.overview-view__launch-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 74px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--color-border) 74%, white);
  border-radius: 8px;
  background: #fbfdff;
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--motion-fast) var(--ease-enter),
    background var(--motion-fast) var(--ease-enter);
}

.overview-view__launch-item:hover,
.overview-view__launch-item:focus-visible {
  border-color: var(--color-accent);
  background: #f8fbff;
  outline: 0;
}

.overview-view__launch-item > .el-icon:first-child {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.overview-view__launch-item span {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.overview-view__launch-item strong,
.overview-view__compact-row strong,
.overview-view__readiness-row strong,
.overview-view__health-row strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview-view__launch-arrow {
  color: var(--color-text-muted);
}

.overview-view__compact-row {
  grid-template-columns: minmax(0, 1fr) auto;
}

.overview-view__readiness-row {
  grid-template-columns: 26px minmax(0, 1fr) auto;
}

.overview-view__readiness-row > span:first-child {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 1280px) {
  .overview-view__bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1680px) {
  .overview-view__launch-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .overview-view__header,
  .overview-view__panel-header {
    align-items: stretch;
    flex-direction: column;
  }

  .overview-view__kpi-grid,
  .overview-view__console-grid {
    grid-template-columns: 1fr;
  }

  .overview-view__launch-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .overview-view__header-actions,
  .overview-view__eyebrow {
    align-items: stretch;
    flex-direction: column;
  }

  .overview-view__launch-grid {
    grid-template-columns: 1fr;
  }

  .overview-view__panel--alarms :deep(.el-table) {
    display: none;
  }

  .overview-view__alarm-compact-list {
    display: grid;
    gap: 8px;
  }

  .overview-view__alarm-compact-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-panel-muted);
  }

  .overview-view__alarm-compact-row div {
    display: grid;
    gap: 3px;
    min-width: 0;
  }

  .overview-view__alarm-compact-row strong,
  .overview-view__alarm-compact-row span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
