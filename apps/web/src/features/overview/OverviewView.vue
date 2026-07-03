<script setup lang="ts">
import { VideoPlay } from '@element-plus/icons-vue'
import { overviewAlarms, overviewKpis, overviewWorkbenches } from './overviewData'

type TagType = 'primary' | 'success' | 'warning' | 'danger'

const alarmStatusTypes: Record<string, TagType> = {
  待处理: 'danger',
  处理中: 'warning',
  已解决: 'success',
}

const workbenchStatusTypes: Record<string, TagType> = {
  已启用: 'success',
  草稿: 'warning',
}

function getAlarmStatusType(status: string): TagType {
  return alarmStatusTypes[status] ?? 'primary'
}

function getWorkbenchStatusType(status: string): TagType {
  return workbenchStatusTypes[status] ?? 'primary'
}
</script>

<template>
  <main class="overview-view">
    <header class="overview-view__header">
      <div>
        <h1>首页总览</h1>
        <p>统一查看学校设备、告警、应用与角色工作台运行状态。</p>
      </div>
      <ElButton type="primary" :icon="VideoPlay">进入演示模式</ElButton>
    </header>

    <ElRow :gutter="16" class="overview-view__kpis">
      <ElCol v-for="item in overviewKpis" :key="item.label" :xs="24" :sm="12" :lg="6">
        <ElCard shadow="never" class="overview-view__kpi">
          <ElStatistic :title="item.label" :value="item.value" :precision="item.precision" :suffix="item.suffix" />
          <ElTag :type="item.status" size="small" effect="plain">{{ item.trend }}</ElTag>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16" class="overview-view__grid">
      <ElCol :xs="24" :lg="14">
        <ElCard shadow="never">
          <template #header>
            <div class="overview-view__card-title">
              <strong>告警管理</strong>
              <ElTag type="danger" effect="plain">现场演示</ElTag>
            </div>
          </template>
          <ElTable :data="overviewAlarms" size="small">
            <ElTableColumn prop="device" label="设备标识符" min-width="120" />
            <ElTableColumn prop="location" label="发生位置" min-width="160" />
            <ElTableColumn prop="owner" label="责任人" width="90" />
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }">
                <ElTag :type="getAlarmStatusType(row.status)" size="small" effect="plain">
                  {{ row.status }}
                </ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :lg="10">
        <ElCard shadow="never">
          <template #header>
            <div class="overview-view__card-title">
              <strong>工作台发布</strong>
              <ElTag effect="plain">角色可见</ElTag>
            </div>
          </template>
          <ElTable :data="overviewWorkbenches" size="small">
            <ElTableColumn prop="name" label="工作台" min-width="140" />
            <ElTableColumn prop="role" label="角色" width="100" />
            <ElTableColumn label="状态" width="90">
              <template #default="{ row }">
                <ElTag :type="getWorkbenchStatusType(row.status)" size="small" effect="plain">
                  {{ row.status }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="update" label="更新" width="80" />
          </ElTable>
        </ElCard>
      </ElCol>
    </ElRow>
  </main>
</template>

<style scoped>
.overview-view {
  display: grid;
  gap: 18px;
}

.overview-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.overview-view__header h1,
.overview-view__header p {
  margin: 0;
}

.overview-view__header h1 {
  font-size: 26px;
  font-weight: 900;
}

.overview-view__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.overview-view__kpis,
.overview-view__grid {
  row-gap: 16px;
}

.overview-view__kpi {
  min-height: 132px;
}

.overview-view__kpi :deep(.el-card__body) {
  display: grid;
  gap: 14px;
}

.overview-view__card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 760px) {
  .overview-view__header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
