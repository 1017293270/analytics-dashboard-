<script setup lang="ts">
import { Bell, Refresh, Search, VideoPause, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { alarmApi, type AlarmListPayload, type AlarmSummaryPayload } from './alarmApi'
import {
  alarmStatusOptions,
  buildAlarmListQuery,
  defaultAlarmFilters,
  getNextAlarmStatus,
  mapAlarmDetailToEvent,
  triggerMethodOptions,
  type AlarmAction,
  type AlarmEvent,
  type AlarmStatus,
} from './alarmData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const route = useRoute()
const alarms = ref<AlarmEvent[]>([])
const filters = reactive({ ...defaultAlarmFilters })
const selectedAlarm = ref<AlarmEvent | null>(null)
const summary = ref<AlarmSummaryPayload>({ total: 0, unhandled: 0, processing: 0, resolved: 0 })
const detailVisible = ref(false)
const isLoading = ref(false)
const loadError = ref('')
const playingRecordingId = ref<string | null>(null)

const statusTagTypes: Record<AlarmStatus, TagType> = {
  未处理: 'danger',
  处理中: 'warning',
  已处理: 'success',
}

const filteredAlarms = computed(() => alarms.value)
const isSelectedRecordingPlaying = computed(() => selectedAlarm.value?.id === playingRecordingId.value)

function getStatusTagType(status: AlarmStatus): TagType {
  return statusTagTypes[status]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '告警接口请求失败'
}

function applyListPayload(payload: AlarmListPayload) {
  alarms.value = payload.items.map(mapAlarmDetailToEvent)
  summary.value = payload.summary
}

function upsertAlarm(alarm: AlarmEvent) {
  const index = alarms.value.findIndex((item) => item.id === alarm.id)
  if (index >= 0) {
    alarms.value.splice(index, 1, alarm)
  } else {
    alarms.value = [alarm, ...alarms.value]
  }
}

async function loadAlarms() {
  isLoading.value = true
  loadError.value = ''

  try {
    applyListPayload(await alarmApi.listAlarms(buildAlarmListQuery(filters)))
  } catch (error) {
    loadError.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

async function searchAlarms() {
  selectedAlarm.value = null
  detailVisible.value = false
  await loadAlarms()
}

async function refreshAlarms() {
  await loadAlarms()
}

async function resetDemoAlarms() {
  Object.assign(filters, { ...defaultAlarmFilters, dateRange: [] })
  selectedAlarm.value = null
  detailVisible.value = false
  playingRecordingId.value = null
  loadError.value = ''

  try {
    applyListPayload(await alarmApi.resetDemoAlarms())
  } catch (error) {
    loadError.value = getErrorMessage(error)
  }
}

async function openAlarm(alarm: AlarmEvent) {
  selectedAlarm.value = alarm
  detailVisible.value = true
  playingRecordingId.value = null
  loadError.value = ''

  try {
    const detail = mapAlarmDetailToEvent(await alarmApi.getAlarm(alarm.id))
    selectedAlarm.value = detail
    upsertAlarm(detail)
  } catch (error) {
    loadError.value = getErrorMessage(error)
  }
}

async function applyStatusAction(action: AlarmAction) {
  if (!selectedAlarm.value) return

  const nextStatus = getNextAlarmStatus(selectedAlarm.value.status, action)
  if (nextStatus === selectedAlarm.value.status) return

  loadError.value = ''

  try {
    const updatedAlarm = mapAlarmDetailToEvent(await alarmApi.updateAlarmStatus(selectedAlarm.value.id, { action }))
    selectedAlarm.value = updatedAlarm
    upsertAlarm(updatedAlarm)
    await loadAlarms()
    selectedAlarm.value = updatedAlarm
  } catch (error) {
    loadError.value = getErrorMessage(error)
  }
}

async function addFalsePositiveRecord() {
  if (!selectedAlarm.value) return

  loadError.value = ''

  try {
    const updatedAlarm = mapAlarmDetailToEvent(
      await alarmApi.createDisposalRecord(selectedAlarm.value.id, {
        action: '误报反馈',
        note: '已记录误报反馈，待复核告警规则。',
      }),
    )
    selectedAlarm.value = updatedAlarm
    upsertAlarm(updatedAlarm)
  } catch (error) {
    loadError.value = getErrorMessage(error)
  }
}

function toggleSelectedRecording() {
  if (!selectedAlarm.value) return

  playingRecordingId.value = isSelectedRecordingPlaying.value ? null : selectedAlarm.value.id
}

async function syncQueryDevice() {
  const device = typeof route.query.device === 'string' ? route.query.device : ''
  if (!device) return

  const matchedAlarm = alarms.value.find((alarm) => alarm.deviceIdentifier === device)
  if (matchedAlarm) {
    await openAlarm(matchedAlarm)
  }
}

watch(
  () => route.query.device,
  () => {
    void syncQueryDevice()
  },
)

onMounted(async () => {
  await loadAlarms()
  await syncQueryDevice()
})
</script>

<template>
  <main class="alarm-management">
    <header class="alarm-management__header">
      <div>
        <div class="alarm-management__eyebrow">
          <ElTag size="small" effect="plain">集控控制管理系统</ElTag>
          <ElTag type="danger" size="small" effect="plain">现场演示</ElTag>
        </div>
        <h1>告警管理</h1>
        <p>按设备、位置、状态和触发方式筛选学校设备事件，并完成处置演示。</p>
      </div>
      <ElButton :icon="Refresh" @click="refreshAlarms">刷新列表</ElButton>
    </header>

    <section class="alarm-management__summary" aria-label="告警统计">
      <ElCard shadow="never"><span>告警总数</span><strong>{{ summary.total }}</strong></ElCard>
      <ElCard shadow="never"><span>未处理</span><strong>{{ summary.unhandled }}</strong></ElCard>
      <ElCard shadow="never"><span>处理中</span><strong>{{ summary.processing }}</strong></ElCard>
      <ElCard shadow="never"><span>已处理</span><strong>{{ summary.resolved }}</strong></ElCard>
    </section>

    <ElAlert v-if="loadError" :title="loadError" type="error" show-icon :closable="false" />

    <ElCard v-loading="isLoading" shadow="never" class="alarm-management__panel">
      <ElForm class="alarm-management__filters" label-position="top">
        <ElFormItem label="时间范围">
          <ElDatePicker
            v-model="filters.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem label="设备编号/名称/位置">
          <ElInput
            v-model="filters.keyword"
            data-testid="alarm-keyword-input"
            placeholder="请输入设备编号/名称/位置"
            clearable
            :prefix-icon="Search"
          />
        </ElFormItem>
        <ElFormItem label="事件状态">
          <ElSelect v-model="filters.status">
            <ElOption v-for="status in alarmStatusOptions" :key="status" :label="status" :value="status" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="触发方式">
          <ElSelect v-model="filters.triggerMethod">
            <ElOption v-for="method in triggerMethodOptions" :key="method" :label="method" :value="method" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作">
          <ElButtonGroup>
            <ElButton data-testid="alarm-reset-button" @click="resetDemoAlarms">重置</ElButton>
            <ElButton data-testid="alarm-search-button" type="primary" :icon="Search" @click="searchAlarms">
              查询
            </ElButton>
          </ElButtonGroup>
        </ElFormItem>
      </ElForm>

      <ElTable v-if="filteredAlarms.length > 0" :data="filteredAlarms" class="alarm-management__table">
        <ElTableColumn prop="deviceIdentifier" label="设备标识符" min-width="132" />
        <ElTableColumn prop="deviceName" label="设备名称" min-width="140" />
        <ElTableColumn prop="location" label="发生位置" min-width="160" />
        <ElTableColumn prop="responsibleName" label="通知人/责任人" width="112" />
        <ElTableColumn prop="triggerMethod" label="触发方式" width="106" />
        <ElTableColumn label="事件状态" width="102">
          <template #default="{ row }">
            <ElTag :type="getStatusTagType(row.status)" size="small" effect="plain">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="reportedAt" label="上报时间" min-width="150" />
        <ElTableColumn label="操作" width="84" fixed="right">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              size="small"
              :data-testid="`alarm-view-${row.deviceIdentifier}`"
              @click="openAlarm(row)"
            >
              查看
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前筛选条件下暂无告警">
        <ElButton @click="resetDemoAlarms">重置筛选</ElButton>
      </ElEmpty>
    </ElCard>

    <ElDrawer v-model="detailVisible" title="告警详情" size="520px">
      <div v-if="selectedAlarm" class="alarm-management__detail">
        <div class="alarm-management__detail-head">
          <ElTag :type="getStatusTagType(selectedAlarm.status)" effect="plain">{{ selectedAlarm.status }}</ElTag>
          <strong>{{ selectedAlarm.eventType }}</strong>
        </div>

        <ElDescriptions :column="1" border size="small">
          <ElDescriptionsItem label="设备标识符">{{ selectedAlarm.deviceIdentifier }}</ElDescriptionsItem>
          <ElDescriptionsItem label="设备名称">{{ selectedAlarm.deviceName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="发生位置">{{ selectedAlarm.location }}</ElDescriptionsItem>
          <ElDescriptionsItem label="上报时间">{{ selectedAlarm.reportedAt }}</ElDescriptionsItem>
          <ElDescriptionsItem label="触发方式">{{ selectedAlarm.triggerMethod }}</ElDescriptionsItem>
          <ElDescriptionsItem label="责任人">{{ selectedAlarm.responsibleName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="责任人电话">
            <span class="alarm-management__phone">{{ selectedAlarm.responsiblePhone }}</span>
          </ElDescriptionsItem>
        </ElDescriptions>

        <section class="alarm-management__recording" aria-label="事件录音">
          <h2>事件触发录音</h2>
          <div class="alarm-management__audio">
            <ElButton
              data-testid="alarm-recording-toggle"
              :icon="isSelectedRecordingPlaying ? VideoPause : VideoPlay"
              type="primary"
              plain
              @click="toggleSelectedRecording"
            >
              {{ isSelectedRecordingPlaying ? '暂停' : '播放' }}
            </ElButton>
            <span>0:00 / {{ selectedAlarm.recordingDuration }}</span>
            <div class="alarm-management__audio-bar" data-testid="alarm-recording-track">
              <span :class="{ 'is-playing': isSelectedRecordingPlaying }" />
            </div>
            <ElIcon><Bell /></ElIcon>
          </div>
        </section>

        <section>
          <h2>处理记录</h2>
          <ElTimeline>
            <ElTimelineItem
              v-for="record in selectedAlarm.disposalRecords"
              :key="record.id"
              :timestamp="record.createdAt"
            >
              <strong>{{ record.operatorName }} · {{ record.action }}</strong>
              <p>{{ record.note }}</p>
            </ElTimelineItem>
          </ElTimeline>
        </section>

        <footer class="alarm-management__drawer-actions">
          <ElButton
            data-testid="alarm-mark-processing"
            type="primary"
            :disabled="selectedAlarm.status !== '未处理'"
            @click="applyStatusAction('processing')"
          >
            标记为处理中
          </ElButton>
          <ElButton
            data-testid="alarm-mark-resolved"
            type="success"
            :disabled="selectedAlarm.status === '已处理'"
            @click="applyStatusAction('resolved')"
          >
            标记为已处理
          </ElButton>
          <ElButton data-testid="alarm-false-positive" :icon="WarningFilled" @click="addFalsePositiveRecord">
            误报反馈
          </ElButton>
        </footer>
      </div>
    </ElDrawer>
  </main>
</template>

<style scoped>
.alarm-management {
  display: grid;
  gap: 16px;
  color: var(--color-text);
}

.alarm-management__header,
.alarm-management__eyebrow,
.alarm-management__detail-head,
.alarm-management__drawer-actions,
.alarm-management__audio {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alarm-management__header {
  justify-content: space-between;
}

.alarm-management__header h1,
.alarm-management__header p,
.alarm-management__recording h2,
.alarm-management__detail h2 {
  margin: 0;
}

.alarm-management__header h1 {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 900;
}

.alarm-management__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.alarm-management__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.alarm-management__summary :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
}

.alarm-management__summary span,
.alarm-management__detail p {
  color: var(--color-text-muted);
  font-size: 12px;
}

.alarm-management__summary strong {
  font-size: 26px;
  font-weight: 900;
}

.alarm-management__panel :deep(.el-card__body) {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.alarm-management__filters {
  display: grid;
  grid-template-columns: minmax(240px, 1.1fr) minmax(260px, 1.2fr) minmax(150px, 0.7fr) minmax(150px, 0.7fr) auto;
  gap: 12px;
  align-items: end;
}

.alarm-management__filters :deep(.el-form-item) {
  margin-bottom: 0;
}

.alarm-management__table {
  --el-table-header-bg-color: var(--color-panel-muted);
  font-size: var(--fs-subtitle);
}

.alarm-management__detail {
  display: grid;
  gap: 18px;
}

.alarm-management__detail-head strong {
  font-size: 16px;
  font-weight: 900;
}

.alarm-management__phone {
  user-select: text;
}

.alarm-management__recording,
.alarm-management__detail section {
  display: grid;
  gap: 10px;
}

.alarm-management__detail h2 {
  font-size: 15px;
  font-weight: 900;
}

.alarm-management__audio {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-muted);
}

.alarm-management__audio-bar {
  position: relative;
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-panel-sunken);
}

.alarm-management__audio-bar span {
  display: block;
  width: 58%;
  height: 100%;
  background: var(--color-text-muted);
}

.alarm-management__audio-bar span.is-playing {
  background: var(--color-accent);
}

.alarm-management__drawer-actions {
  justify-content: flex-start;
  padding-top: 8px;
}

@media (max-width: 1100px) {
  .alarm-management__summary,
  .alarm-management__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .alarm-management__header,
  .alarm-management__drawer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .alarm-management__summary,
  .alarm-management__filters {
    grid-template-columns: 1fr;
  }
}
</style>
