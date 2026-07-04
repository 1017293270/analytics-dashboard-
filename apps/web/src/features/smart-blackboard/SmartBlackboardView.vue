<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CircleCheck, MagicStick, Plus, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  activityTypeLabels,
  cloneBlackboardActivityDraft,
  createCompletedBlackboardActivity,
  demoTranscriptText,
  parseBlackboardActivity,
  validateBlackboardActivity,
  type BlackboardActivityDraft,
  type BlackboardActivityType,
  type CompletedBlackboardActivity,
} from './blackboardActivity'

const sourceMode = ref<'text' | 'video'>('text')
const requestedType = ref<BlackboardActivityType>('cloze')
const sourceText = ref('中国古代四大发明包括造纸术、印刷术、火药和____。A. 指南针 B. 地动仪 C. 浑天仪 答案：A')
const transcriptText = ref(demoTranscriptText)
const removeFillers = ref(true)
const parseError = ref('')
const completionNotice = ref('')
const completedActivities = ref<CompletedBlackboardActivity[]>([])

const draft = reactive<BlackboardActivityDraft>(
  parseBlackboardActivity({
    sourceText: sourceText.value,
    requestedType: requestedType.value,
    removeFillers: removeFillers.value,
  }),
)

const selectedSourceText = computed(() => (sourceMode.value === 'video' ? transcriptText.value : sourceText.value))
const validationErrors = computed(() => validateBlackboardActivity(draft))
const previewOptions = computed(() => draft.options.filter((option) => option.text.trim()))

function assignDraft(nextDraft: BlackboardActivityDraft) {
  Object.assign(draft, nextDraft)
}

function buildDraftForType(type: BlackboardActivityType) {
  return parseBlackboardActivity({
    sourceText: selectedSourceText.value,
    requestedType: type,
    removeFillers: removeFillers.value,
  })
}

function setType(type: BlackboardActivityType) {
  if (type === requestedType.value) return

  requestedType.value = type
  assignDraft(buildDraftForType(type))
}

function parseActivity() {
  parseError.value = ''
  completionNotice.value = ''
  if (!selectedSourceText.value.trim()) {
    parseError.value = '请输入文本后再解析'
    return
  }

  assignDraft(buildDraftForType(requestedType.value))
}

function updateCorrectOption(optionId: string | number | boolean) {
  const nextOptionId = String(optionId)
  draft.correctOptionId = nextOptionId
  draft.judgementAnswer = nextOptionId === 'option-true'
}

function getNextOptionLabel() {
  const maxOptionIndex = draft.options.reduce((maxIndex, option) => {
    const optionIndex = option.label.charCodeAt(0) - 65
    return Number.isFinite(optionIndex) ? Math.max(maxIndex, optionIndex) : maxIndex
  }, -1)

  return String.fromCharCode(65 + maxOptionIndex + 1)
}

function addOption() {
  const label = getNextOptionLabel()
  draft.options.push({
    id: `option-${label.toLowerCase()}`,
    label,
    text: `选项${label}`,
  })
  if (!draft.correctOptionId) draft.correctOptionId = draft.options[0]?.id ?? ''
}

function removeOption(optionId: string) {
  if (draft.options.length <= 2) return

  const nextOptions = draft.options.filter((option) => option.id !== optionId)
  draft.options.splice(0, draft.options.length, ...nextOptions)
  if (draft.correctOptionId === optionId) draft.correctOptionId = draft.options[0]?.id ?? ''
}

function getCompletionTime(index: number) {
  const totalMinutes = 10 * 60 + 40 + index
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60

  return `2026-07-09 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function completeActivity() {
  parseError.value = ''

  try {
    const completedActivity = createCompletedBlackboardActivity(draft, {
      id: `activity-${completedActivities.value.length + 1}`,
      sourceMode: sourceMode.value,
      completedAt: getCompletionTime(completedActivities.value.length),
    })
    completedActivities.value.unshift(completedActivity)
    completionNotice.value = `已完成 ${completedActivities.value.length} 个课堂活动，可在活动记录中再次查看。`
    ElMessage.success('课堂活动已完成')
  } catch (error) {
    const message = error instanceof Error ? error.message : '课堂活动校验失败'
    parseError.value = message
    ElMessage.error(message)
  }
}

function openCompletedActivity(activity: CompletedBlackboardActivity) {
  sourceMode.value = activity.sourceMode
  requestedType.value = activity.type
  removeFillers.value = activity.draft.removeFillers
  parseError.value = ''
  if (activity.sourceMode === 'video') {
    transcriptText.value = activity.draft.sourceText
  } else {
    sourceText.value = activity.draft.sourceText
  }
  assignDraft(cloneBlackboardActivityDraft(activity.draft))
  completionNotice.value = `已载入活动：${activity.title}`
}
</script>

<template>
  <main class="smart-blackboard">
    <header class="smart-blackboard__header">
      <div>
        <p class="smart-blackboard__eyebrow">智慧黑板</p>
        <h1>课堂活动制作</h1>
        <p>输入课堂文本，一键生成选词填空、判断对错和趣味选择活动。</p>
      </div>
      <ElButton
        data-testid="blackboard-complete-button"
        type="primary"
        :icon="CircleCheck"
        :disabled="validationErrors.length > 0"
        @click="completeActivity"
      >
        完成制作
      </ElButton>
    </header>

    <ElAlert
      v-if="completionNotice"
      data-testid="blackboard-completion-notice"
      type="success"
      :closable="false"
      :title="completionNotice"
      show-icon
    />

    <section class="smart-blackboard__grid" aria-label="智慧黑板活动制作">
      <ElCard shadow="never" class="smart-blackboard__panel">
        <template #header>
          <div class="smart-blackboard__panel-title">
            <span>来源内容</span>
            <ElTag type="info" effect="plain">演示解析</ElTag>
          </div>
        </template>

        <ElTabs v-model="sourceMode">
          <ElTabPane name="text">
            <template #label>
              <span class="smart-blackboard__tab-proxy" data-testid="blackboard-tab-text">文本输入</span>
            </template>
            <ElInput
              v-model="sourceText"
              aria-label="课堂文本"
              data-testid="blackboard-source-input"
              type="textarea"
              :rows="9"
              resize="none"
              placeholder="输入题干、选项和答案，例如：A. 指南针 B. 地动仪 答案：A"
            />
          </ElTabPane>

          <ElTabPane name="video">
            <template #label>
              <span class="smart-blackboard__tab-proxy" data-testid="blackboard-tab-video">视频转写</span>
            </template>
            <div class="smart-blackboard__video-placeholder">
              <ElIcon><VideoCamera /></ElIcon>
              <strong>视频声音转文字</strong>
              <span>演示环境展示转写结果，不接入真实视频处理。</span>
            </div>
            <label class="smart-blackboard__field-label" for="blackboard-transcript">转写结果预览</label>
            <ElInput
              id="blackboard-transcript"
              v-model="transcriptText"
              type="textarea"
              :rows="5"
              resize="none"
            />
            <ElTag class="smart-blackboard__video-tag" type="info" effect="plain">
              视频片段同步删除：暂未启用
            </ElTag>
          </ElTabPane>
        </ElTabs>

        <div class="smart-blackboard__source-actions">
          <ElSwitch
            v-model="removeFillers"
            data-testid="blackboard-remove-fillers-switch"
            active-text="删除语气词"
          />
          <ElButton type="primary" :icon="MagicStick" data-testid="blackboard-parse-button" @click="parseActivity">
            一键解析
          </ElButton>
        </div>
        <ElAlert v-if="parseError" type="error" :closable="false" :title="parseError" show-icon />
      </ElCard>

      <ElCard shadow="never" class="smart-blackboard__panel">
        <template #header>
          <div class="smart-blackboard__panel-title">
            <span>活动编辑</span>
            <ElTag type="success" effect="plain">{{ activityTypeLabels[draft.type] }}</ElTag>
          </div>
        </template>

        <ElRadioGroup v-model="requestedType" class="smart-blackboard__type-group" @change="setType">
          <ElRadioButton value="cloze" data-testid="blackboard-type-cloze" @click="setType('cloze')">
            选词填空
          </ElRadioButton>
          <ElRadioButton value="judgement" data-testid="blackboard-type-judgement" @click="setType('judgement')">
            判断对错
          </ElRadioButton>
          <ElRadioButton value="choice" data-testid="blackboard-type-choice" @click="setType('choice')">
            趣味选择
          </ElRadioButton>
        </ElRadioGroup>

        <ElForm label-position="top" class="smart-blackboard__form">
          <ElFormItem label="题干">
            <ElInput v-model="draft.stem" data-testid="blackboard-stem-input" type="textarea" :rows="4" resize="none" />
          </ElFormItem>

          <template v-if="draft.type === 'judgement'">
            <ElFormItem label="判断答案">
              <ElRadioGroup v-model="draft.correctOptionId" @change="updateCorrectOption">
                <ElRadioButton value="option-true">正确</ElRadioButton>
                <ElRadioButton value="option-false">错误</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
          </template>

          <template v-else>
            <ElFormItem label="选项与正确答案">
              <div class="smart-blackboard__options">
                <div
                  v-for="option in draft.options"
                  :key="option.id"
                  class="smart-blackboard__option-row"
                  :data-testid="`blackboard-option-row-${option.id}`"
                  :data-option-id="option.id"
                >
                  <ElRadio v-model="draft.correctOptionId" :value="option.id">{{ option.label }}</ElRadio>
                  <ElInput v-model="option.text" :aria-label="`选项 ${option.label} 内容`" />
                  <ElButton
                    :data-testid="`blackboard-remove-${option.id}`"
                    text
                    type="danger"
                    :disabled="draft.options.length <= 2"
                    @click="removeOption(option.id)"
                  >
                    删除
                  </ElButton>
                </div>
              </div>
              <ElButton :icon="Plus" data-testid="blackboard-add-option" plain @click="addOption">添加选项</ElButton>
            </ElFormItem>
          </template>
        </ElForm>

        <div class="smart-blackboard__notes">
          <ElTag v-for="note in draft.parseNotes" :key="note" type="warning" effect="plain">{{ note }}</ElTag>
          <ElTag v-for="error in validationErrors" :key="error" type="danger" effect="plain">{{ error }}</ElTag>
        </div>
      </ElCard>

      <ElCard shadow="never" class="smart-blackboard__panel smart-blackboard__preview-panel">
        <template #header>
          <div class="smart-blackboard__panel-title">
            <span>黑板预览</span>
            <ElTag effect="dark">课堂展示</ElTag>
          </div>
        </template>
        <div class="smart-blackboard__preview" data-testid="blackboard-preview">
          <div v-if="draft.stem" class="smart-blackboard__board">
            <ElTag effect="dark">{{ activityTypeLabels[draft.type] }}</ElTag>
            <h2>{{ draft.stem }}</h2>
            <div class="smart-blackboard__answer-grid">
              <div
                v-for="option in previewOptions"
                :key="option.id"
                class="smart-blackboard__answer-chip"
                :class="{ 'is-correct': option.id === draft.correctOptionId }"
              >
                <strong>{{ option.label }}</strong>
                <span>{{ option.text }}</span>
                <small v-if="option.id === draft.correctOptionId">正确答案</small>
              </div>
            </div>
            <footer>未来实验学校 · 智慧黑板演示</footer>
          </div>
          <ElEmpty v-else description="输入内容并点击一键解析后预览课堂活动" :image-size="64" />
        </div>
      </ElCard>
    </section>

    <ElCard shadow="never" class="smart-blackboard__records" data-testid="blackboard-completed-list">
      <template #header>
        <div class="smart-blackboard__panel-title">
          <span>活动记录</span>
          <ElTag type="success" effect="plain">已完成 {{ completedActivities.length }}</ElTag>
        </div>
      </template>

      <ElTable v-if="completedActivities.length > 0" :data="completedActivities" class="smart-blackboard__records-table">
        <ElTableColumn prop="typeLabel" label="活动类型" width="112" />
        <ElTableColumn prop="title" label="活动名称" min-width="260" show-overflow-tooltip />
        <ElTableColumn prop="correctAnswerText" label="正确答案" min-width="140" />
        <ElTableColumn prop="sourceLabel" label="来源" width="104" />
        <ElTableColumn prop="completedAt" label="完成时间" width="142" />
        <ElTableColumn label="状态" width="96">
          <template #default="{ row }">
            <ElTag type="success" effect="plain">{{ row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="92" fixed="right">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              size="small"
              :data-testid="`blackboard-open-activity-${row.id}`"
              @click="openCompletedActivity(row)"
            >
              查看
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElEmpty v-else description="完成制作后将在这里生成课堂活动记录" :image-size="64" />
    </ElCard>
  </main>
</template>

<style scoped>
.smart-blackboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--color-text);
}

.smart-blackboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.smart-blackboard__header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
}

.smart-blackboard__header p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

.smart-blackboard__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 800;
}

.smart-blackboard__grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.95fr) minmax(360px, 1.1fr) minmax(340px, 1fr);
  gap: 14px;
  align-items: stretch;
}

.smart-blackboard__panel {
  min-width: 0;
  border-radius: var(--radius-panel);
}

.smart-blackboard__panel-title,
.smart-blackboard__source-actions,
.smart-blackboard__option-row,
.smart-blackboard__notes {
  display: flex;
  align-items: center;
  gap: 10px;
}

.smart-blackboard__panel-title {
  justify-content: space-between;
  font-weight: 900;
}

.smart-blackboard__tab-proxy {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.smart-blackboard__field-label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 800;
}

.smart-blackboard__video-placeholder {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  padding: 18px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-muted);
  color: var(--color-text-muted);
  text-align: center;
}

.smart-blackboard__video-placeholder :deep(.el-icon) {
  justify-self: center;
  color: var(--color-accent);
  font-size: 26px;
}

.smart-blackboard__video-placeholder strong {
  color: var(--color-text);
}

.smart-blackboard__video-tag {
  margin-top: 10px;
}

.smart-blackboard__source-actions {
  justify-content: space-between;
  margin-top: 12px;
}

.smart-blackboard__type-group {
  margin-bottom: 14px;
}

.smart-blackboard__form {
  display: grid;
  gap: 8px;
}

.smart-blackboard__options {
  display: grid;
  gap: 8px;
  width: 100%;
}

.smart-blackboard__option-row {
  width: 100%;
}

.smart-blackboard__option-row :deep(.el-input) {
  flex: 1;
}

.smart-blackboard__notes {
  flex-wrap: wrap;
  min-height: 28px;
}

.smart-blackboard__preview {
  min-height: 520px;
}

.smart-blackboard__records {
  border-radius: var(--radius-panel);
}

.smart-blackboard__records-table {
  --el-table-header-bg-color: var(--color-panel-muted);
}

.smart-blackboard__board {
  display: flex;
  min-height: 520px;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border: 10px solid #334155;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 32%),
    #12312a;
  color: #f8fafc;
}

.smart-blackboard__board h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.55;
}

.smart-blackboard__answer-grid {
  display: grid;
  gap: 12px;
}

.smart-blackboard__answer-chip {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(248, 250, 252, 0.24);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.28);
}

.smart-blackboard__answer-chip.is-correct {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.16);
}

.smart-blackboard__answer-chip strong {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 50%;
  background: rgba(248, 250, 252, 0.14);
}

.smart-blackboard__answer-chip small {
  color: #86efac;
  font-weight: 900;
}

.smart-blackboard__board footer {
  margin-top: auto;
  color: rgba(248, 250, 252, 0.68);
  font-size: 13px;
}

@media (max-width: 1180px) {
  .smart-blackboard__grid {
    grid-template-columns: 1fr;
  }
}
</style>
