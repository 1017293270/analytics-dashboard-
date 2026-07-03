# Alarm And Application Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/alarms` and `/applications` overview placeholders with polished, Element Plus based demo workflows for alarm handling and application administration.

**Architecture:** Create two focused frontend feature modules, `features/alarms` and `features/applications`, each with deterministic local data, a single route view, and component tests that exercise the visible demo workflow. Route integration remains in `apps/web/src/router.ts`; no backend persistence is introduced in this slice.

**Tech Stack:** Vue 3, Vue Router, TypeScript, Element Plus, `@element-plus/icons-vue`, Vitest, `@vue/test-utils`.

---

## Scope Check

The approved spec intentionally combines two related management pages because they share the same visual reference and table-first interaction pattern. Keep them as two independent feature folders and two route views so either can later be replaced by API-backed data without changing the other.

## UI And Context Requirements

Before implementing, read these files with UTF-8 encoding:

```powershell
Get-Content -Path AGENTS.md -Encoding utf8
Get-Content -Path docs\superpowers\specs\2026-07-03-smart-education-ui-guidelines.md -Encoding utf8
Get-Content -Path docs\superpowers\specs\2026-07-03-alarm-application-management-design.md -Encoding utf8
Get-Content -Path apps\web\src\router.ts -Encoding utf8
```

Use `docs/superpowers/assets/alarm-application-management.png` as the visual hierarchy reference. Match density and table-first layout, not exact pixels.

## File Structure

- Create `apps/web/src/features/alarms/alarmData.ts`: alarm types, seed records, filter/status helpers, and status transition helper.
- Create `apps/web/src/features/alarms/alarmData.test.ts`: deterministic helper tests.
- Create `apps/web/src/features/alarms/AlarmManagementView.vue`: `/alarms` route view with filters, summary strip, table, detail drawer, recording placeholder, disposal timeline, and status actions.
- Create `apps/web/src/features/alarms/AlarmManagementView.test.ts`: component tests for rendering, filtering, drawer, query-param selection, and status transition.
- Create `apps/web/src/features/applications/applicationData.ts`: application types, seed records, filter helpers, validation helper, status helper, and draft factory.
- Create `apps/web/src/features/applications/applicationData.test.ts`: deterministic helper tests.
- Create `apps/web/src/features/applications/ApplicationCenterView.vue`: `/applications` route view with filters, table, add/edit drawer, role visibility controls, status toggle, and uninstall dialog.
- Create `apps/web/src/features/applications/ApplicationCenterView.test.ts`: component tests for rendering, filtering, add/edit, status toggle, and uninstall.
- Modify `apps/web/src/router.ts`: route `/alarms` and `/applications` to the new views.
- Modify `apps/web/src/smoke.test.ts` only if the smoke test has component-specific placeholder assumptions.
- Modify `README.md` only if route/demo flow documentation is missing these pages.

---

### Task 1: Alarm Data Model And Helpers

**Files:**
- Create: `apps/web/src/features/alarms/alarmData.ts`
- Create: `apps/web/src/features/alarms/alarmData.test.ts`

- [ ] **Step 1: Write failing alarm data tests**

Create `apps/web/src/features/alarms/alarmData.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  alarmSummary,
  applyAlarmFilters,
  createDisposalRecord,
  getNextAlarmStatus,
  seedAlarms,
  type AlarmFilters,
} from './alarmData'

describe('alarmData', () => {
  test('summarizes alarm status counts from seed records', () => {
    expect(alarmSummary(seedAlarms)).toEqual({
      total: 8,
      unhandled: 4,
      processing: 2,
      resolved: 2,
    })
  })

  test('filters alarms by keyword, status, trigger method, and date range', () => {
    const filters: AlarmFilters = {
      keyword: '101',
      status: '未处理',
      triggerMethod: 'AI识别',
      dateRange: ['2026-07-03 00:00:00', '2026-07-03 23:59:59'],
    }

    expect(applyAlarmFilters(seedAlarms, filters).map((alarm) => alarm.deviceIdentifier)).toEqual([
      'CAM-3-101-01',
    ])
  })

  test('returns all alarms when filters are empty', () => {
    expect(applyAlarmFilters(seedAlarms, {
      keyword: '',
      status: '全部',
      triggerMethod: '全部',
      dateRange: [],
    })).toHaveLength(seedAlarms.length)
  })

  test('moves alarm status through valid demo transitions', () => {
    expect(getNextAlarmStatus('未处理', 'processing')).toBe('处理中')
    expect(getNextAlarmStatus('未处理', 'resolved')).toBe('已处理')
    expect(getNextAlarmStatus('处理中', 'resolved')).toBe('已处理')
    expect(getNextAlarmStatus('已处理', 'processing')).toBe('已处理')
  })

  test('creates deterministic disposal records for status actions', () => {
    expect(createDisposalRecord('系统管理员', '标记为处理中', '已接收告警，正在确认现场情况。')).toMatchObject({
      operatorName: '系统管理员',
      action: '标记为处理中',
      note: '已接收告警，正在确认现场情况。',
      createdAt: '2026-07-03 10:32:00',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm --workspace apps/web run test -- alarmData
```

Expected: FAIL because `apps/web/src/features/alarms/alarmData.ts` does not exist.

- [ ] **Step 3: Create alarm data helpers**

Create `apps/web/src/features/alarms/alarmData.ts`:

```ts
export type AlarmStatus = '未处理' | '处理中' | '已处理'
export type AlarmStatusFilter = AlarmStatus | '全部'
export type TriggerMethodFilter = '全部' | 'AI识别' | '设备离线' | '阈值告警' | '刷卡失败' | '手动上报' | '移动侦测' | '市电异常'
export type AlarmAction = 'processing' | 'resolved'

export type DisposalRecord = {
  id: string
  operatorName: string
  action: string
  note: string
  createdAt: string
}

export type AlarmEvent = {
  id: string
  deviceIdentifier: string
  deviceName: string
  location: string
  responsibleName: string
  responsiblePhone: string
  triggerMethod: Exclude<TriggerMethodFilter, '全部'>
  eventType: string
  status: AlarmStatus
  reportedAt: string
  recordingDuration: string
  disposalRecords: DisposalRecord[]
}

export type AlarmFilters = {
  keyword: string
  status: AlarmStatusFilter
  triggerMethod: TriggerMethodFilter
  dateRange: string[]
}

export const defaultAlarmFilters: AlarmFilters = {
  keyword: '',
  status: '全部',
  triggerMethod: '全部',
  dateRange: [],
}

export const alarmStatusOptions: AlarmStatusFilter[] = ['全部', '未处理', '处理中', '已处理']
export const triggerMethodOptions: TriggerMethodFilter[] = ['全部', 'AI识别', '设备离线', '阈值告警', '刷卡失败', '手动上报', '移动侦测', '市电异常']

export const seedAlarms: AlarmEvent[] = [
  {
    id: 'alarm-blackboard-021',
    deviceIdentifier: 'HB-3F-021',
    deviceName: '三楼智慧黑板',
    location: '教学楼 3 楼 302 教室',
    responsibleName: '周老师',
    responsiblePhone: '138 0000 1201',
    triggerMethod: '设备离线',
    eventType: '黑板心跳中断',
    status: '未处理',
    reportedAt: '2026-07-03 10:28:12',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-blackboard-1',
        operatorName: '系统',
        action: '自动上报',
        note: '检测到设备连续 3 分钟未响应。',
        createdAt: '2026-07-03 10:28:12',
      },
    ],
  },
  {
    id: 'alarm-camera-101',
    deviceIdentifier: 'CAM-3-101-01',
    deviceName: '教室 1-101 摄像头',
    location: '教学楼 1 栋 101 教室',
    responsibleName: '李老师',
    responsiblePhone: '138 0000 1122',
    triggerMethod: 'AI识别',
    eventType: '人员摔倒',
    status: '未处理',
    reportedAt: '2026-07-03 10:21:35',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-camera-1',
        operatorName: '李老师',
        action: '收到告警',
        note: '正在确认现场情况。',
        createdAt: '2026-07-03 10:22:02',
      },
    ],
  },
  {
    id: 'alarm-dvr-201',
    deviceIdentifier: 'DVR-1-201-01',
    deviceName: '教学楼 1 栋 NVR',
    location: '弱电间',
    responsibleName: '王工',
    responsiblePhone: '138 0000 1188',
    triggerMethod: '设备离线',
    eventType: '录像服务异常',
    status: '处理中',
    reportedAt: '2026-07-03 10:18:12',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-dvr-1',
        operatorName: '王工',
        action: '远程排查',
        note: '已登录设备管理端，正在检查存储状态。',
        createdAt: '2026-07-03 10:20:18',
      },
    ],
  },
  {
    id: 'alarm-env-301',
    deviceIdentifier: 'ENV-2-301-02',
    deviceName: '3 楼温湿度传感器',
    location: '教学楼 2 栋 301 教室',
    responsibleName: '张老师',
    responsiblePhone: '138 0000 1311',
    triggerMethod: '阈值告警',
    eventType: '温度超阈值',
    status: '未处理',
    reportedAt: '2026-07-03 10:14:09',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-env-1',
        operatorName: '系统',
        action: '自动上报',
        note: '室内温度高于预警阈值。',
        createdAt: '2026-07-03 10:14:09',
      },
    ],
  },
  {
    id: 'alarm-access-001',
    deviceIdentifier: 'ACC-1-001-01',
    deviceName: '南门门禁控制器',
    location: '南门出入口',
    responsibleName: '赵老师',
    responsiblePhone: '138 0000 1518',
    triggerMethod: '刷卡失败',
    eventType: '门禁认证失败',
    status: '已处理',
    reportedAt: '2026-07-03 09:58:03',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-access-1',
        operatorName: '赵老师',
        action: '核验身份',
        note: '已核实为临时访客证件过期。',
        createdAt: '2026-07-03 10:01:33',
      },
      {
        id: 'record-access-2',
        operatorName: '赵老师',
        action: '标记为已处理',
        note: '已重新登记访客信息。',
        createdAt: '2026-07-03 10:08:46',
      },
    ],
  },
  {
    id: 'alarm-speaker-401',
    deviceIdentifier: 'SPK-2-401-01',
    deviceName: '教学楼 2 栋广播',
    location: '教学楼 2 栋 4 楼走廊',
    responsibleName: '陈老师',
    responsiblePhone: '138 0000 1602',
    triggerMethod: '手动上报',
    eventType: '广播无声',
    status: '处理中',
    reportedAt: '2026-07-03 09:45:22',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-speaker-1',
        operatorName: '陈老师',
        action: '现场排查',
        note: '已安排电教人员前往楼层检查线路。',
        createdAt: '2026-07-03 09:50:16',
      },
    ],
  },
  {
    id: 'alarm-ipc-202',
    deviceIdentifier: 'IPC-3-202-02',
    deviceName: '操场球机',
    location: '操场看台',
    responsibleName: '刘老师',
    responsiblePhone: '138 0000 1707',
    triggerMethod: '移动侦测',
    eventType: '异常进入',
    status: '未处理',
    reportedAt: '2026-07-03 09:31:47',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-ipc-1',
        operatorName: '系统',
        action: '自动上报',
        note: '检测到非开放时段进入操场区域。',
        createdAt: '2026-07-03 09:31:47',
      },
    ],
  },
  {
    id: 'alarm-ups-001',
    deviceIdentifier: 'UPS-1-001-01',
    deviceName: '机房 UPS',
    location: '信息中心机房',
    responsibleName: '王工',
    responsiblePhone: '138 0000 1188',
    triggerMethod: '市电异常',
    eventType: '电源切换',
    status: '已处理',
    reportedAt: '2026-07-03 08:55:33',
    recordingDuration: '0:15',
    disposalRecords: [
      {
        id: 'record-ups-1',
        operatorName: '王工',
        action: '电源恢复',
        note: '已确认市电恢复，UPS 状态正常。',
        createdAt: '2026-07-03 09:08:00',
      },
    ],
  },
]

export function alarmSummary(alarms: AlarmEvent[]) {
  return {
    total: alarms.length,
    unhandled: alarms.filter((alarm) => alarm.status === '未处理').length,
    processing: alarms.filter((alarm) => alarm.status === '处理中').length,
    resolved: alarms.filter((alarm) => alarm.status === '已处理').length,
  }
}

export function applyAlarmFilters(alarms: AlarmEvent[], filters: AlarmFilters): AlarmEvent[] {
  const keyword = filters.keyword.trim().toLowerCase()
  const [start, end] = filters.dateRange

  return alarms.filter((alarm) => {
    const matchesKeyword = keyword.length === 0 || [
      alarm.deviceIdentifier,
      alarm.deviceName,
      alarm.location,
      alarm.responsibleName,
    ].some((value) => value.toLowerCase().includes(keyword))
    const matchesStatus = filters.status === '全部' || alarm.status === filters.status
    const matchesTrigger = filters.triggerMethod === '全部' || alarm.triggerMethod === filters.triggerMethod
    const matchesStart = !start || alarm.reportedAt >= start
    const matchesEnd = !end || alarm.reportedAt <= end

    return matchesKeyword && matchesStatus && matchesTrigger && matchesStart && matchesEnd
  })
}

export function getNextAlarmStatus(currentStatus: AlarmStatus, action: AlarmAction): AlarmStatus {
  if (currentStatus === '已处理') return '已处理'
  if (action === 'resolved') return '已处理'
  if (currentStatus === '未处理' && action === 'processing') return '处理中'

  return currentStatus
}

export function createDisposalRecord(operatorName: string, action: string, note: string): DisposalRecord {
  return {
    id: `record-${Date.now()}`,
    operatorName,
    action,
    note,
    createdAt: '2026-07-03 10:32:00',
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm --workspace apps/web run test -- alarmData
```

Expected: PASS with 5 tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/web/src/features/alarms/alarmData.ts apps/web/src/features/alarms/alarmData.test.ts
git commit -m "feat: add alarm management data helpers"
```

---

### Task 2: Alarm Management View

**Files:**
- Create: `apps/web/src/features/alarms/AlarmManagementView.vue`
- Create: `apps/web/src/features/alarms/AlarmManagementView.test.ts`
- Modify: `apps/web/src/router.ts`

- [ ] **Step 1: Write failing alarm view tests**

Create `apps/web/src/features/alarms/AlarmManagementView.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test } from 'vitest'
import AlarmManagementView from './AlarmManagementView.vue'

async function mountAlarmView(route = '/alarms') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/alarms', component: AlarmManagementView }],
  })
  await router.push(route)
  await router.isReady()

  return mount(AlarmManagementView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: {
        teleport: true,
      },
    },
  })
}

describe('AlarmManagementView', () => {
  test('renders summary, filters, and required table columns', async () => {
    const wrapper = await mountAlarmView()

    expect(wrapper.text()).toContain('告警管理')
    expect(wrapper.text()).toContain('告警总数')
    expect(wrapper.text()).toContain('设备编号/名称/位置')
    expect(wrapper.text()).toContain('设备标识符')
    expect(wrapper.text()).toContain('设备名称')
    expect(wrapper.text()).toContain('发生位置')
    expect(wrapper.text()).toContain('通知人/责任人')
    expect(wrapper.text()).toContain('触发方式')
    expect(wrapper.text()).toContain('事件状态')
    expect(wrapper.text()).toContain('上报时间')
    expect(wrapper.text()).toContain('HB-3F-021')
  })

  test('filters alarms by keyword and resets the table', async () => {
    const wrapper = await mountAlarmView()

    await wrapper.find('[data-testid="alarm-keyword-input"] input').setValue('UPS')
    await wrapper.find('[data-testid="alarm-search-button"]').trigger('click')

    expect(wrapper.text()).toContain('UPS-1-001-01')
    expect(wrapper.text()).not.toContain('HB-3F-021')

    await wrapper.find('[data-testid="alarm-reset-button"]').trigger('click')

    expect(wrapper.text()).toContain('UPS-1-001-01')
    expect(wrapper.text()).toContain('HB-3F-021')
  })

  test('opens detail drawer from row action and updates status', async () => {
    const wrapper = await mountAlarmView()

    await wrapper.find('[data-testid="alarm-view-HB-3F-021"]').trigger('click')

    expect(wrapper.text()).toContain('告警详情')
    expect(wrapper.text()).toContain('138 0000 1201')
    expect(wrapper.text()).toContain('0:00 / 0:15')
    expect(wrapper.text()).toContain('处理记录')

    await wrapper.find('[data-testid="alarm-mark-processing"]').trigger('click')

    expect(wrapper.text()).toContain('标记为处理中')
    expect(wrapper.text()).toContain('已接收告警，正在确认现场情况。')
  })

  test('opens matching alarm detail from device query parameter', async () => {
    const wrapper = await mountAlarmView('/alarms?device=CAM-3-101-01')

    expect(wrapper.text()).toContain('告警详情')
    expect(wrapper.text()).toContain('CAM-3-101-01')
    expect(wrapper.text()).toContain('人员摔倒')
  })
})
```

- [ ] **Step 2: Run alarm view tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- AlarmManagementView
```

Expected: FAIL because `AlarmManagementView.vue` does not exist.

- [ ] **Step 3: Implement `AlarmManagementView.vue`**

Create a Vue component with these exact behavior points:

```vue
<script setup lang="ts">
import { Bell, Refresh, Search, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  alarmStatusOptions,
  alarmSummary,
  applyAlarmFilters,
  createDisposalRecord,
  defaultAlarmFilters,
  getNextAlarmStatus,
  seedAlarms,
  triggerMethodOptions,
  type AlarmAction,
  type AlarmEvent,
  type AlarmStatus,
} from './alarmData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const route = useRoute()
const alarms = ref<AlarmEvent[]>(seedAlarms.map((alarm) => ({
  ...alarm,
  disposalRecords: alarm.disposalRecords.map((record) => ({ ...record })),
})))
const filters = reactive({ ...defaultAlarmFilters })
const selectedAlarmId = ref<string | null>(null)
const detailVisible = ref(false)

const statusTagTypes: Record<AlarmStatus, TagType> = {
  未处理: 'danger',
  处理中: 'warning',
  已处理: 'success',
}

const filteredAlarms = computed(() => applyAlarmFilters(alarms.value, filters))
const summary = computed(() => alarmSummary(alarms.value))
const selectedAlarm = computed(() => alarms.value.find((alarm) => alarm.id === selectedAlarmId.value) ?? null)

function getStatusTagType(status: AlarmStatus): TagType {
  return statusTagTypes[status]
}

function searchAlarms() {
  selectedAlarmId.value = null
}

function resetFilters() {
  Object.assign(filters, { ...defaultAlarmFilters, dateRange: [] })
}

function openAlarm(alarm: AlarmEvent) {
  selectedAlarmId.value = alarm.id
  detailVisible.value = true
}

function applyStatusAction(action: AlarmAction) {
  if (!selectedAlarm.value) return

  const nextStatus = getNextAlarmStatus(selectedAlarm.value.status, action)
  if (nextStatus === selectedAlarm.value.status) return

  const record = action === 'processing'
    ? createDisposalRecord('系统管理员', '标记为处理中', '已接收告警，正在确认现场情况。')
    : createDisposalRecord('系统管理员', '标记为已处理', '已通知责任人完成处置，事件结束。')

  selectedAlarm.value.status = nextStatus
  selectedAlarm.value.disposalRecords.push(record)
}

function syncQueryDevice() {
  const device = typeof route.query.device === 'string' ? route.query.device : ''
  if (!device) return

  const matchedAlarm = alarms.value.find((alarm) => alarm.deviceIdentifier === device)
  if (matchedAlarm) {
    openAlarm(matchedAlarm)
  }
}

watch(() => route.query.device, () => {
  void nextTick(syncQueryDevice)
}, { immediate: true })
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
      <ElButton :icon="Refresh" @click="resetFilters">刷新列表</ElButton>
    </header>

    <section class="alarm-management__summary" aria-label="告警统计">
      <ElCard shadow="never"><span>告警总数</span><strong>{{ summary.total }}</strong></ElCard>
      <ElCard shadow="never"><span>未处理</span><strong>{{ summary.unhandled }}</strong></ElCard>
      <ElCard shadow="never"><span>处理中</span><strong>{{ summary.processing }}</strong></ElCard>
      <ElCard shadow="never"><span>已处理</span><strong>{{ summary.resolved }}</strong></ElCard>
    </section>

    <ElCard shadow="never" class="alarm-management__panel">
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
            <ElButton data-testid="alarm-reset-button" @click="resetFilters">重置</ElButton>
            <ElButton data-testid="alarm-search-button" type="primary" :icon="Search" @click="searchAlarms">查询</ElButton>
          </ElButtonGroup>
        </ElFormItem>
      </ElForm>

      <ElTable v-if="filteredAlarms.length > 0" :data="filteredAlarms" size="small" class="alarm-management__table">
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
            <ElButton link type="primary" size="small" :data-testid="`alarm-view-${row.deviceIdentifier}`" @click="openAlarm(row)">
              查看
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前筛选条件下暂无告警">
        <ElButton @click="resetFilters">重置筛选</ElButton>
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
          <h2>事件录音</h2>
          <div class="alarm-management__audio">
            <ElButton :icon="VideoPlay" circle aria-label="播放录音占位" />
            <span>0:00 / {{ selectedAlarm.recordingDuration }}</span>
            <div class="alarm-management__audio-bar"><span /></div>
            <ElIcon><Bell /></ElIcon>
          </div>
        </section>

        <section>
          <h2>处理记录</h2>
          <ElTimeline>
            <ElTimelineItem v-for="record in selectedAlarm.disposalRecords" :key="record.id" :timestamp="record.createdAt">
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
          <ElButton :icon="WarningFilled">误报反馈</ElButton>
        </footer>
      </div>
    </ElDrawer>
  </main>
</template>
```

Add scoped CSS following the overview pattern:

```css
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
  --el-table-header-bg-color: #f8fafc;
  font-size: 12px;
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
  background: #d8e2f3;
}

.alarm-management__audio-bar span {
  display: block;
  width: 58%;
  height: 100%;
  background: var(--color-text);
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
```

- [ ] **Step 4: Route `/alarms` to the new view**

Modify `apps/web/src/router.ts` shell children:

```ts
{ path: 'applications', component: () => import('./features/overview/OverviewView.vue') },
{ path: 'alarms', component: () => import('./features/alarms/AlarmManagementView.vue') },
```

- [ ] **Step 5: Run alarm tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- alarmData AlarmManagementView router smoke
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add apps/web/src/features/alarms apps/web/src/router.ts
git commit -m "feat: add alarm management page"
```

---

### Task 3: Application Data Model And Helpers

**Files:**
- Create: `apps/web/src/features/applications/applicationData.ts`
- Create: `apps/web/src/features/applications/applicationData.test.ts`

- [ ] **Step 1: Write failing application data tests**

Create `apps/web/src/features/applications/applicationData.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import {
  applicationSummary,
  applyApplicationFilters,
  createApplicationDraft,
  seedApplications,
  validateApplicationDraft,
  type ApplicationDraft,
  type ApplicationFilters,
} from './applicationData'

describe('applicationData', () => {
  test('summarizes platform and enabled counts', () => {
    expect(applicationSummary(seedApplications)).toEqual({
      total: 8,
      web: 5,
      mobile: 3,
      enabled: 6,
    })
  })

  test('filters applications by keyword, category, platform, status, and role visibility', () => {
    const filters: ApplicationFilters = {
      keyword: '巡检',
      category: '管理工具',
      platform: '移动端',
      status: '已启用',
      visibleRole: '电教主任',
    }

    expect(applyApplicationFilters(seedApplications, filters).map((app) => app.name)).toEqual(['移动巡检'])
  })

  test('returns default draft values for adding an application', () => {
    expect(createApplicationDraft()).toMatchObject({
      name: '',
      category: '管理工具',
      platform: '网页端',
      url: '',
      packageId: '',
      icon: 'notice',
      visibleRoles: ['全员'],
      status: '已启用',
    })
  })

  test('requires url for web apps and package id for mobile apps', () => {
    const webDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '测试应用',
      platform: '网页端',
      url: '',
    }
    const mobileDraft: ApplicationDraft = {
      ...createApplicationDraft(),
      name: '移动应用',
      platform: '移动端',
      packageId: '',
    }

    expect(validateApplicationDraft(webDraft)).toContain('网页端应用需要填写访问地址')
    expect(validateApplicationDraft(mobileDraft)).toContain('移动端应用需要填写包标识')
  })
})
```

- [ ] **Step 2: Run application data tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- applicationData
```

Expected: FAIL because `applicationData.ts` does not exist.

- [ ] **Step 3: Create application data helpers**

Create `apps/web/src/features/applications/applicationData.ts`:

```ts
export type ApplicationCategory = '教学工具' | '管理工具' | '数据看板' | '移动服务'
export type ApplicationPlatform = '网页端' | '移动端'
export type ApplicationStatus = '已启用' | '已停用' | '已卸载'
export type ApplicationStatusFilter = ApplicationStatus | '全部'
export type ApplicationPlatformFilter = ApplicationPlatform | '全部'
export type ApplicationCategoryFilter = ApplicationCategory | '全部'
export type VisibleRoleFilter = VisibleRole | '全部'
export type VisibleRole = '全员' | '电教主任' | '德育主任' | '教研主任'
export type ApplicationIcon = 'notice' | 'shield' | 'approval' | 'energy' | 'message' | 'resource' | 'dashboard' | 'blackboard'

export type ManagedApplication = {
  id: string
  name: string
  category: ApplicationCategory
  platform: ApplicationPlatform
  url: string
  packageId: string
  icon: ApplicationIcon
  visibleRoles: VisibleRole[]
  status: ApplicationStatus
  sortOrder: number
}

export type ApplicationDraft = Omit<ManagedApplication, 'id' | 'sortOrder'>

export type ApplicationFilters = {
  keyword: string
  category: ApplicationCategoryFilter
  platform: ApplicationPlatformFilter
  status: ApplicationStatusFilter
  visibleRole: VisibleRoleFilter
}

export const applicationCategories: ApplicationCategoryFilter[] = ['全部', '教学工具', '管理工具', '数据看板', '移动服务']
export const applicationPlatforms: ApplicationPlatformFilter[] = ['全部', '网页端', '移动端']
export const applicationStatuses: ApplicationStatusFilter[] = ['全部', '已启用', '已停用', '已卸载']
export const visibleRoles: VisibleRole[] = ['全员', '电教主任', '德育主任', '教研主任']
export const visibleRoleFilters: VisibleRoleFilter[] = ['全部', ...visibleRoles]

export const defaultApplicationFilters: ApplicationFilters = {
  keyword: '',
  category: '全部',
  platform: '全部',
  status: '全部',
  visibleRole: '全部',
}

export const seedApplications: ManagedApplication[] = [
  {
    id: 'app-notice',
    name: '校园通知发布系统',
    category: '管理工具',
    platform: '网页端',
    url: 'https://demo.school.local/notice',
    packageId: '',
    icon: 'notice',
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 1,
  },
  {
    id: 'app-inspection',
    name: '移动巡检',
    category: '管理工具',
    platform: '移动端',
    url: '',
    packageId: 'com.school.inspection',
    icon: 'shield',
    visibleRoles: ['电教主任'],
    status: '已启用',
    sortOrder: 2,
  },
  {
    id: 'app-leave',
    name: '学生请假审批',
    category: '移动服务',
    platform: '网页端',
    url: 'https://demo.school.local/leave',
    packageId: '',
    icon: 'approval',
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 3,
  },
  {
    id: 'app-energy',
    name: '能耗管理平台',
    category: '数据看板',
    platform: '网页端',
    url: 'https://demo.school.local/energy',
    packageId: '',
    icon: 'energy',
    visibleRoles: ['电教主任'],
    status: '已停用',
    sortOrder: 4,
  },
  {
    id: 'app-family',
    name: '家校沟通助手',
    category: '移动服务',
    platform: '移动端',
    url: '',
    packageId: 'com.school.family',
    icon: 'message',
    visibleRoles: ['全员', '德育主任'],
    status: '已启用',
    sortOrder: 5,
  },
  {
    id: 'app-resource',
    name: '教研资源库',
    category: '教学工具',
    platform: '网页端',
    url: 'https://demo.school.local/resources',
    packageId: '',
    icon: 'resource',
    visibleRoles: ['教研主任'],
    status: '已启用',
    sortOrder: 6,
  },
  {
    id: 'app-governance',
    name: '教育治理看板',
    category: '数据看板',
    platform: '网页端',
    url: 'https://demo.school.local/governance',
    packageId: '',
    icon: 'dashboard',
    visibleRoles: ['全员', '电教主任', '德育主任', '教研主任'],
    status: '已启用',
    sortOrder: 7,
  },
  {
    id: 'app-blackboard',
    name: '智慧黑板工具',
    category: '教学工具',
    platform: '移动端',
    url: '',
    packageId: 'com.school.blackboard',
    icon: 'blackboard',
    visibleRoles: ['全员', '教研主任'],
    status: '已停用',
    sortOrder: 8,
  },
]

export function createApplicationDraft(): ApplicationDraft {
  return {
    name: '',
    category: '管理工具',
    platform: '网页端',
    url: '',
    packageId: '',
    icon: 'notice',
    visibleRoles: ['全员'],
    status: '已启用',
  }
}

export function applicationSummary(applications: ManagedApplication[]) {
  return {
    total: applications.length,
    web: applications.filter((app) => app.platform === '网页端').length,
    mobile: applications.filter((app) => app.platform === '移动端').length,
    enabled: applications.filter((app) => app.status === '已启用').length,
  }
}

export function applyApplicationFilters(applications: ManagedApplication[], filters: ApplicationFilters): ManagedApplication[] {
  const keyword = filters.keyword.trim().toLowerCase()

  return applications.filter((app) => {
    const matchesKeyword = keyword.length === 0 || app.name.toLowerCase().includes(keyword)
    const matchesCategory = filters.category === '全部' || app.category === filters.category
    const matchesPlatform = filters.platform === '全部' || app.platform === filters.platform
    const matchesStatus = filters.status === '全部' || app.status === filters.status
    const matchesRole = filters.visibleRole === '全部' || app.visibleRoles.includes(filters.visibleRole)

    return matchesKeyword && matchesCategory && matchesPlatform && matchesStatus && matchesRole
  })
}

export function validateApplicationDraft(draft: ApplicationDraft): string[] {
  const errors: string[] = []

  if (!draft.name.trim()) errors.push('应用名称不能为空')
  if (!draft.category) errors.push('应用分类不能为空')
  if (draft.visibleRoles.length === 0) errors.push('至少选择一个可见角色')
  if (draft.platform === '网页端' && !draft.url.trim()) errors.push('网页端应用需要填写访问地址')
  if (draft.platform === '移动端' && !draft.packageId.trim()) errors.push('移动端应用需要填写包标识')

  return errors
}
```

- [ ] **Step 4: Run application data tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- applicationData
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add apps/web/src/features/applications/applicationData.ts apps/web/src/features/applications/applicationData.test.ts
git commit -m "feat: add application center data helpers"
```

---

### Task 4: Application Center View

**Files:**
- Create: `apps/web/src/features/applications/ApplicationCenterView.vue`
- Create: `apps/web/src/features/applications/ApplicationCenterView.test.ts`
- Modify: `apps/web/src/router.ts`

- [ ] **Step 1: Write failing application view tests**

Create `apps/web/src/features/applications/ApplicationCenterView.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
import ApplicationCenterView from './ApplicationCenterView.vue'

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
  }
})

async function mountApplicationView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/applications', component: ApplicationCenterView }],
  })
  await router.push('/applications')
  await router.isReady()

  return mount(ApplicationCenterView, {
    global: {
      plugins: [ElementPlus, router],
      stubs: {
        teleport: true,
      },
    },
  })
}

describe('ApplicationCenterView', () => {
  test('renders summary, filters, and required table columns', async () => {
    const wrapper = await mountApplicationView()

    expect(wrapper.text()).toContain('应用中心')
    expect(wrapper.text()).toContain('应用总数')
    expect(wrapper.text()).toContain('应用名称')
    expect(wrapper.text()).toContain('应用分类')
    expect(wrapper.text()).toContain('端类型')
    expect(wrapper.text()).toContain('访问地址 / 包标识')
    expect(wrapper.text()).toContain('可见范围')
    expect(wrapper.text()).toContain('校园通知发布系统')
  })

  test('filters applications by keyword and resets the table', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.find('[data-testid="application-keyword-input"] input').setValue('巡检')
    await wrapper.find('[data-testid="application-search-button"]').trigger('click')

    expect(wrapper.text()).toContain('移动巡检')
    expect(wrapper.text()).not.toContain('校园通知发布系统')

    await wrapper.find('[data-testid="application-reset-button"]').trigger('click')

    expect(wrapper.text()).toContain('移动巡检')
    expect(wrapper.text()).toContain('校园通知发布系统')
  })

  test('adds a valid web application from the drawer', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.find('[data-testid="application-add-button"]').trigger('click')
    await wrapper.find('[data-testid="application-name-input"] input').setValue('访客预约系统')
    await wrapper.find('[data-testid="application-url-input"] input').setValue('https://demo.school.local/visitor')
    await wrapper.find('[data-testid="application-save-button"]').trigger('click')

    expect(wrapper.text()).toContain('访客预约系统')
  })

  test('edits application status and uninstalls an application', async () => {
    const wrapper = await mountApplicationView()

    await wrapper.find('[data-testid="application-toggle-app-energy"]').trigger('click')
    expect(wrapper.text()).toContain('已启用')

    await wrapper.find('[data-testid="application-uninstall-app-blackboard"]').trigger('click')
    expect(wrapper.text()).toContain('已卸载')
  })
})
```

- [ ] **Step 2: Run application view tests and verify they fail**

Run:

```powershell
npm --workspace apps/web run test -- ApplicationCenterView
```

Expected: FAIL because `ApplicationCenterView.vue` does not exist.

- [ ] **Step 3: Implement `ApplicationCenterView.vue`**

Create a Vue component with these exact behavior points:

```vue
<script setup lang="ts">
import { Collection, Edit, Link, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import {
  applicationCategories,
  applicationPlatforms,
  applicationStatuses,
  applicationSummary,
  applyApplicationFilters,
  createApplicationDraft,
  defaultApplicationFilters,
  seedApplications,
  validateApplicationDraft,
  visibleRoleFilters,
  visibleRoles,
  type ApplicationDraft,
  type ApplicationStatus,
  type ManagedApplication,
} from './applicationData'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const applications = ref<ManagedApplication[]>(seedApplications.map((app) => ({ ...app, visibleRoles: [...app.visibleRoles] })))
const filters = reactive({ ...defaultApplicationFilters })
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive<ApplicationDraft>(createApplicationDraft())

const statusTagTypes: Record<ApplicationStatus, TagType> = {
  已启用: 'success',
  已停用: 'info',
  已卸载: 'warning',
}

const filteredApplications = computed(() => applyApplicationFilters(applications.value, filters))
const summary = computed(() => applicationSummary(applications.value))
const drawerTitle = computed(() => editingId.value ? '编辑应用' : '添加应用')

function getStatusTagType(status: ApplicationStatus): TagType {
  return statusTagTypes[status]
}

function resetFilters() {
  Object.assign(filters, { ...defaultApplicationFilters })
}

function openAddDrawer() {
  Object.assign(draft, createApplicationDraft())
  editingId.value = null
  drawerVisible.value = true
}

function openEditDrawer(app: ManagedApplication) {
  Object.assign(draft, {
    name: app.name,
    category: app.category,
    platform: app.platform,
    url: app.url,
    packageId: app.packageId,
    icon: app.icon,
    visibleRoles: [...app.visibleRoles],
    status: app.status === '已卸载' ? '已停用' : app.status,
  })
  editingId.value = app.id
  drawerVisible.value = true
}

function saveApplication() {
  const errors = validateApplicationDraft(draft)
  if (errors.length > 0) {
    ElMessage.error(errors[0])
    return
  }

  if (editingId.value) {
    const target = applications.value.find((app) => app.id === editingId.value)
    if (target) {
      Object.assign(target, { ...draft, visibleRoles: [...draft.visibleRoles] })
    }
  } else {
    applications.value.push({
      id: `app-${Date.now()}`,
      ...draft,
      visibleRoles: [...draft.visibleRoles],
      sortOrder: applications.value.length + 1,
    })
  }

  drawerVisible.value = false
}

function toggleStatus(app: ManagedApplication) {
  if (app.status === '已卸载') return
  app.status = app.status === '已启用' ? '已停用' : '已启用'
}

async function uninstallApplication(app: ManagedApplication) {
  await ElMessageBox.confirm(`确认卸载 ${app.name}？`, '卸载应用', {
    confirmButtonText: '卸载',
    cancelButtonText: '取消',
    type: 'warning',
  })
  app.status = '已卸载'
}

function launchApplication(app: ManagedApplication) {
  if (app.platform === '网页端' && app.url) {
    window.open(app.url, '_blank', 'noopener,noreferrer')
  }
}
</script>
```

Template requirements:

```vue
<template>
  <main class="application-center">
    <header class="application-center__header">
      <div>
        <div class="application-center__eyebrow">
          <ElTag size="small" effect="plain">应用中心</ElTag>
          <ElTag type="success" size="small" effect="plain">网页端 / 移动端</ElTag>
        </div>
        <h1>应用中心</h1>
        <p>统一管理网页端与移动端应用，配置分类、可见范围与启停状态。</p>
      </div>
      <ElButton data-testid="application-add-button" type="primary" :icon="Plus" @click="openAddDrawer">
        添加应用
      </ElButton>
    </header>

    <section class="application-center__summary" aria-label="应用统计">
      <ElCard shadow="never"><span>应用总数</span><strong>{{ summary.total }}</strong></ElCard>
      <ElCard shadow="never"><span>网页端</span><strong>{{ summary.web }}</strong></ElCard>
      <ElCard shadow="never"><span>移动端</span><strong>{{ summary.mobile }}</strong></ElCard>
      <ElCard shadow="never"><span>已启用</span><strong>{{ summary.enabled }}</strong></ElCard>
    </section>

    <ElCard shadow="never" class="application-center__panel">
      <ElForm class="application-center__filters" label-position="top">
        <ElFormItem label="应用名称">
          <ElInput
            v-model="filters.keyword"
            data-testid="application-keyword-input"
            placeholder="请输入应用名称"
            clearable
            :prefix-icon="Search"
          />
        </ElFormItem>
        <ElFormItem label="应用分类">
          <ElSelect v-model="filters.category">
            <ElOption v-for="category in applicationCategories" :key="category" :label="category" :value="category" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="端类型">
          <ElSelect v-model="filters.platform">
            <ElOption v-for="platform in applicationPlatforms" :key="platform" :label="platform" :value="platform" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="filters.status">
            <ElOption v-for="status in applicationStatuses" :key="status" :label="status" :value="status" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="可见范围">
          <ElSelect v-model="filters.visibleRole">
            <ElOption v-for="role in visibleRoleFilters" :key="role" :label="role" :value="role" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作">
          <ElButtonGroup>
            <ElButton data-testid="application-reset-button" :icon="Refresh" @click="resetFilters">重置</ElButton>
            <ElButton data-testid="application-search-button" type="primary" :icon="Search">查询</ElButton>
          </ElButtonGroup>
        </ElFormItem>
      </ElForm>

      <ElTable v-if="filteredApplications.length > 0" :data="filteredApplications" size="small" class="application-center__table">
        <ElTableColumn label="应用名称" min-width="170">
          <template #default="{ row }">
            <div class="application-center__app-cell">
              <ElIcon><Collection /></ElIcon>
              <strong>{{ row.name }}</strong>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="category" label="应用分类" width="104" />
        <ElTableColumn prop="platform" label="端类型" width="92" />
        <ElTableColumn label="访问地址 / 包标识" min-width="210">
          <template #default="{ row }">
            <span :title="row.platform === '网页端' ? row.url : row.packageId">
              {{ row.platform === '网页端' ? row.url : row.packageId }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="可见范围" min-width="170">
          <template #default="{ row }">
            <div class="application-center__role-tags">
              <ElTag v-for="role in row.visibleRoles" :key="role" size="small" effect="plain">{{ role }}</ElTag>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="92">
          <template #default="{ row }">
            <ElTag :type="getStatusTagType(row.status)" size="small" effect="plain">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" :icon="Edit" size="small" @click="openEditDrawer(row)">编辑</ElButton>
            <ElButton
              link
              type="primary"
              size="small"
              :disabled="row.status === '已卸载'"
              :data-testid="`application-toggle-${row.id}`"
              @click="toggleStatus(row)"
            >
              {{ row.status === '已启用' ? '停用' : '启用' }}
            </ElButton>
            <ElButton
              link
              type="danger"
              size="small"
              :disabled="row.status === '已卸载'"
              :data-testid="`application-uninstall-${row.id}`"
              @click="uninstallApplication(row)"
            >
              卸载
            </ElButton>
            <ElButton link type="primary" :icon="Link" size="small" :disabled="row.platform !== '网页端'" @click="launchApplication(row)">
              打开
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="当前筛选条件下暂无应用">
        <ElButton @click="resetFilters">重置筛选</ElButton>
      </ElEmpty>
    </ElCard>

    <ElDrawer v-model="drawerVisible" :title="drawerTitle" size="520px">
      <ElForm class="application-center__drawer-form" label-position="top">
        <ElFormItem label="应用名称" required>
          <ElInput v-model="draft.name" data-testid="application-name-input" placeholder="请输入应用名称" />
        </ElFormItem>
        <ElFormItem label="应用分类" required>
          <ElSelect v-model="draft.category">
            <ElOption v-for="category in applicationCategories.filter((item) => item !== '全部')" :key="category" :label="category" :value="category" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="端类型" required>
          <ElRadioGroup v-model="draft.platform">
            <ElRadioButton label="网页端" />
            <ElRadioButton label="移动端" />
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="draft.platform === '网页端'" label="访问地址" required>
          <ElInput v-model="draft.url" data-testid="application-url-input" placeholder="https://demo.school.local/app" />
        </ElFormItem>
        <ElFormItem v-else label="包标识" required>
          <ElInput v-model="draft.packageId" data-testid="application-package-input" placeholder="com.school.app" />
        </ElFormItem>
        <ElFormItem label="可见范围" required>
          <ElCheckboxGroup v-model="draft.visibleRoles">
            <ElCheckbox v-for="role in visibleRoles" :key="role" :label="role" />
          </ElCheckboxGroup>
        </ElFormItem>
        <ElFormItem label="启用状态">
          <ElSwitch v-model="draft.status" active-value="已启用" inactive-value="已停用" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="drawerVisible = false">取消</ElButton>
        <ElButton data-testid="application-save-button" type="primary" @click="saveApplication">保存</ElButton>
      </template>
    </ElDrawer>
  </main>
</template>
```

Add scoped CSS mirroring the alarm view:

```css
.application-center {
  display: grid;
  gap: 16px;
  color: var(--color-text);
}

.application-center__header,
.application-center__eyebrow,
.application-center__app-cell,
.application-center__role-tags {
  display: flex;
  align-items: center;
  gap: 10px;
}

.application-center__header {
  justify-content: space-between;
}

.application-center__header h1,
.application-center__header p {
  margin: 0;
}

.application-center__header h1 {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 900;
}

.application-center__header p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.application-center__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.application-center__summary :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
}

.application-center__summary span {
  color: var(--color-text-muted);
  font-size: 12px;
}

.application-center__summary strong {
  font-size: 26px;
  font-weight: 900;
}

.application-center__panel :deep(.el-card__body) {
  display: grid;
  gap: 14px;
  padding: 14px;
}

.application-center__filters {
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(130px, 0.7fr) minmax(120px, 0.6fr) minmax(120px, 0.6fr) minmax(140px, 0.7fr) auto;
  gap: 12px;
  align-items: end;
}

.application-center__filters :deep(.el-form-item) {
  margin-bottom: 0;
}

.application-center__table {
  --el-table-header-bg-color: #f8fafc;
  font-size: 12px;
}

.application-center__app-cell {
  min-width: 0;
}

.application-center__app-cell strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-center__role-tags {
  flex-wrap: wrap;
  gap: 4px;
}

.application-center__drawer-form {
  display: grid;
  gap: 4px;
}

@media (max-width: 1180px) {
  .application-center__filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .application-center__header {
    align-items: stretch;
    flex-direction: column;
  }

  .application-center__summary,
  .application-center__filters {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Route `/applications` to the new view**

Modify `apps/web/src/router.ts` shell children:

```ts
{ path: 'applications', component: () => import('./features/applications/ApplicationCenterView.vue') },
{ path: 'alarms', component: () => import('./features/alarms/AlarmManagementView.vue') },
```

- [ ] **Step 5: Run application tests and verify they pass**

Run:

```powershell
npm --workspace apps/web run test -- applicationData ApplicationCenterView router smoke
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add apps/web/src/features/applications apps/web/src/router.ts
git commit -m "feat: add application center page"
```

---

### Task 5: Route, Documentation, And Regression Verification

**Files:**
- Modify: `apps/web/src/router.ts`
- Modify: `README.md` only if its route/demo flow summary is stale.
- Modify: tests only when they assert placeholder behavior.

- [ ] **Step 1: Add focused route assertions if missing**

Inspect `apps/web/src/router.test.ts` and `apps/web/src/smoke.test.ts`.

Run:

```powershell
Get-Content -Path apps\web\src\router.test.ts -Encoding utf8
Get-Content -Path apps\web\src\smoke.test.ts -Encoding utf8
```

If there is no route-path smoke coverage for `/applications` and `/alarms`, add this expectation to the existing smoke test:

```ts
expect(routePaths).toEqual(expect.arrayContaining([
  '/applications',
  '/alarms',
]))
```

- [ ] **Step 2: Run focused tests**

Run:

```powershell
npm --workspace apps/web run test -- alarmData AlarmManagementView applicationData ApplicationCenterView router smoke
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```powershell
npm run test
```

Expected: PASS for shared, web, and api suites.

- [ ] **Step 4: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Run build**

Run:

```powershell
npm run build
```

Expected: PASS. Existing Vite large chunk and VueUse comment warnings are acceptable if unchanged.

- [ ] **Step 6: Visual QA in the browser**

Start or reuse the dev server on port 5174:

```powershell
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://localhost:5174/login
```

Login:

```text
admin / Admin@123
```

Inspect:

- `/alarms` at 1366 x 768.
- `/alarms?device=HB-3F-021` opens detail drawer.
- Alarm filters produce and reset filtered rows.
- Alarm status actions update drawer and table state.
- `/applications` at 1366 x 768.
- Application add drawer saves a valid web app.
- Application filters produce and reset filtered rows.
- Application enable/disable and uninstall controls update visible state.

Visual acceptance:

- No obvious text overlap.
- Tables remain readable at 1366 x 768.
- Drawer forms fit without broken labels.
- No card-inside-card layout.
- Standard controls are Element Plus.

- [ ] **Step 7: Commit route/doc/test fixes if needed**

If Step 1 through Step 6 required additional fixes:

```powershell
git add apps/web/src/router.ts apps/web/src/smoke.test.ts apps/web/src/router.test.ts README.md
git commit -m "fix: stabilize alarm and application routes"
```

If no changes were required, do not create an empty commit.

---

## Self-Review

- Spec coverage: Tasks 1 and 2 cover alarm list fields, filters, detail drawer, responsible phone, recording placeholder, disposal records, query-param deep link, and status transitions. Tasks 3 and 4 cover application records, filters, add/edit, category, platform, role visibility, enable/disable, and uninstall. Task 5 covers routes, regression checks, and visual QA.
- Placeholder scan: This plan contains no unresolved work markers or vague implementation steps. The only demo placeholder is the alarm recording control, which the approved spec explicitly requires as a non-real audio UI.
- Type consistency: Alarm types use `AlarmStatus`, `TriggerMethodFilter`, `AlarmFilters`, and `AlarmEvent` consistently across helper and component tasks. Application types use `ManagedApplication`, `ApplicationDraft`, and `ApplicationFilters` consistently across helper and component tasks.
- Scope control: Backend persistence and real device/app integrations are intentionally excluded, matching the approved phase-one demo scope.
