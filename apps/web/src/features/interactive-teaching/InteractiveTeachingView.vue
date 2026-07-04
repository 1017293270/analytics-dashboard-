<script setup lang="ts">
import {
  Camera,
  DataBoard,
  Monitor,
  Pointer,
  UserFilled,
  VideoCameraFilled,
} from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import {
  insertScreenshot,
  launchAnswerQuestion,
  recordStudentAnswer,
  seedTeachingSession,
  selectLiveLayout,
  setMemberRole,
  toggleDesktopShare,
  toggleTeacherFocus,
  toggleWhiteboardShare,
  type TeachingLayout,
  type TeachingMemberRole,
  type TeachingSession,
} from './teachingSession'

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

const session = ref<TeachingSession>(cloneSession(seedTeachingSession))

const roleTagTypes: Record<TeachingMemberRole, TagType> = {
  主讲人: 'primary',
  授课老师: 'success',
  学生: 'info',
}

const layoutOptions: TeachingLayout[] = ['宫格', '主讲', '桌面优先', '白板优先']

const answeredMemberNames = computed(() => {
  if (!session.value.activeQuestion) return []

  return session.value.activeQuestion.answers
    .map((answer) => session.value.members.find((member) => member.id === answer.memberId)?.name)
    .filter((name): name is string => Boolean(name))
})

const answerStats = computed(() => {
  const question = session.value.activeQuestion
  if (!question) return []

  return question.options.map((option) => ({
    ...option,
    count: question.answers.filter((answer) => answer.optionId === option.id).length,
  }))
})

const stageLayoutClass = computed(() => ({
  'is-layout-grid': session.value.layout === '宫格',
  'is-layout-speaker': session.value.layout === '主讲',
  'is-layout-desktop': session.value.layout === '桌面优先',
  'is-layout-whiteboard': session.value.layout === '白板优先',
}))

function cloneSession(source: TeachingSession): TeachingSession {
  return {
    ...source,
    members: source.members.map((member) => ({ ...member })),
    screenshots: source.screenshots.map((screenshot) => ({ ...screenshot })),
    activeQuestion: source.activeQuestion
      ? {
          ...source.activeQuestion,
          options: source.activeQuestion.options.map((option) => ({ ...option })),
          answers: source.activeQuestion.answers.map((answer) => ({ ...answer })),
        }
      : null,
  }
}

function updateSession(nextSession: TeachingSession) {
  session.value = nextSession
}

function setRole(memberId: string, role: TeachingMemberRole) {
  updateSession(setMemberRole(session.value, memberId, role))
}

function shareWhiteboard() {
  updateSession(toggleWhiteboardShare(session.value))
}

function shareDesktop() {
  updateSession(toggleDesktopShare(session.value))
}

function captureScreenshot() {
  const source = session.value.desktopShare === '共享中' ? '桌面' : '白板'
  updateSession(insertScreenshot(session.value, '2026-07-09T09:30:00.000Z', source))
}

function launchResponder() {
  const launched = launchAnswerQuestion(session.value, {
    id: 'question-keyword',
    title: '这节课的关键词是什么？',
    options: [
      { id: 'a', label: '分数' },
      { id: 'b', label: '几何' },
      { id: 'c', label: '比例' },
    ],
  })
  const chenAnswered = recordStudentAnswer(launched, 'member-student-chen', 'a')
  updateSession(recordStudentAnswer(chenAnswered, 'member-student-wang', 'b'))
}

function selectLayout(layout: TeachingLayout) {
  updateSession(selectLiveLayout(session.value, layout))
}

function selectLayoutFromControl(value: string | number | boolean) {
  if (typeof value !== 'string') return
  if (!layoutOptions.includes(value as TeachingLayout)) return

  selectLayout(value as TeachingLayout)
}

function toggleFocus() {
  updateSession(toggleTeacherFocus(session.value))
}
</script>

<template>
  <main class="interactive-teaching" style="container-type: inline-size">
    <header class="interactive-teaching__header">
      <div>
        <p class="interactive-teaching__eyebrow">交互智能平板 ♦27</p>
        <h1>互动教学</h1>
        <p>现场演示用课堂协同模拟：角色切换、远程共享、截屏插入、答题器与布局控制。</p>
      </div>
      <ElTag type="success" effect="light" round>可演示</ElTag>
    </header>

    <section class="interactive-teaching__grid interactive-teaching__grid--responsive" aria-label="互动教学演示工作区">
      <ElCard shadow="never" class="interactive-teaching__panel">
        <template #header>
          <div class="interactive-teaching__panel-title">
            <span>课堂成员</span>
            <ElTag type="info" effect="plain">{{ session.members.length }} 人在线</ElTag>
          </div>
        </template>

        <div class="interactive-teaching__member-list">
          <div
            v-for="member in session.members"
            :key="member.id"
            class="interactive-teaching__member-row"
            :data-testid="`member-row-${member.id}`"
          >
            <span class="interactive-teaching__member-avatar">
              <ElIcon><UserFilled /></ElIcon>
            </span>
            <div class="interactive-teaching__member-info">
              <strong>{{ member.name }}</strong>
              <small>
                <span v-if="member.muted">静音</span>
                <span v-else-if="member.weakNetwork">网络弱</span>
                <span v-else>在线</span>
              </small>
            </div>
            <ElTag :type="roleTagTypes[member.role]" size="small" effect="light" round>
              {{ member.role }}
            </ElTag>
            <div class="interactive-teaching__member-actions">
              <ElButton
                size="small"
                plain
                :disabled="member.role === '授课老师'"
                :data-testid="`set-teacher-${member.id}`"
                @click="setRole(member.id, '授课老师')"
              >
                设为授课老师
              </ElButton>
              <ElButton
                size="small"
                plain
                :disabled="member.role === '学生'"
                :data-testid="`set-student-${member.id}`"
                @click="setRole(member.id, '学生')"
              >
                设为学生
              </ElButton>
            </div>
          </div>
        </div>
      </ElCard>

      <section class="interactive-teaching__stage-panel">
        <div class="interactive-teaching__stage-toolbar">
          <div>
            <strong>课堂舞台</strong>
            <span>当前布局：{{ session.layout }}</span>
          </div>
          <ElTag v-if="session.teacherFocus" type="warning" effect="light" round>教师发言聚焦中</ElTag>
          <ElTag v-else type="info" effect="plain" round>常规显示</ElTag>
        </div>

        <div class="interactive-teaching__stage" :class="stageLayoutClass" data-testid="teaching-stage">
          <div class="interactive-teaching__stage-main">
            <ElIcon><DataBoard /></ElIcon>
            <strong v-if="session.whiteboardShare === '共享中'">远程白板共享中</strong>
            <strong v-else>远程白板待共享</strong>
            <span>{{ session.layout }}</span>
          </div>
          <div class="interactive-teaching__stage-side">
            <div>
              <ElIcon><Monitor /></ElIcon>
              <strong v-if="session.desktopShare === '共享中'">电脑桌面共享中</strong>
              <strong v-else>电脑桌面待共享</strong>
            </div>
            <div
              class="interactive-teaching__teacher-video"
              :class="{ 'is-focused': session.teacherFocus }"
              data-testid="teacher-video-tile"
            >
              <ElIcon><VideoCameraFilled /></ElIcon>
              <strong>{{ session.teacherFocus ? '教师发言放大显示' : '教师画面常规显示' }}</strong>
            </div>
          </div>
        </div>

        <div class="interactive-teaching__layout-controls" role="group" aria-label="布局控制">
          <ElRadioGroup :model-value="session.layout" @change="selectLayoutFromControl">
            <ElRadioButton
              v-for="layout in layoutOptions"
              :key="layout"
              :value="layout"
              :data-testid="layout === '白板优先' ? 'teaching-layout-whiteboard' : undefined"
              @click="selectLayout(layout)"
            >
              {{ layout }}
            </ElRadioButton>
          </ElRadioGroup>
        </div>
      </section>

      <ElCard shadow="never" class="interactive-teaching__panel">
        <template #header>
          <div class="interactive-teaching__panel-title">
            <span>演示控制</span>
            <ElTag type="success" effect="plain">模拟课堂</ElTag>
          </div>
        </template>

        <div class="interactive-teaching__control-grid">
          <ElButton type="primary" :icon="DataBoard" data-testid="teaching-whiteboard-share" @click="shareWhiteboard">
            共享远程白板
          </ElButton>
          <ElButton :icon="Monitor" data-testid="teaching-desktop-share" @click="shareDesktop">
            共享电脑桌面
          </ElButton>
          <ElButton :icon="Camera" data-testid="teaching-insert-screenshot" @click="captureScreenshot">
            截屏插入
          </ElButton>
          <ElButton :icon="Pointer" data-testid="teaching-answer-launch" @click="launchResponder">
            答题器
          </ElButton>
        </div>

        <div class="interactive-teaching__focus-row">
          <span>教师发言时放大显示</span>
          <ElSwitch
            :model-value="session.teacherFocus"
            data-testid="teaching-focus-toggle"
            @change="toggleFocus"
          />
        </div>

        <section class="interactive-teaching__subsection">
          <h2>截图记录</h2>
          <div data-testid="teaching-screenshot-list" class="interactive-teaching__screenshot-list">
            <div
              v-for="(screenshot, index) in session.screenshots"
              :key="screenshot.id"
              class="interactive-teaching__record-row"
            >
              <span>截图 {{ index + 1 }}</span>
              <ElTag size="small" effect="plain">{{ screenshot.source }}</ElTag>
            </div>
            <ElEmpty v-if="session.screenshots.length === 0" description="暂无截图" :image-size="48" />
          </div>
        </section>

        <section class="interactive-teaching__subsection" data-testid="teaching-answer-panel">
          <h2>答题器</h2>
          <template v-if="session.activeQuestion">
            <strong>{{ session.activeQuestion.title }}</strong>
            <p>已作答 {{ session.activeQuestion.answers.length }} 人：{{ answeredMemberNames.join('、') }}</p>
            <div class="interactive-teaching__answer-stats">
              <div v-for="option in answerStats" :key="option.id" class="interactive-teaching__record-row">
                <span>{{ option.label }}</span>
                <ElProgress :percentage="option.count * 50" :format="() => `${option.count} 人`" />
              </div>
            </div>
          </template>
          <ElEmpty v-else description="点击答题器启动课堂作答" :image-size="48" />
        </section>
      </ElCard>
    </section>
  </main>
</template>

<style scoped>
.interactive-teaching {
  display: grid;
  gap: var(--space-4);
  max-width: var(--content-max);
  margin: 0 auto;
  color: var(--color-text);
}

.interactive-teaching__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.interactive-teaching__header h1 {
  margin: 0;
  font-size: var(--fs-display);
  font-weight: var(--fw-black);
  line-height: var(--lh-tight);
}

.interactive-teaching__header p {
  margin: 4px 0 0;
  max-width: 680px;
  color: var(--color-text-muted);
  font-size: var(--fs-subtitle);
}

.interactive-teaching__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
}

.interactive-teaching__grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.95fr) minmax(460px, 1.3fr) minmax(340px, 0.95fr);
  gap: var(--space-3);
  align-items: start;
}

.interactive-teaching__panel,
.interactive-teaching__stage-panel {
  min-width: 0;
  border-radius: var(--radius-panel);
}

.interactive-teaching__stage-panel {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  background: var(--color-panel);
  box-shadow: var(--shadow-sm);
}

.interactive-teaching__panel-title,
.interactive-teaching__stage-toolbar,
.interactive-teaching__member-row,
.interactive-teaching__focus-row,
.interactive-teaching__record-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.interactive-teaching__panel-title,
.interactive-teaching__stage-toolbar,
.interactive-teaching__focus-row {
  justify-content: space-between;
}

.interactive-teaching__panel-title,
.interactive-teaching__stage-toolbar strong {
  font-weight: var(--fw-black);
}

.interactive-teaching__stage-toolbar div {
  display: grid;
  gap: 3px;
}

.interactive-teaching__stage-toolbar span,
.interactive-teaching__member-info small,
.interactive-teaching__subsection p {
  color: var(--color-text-muted);
  font-size: var(--fs-label);
}

.interactive-teaching__member-list,
.interactive-teaching__control-grid,
.interactive-teaching__screenshot-list,
.interactive-teaching__answer-stats {
  display: grid;
  gap: var(--space-2);
}

.interactive-teaching__member-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.interactive-teaching__member-row:last-child {
  border-bottom: 0;
}

.interactive-teaching__member-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  color: var(--color-accent);
}

.interactive-teaching__member-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.interactive-teaching__member-info strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: var(--fw-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.interactive-teaching__member-actions {
  grid-column: 2 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}

.interactive-teaching__stage {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(180px, 0.65fr);
  gap: var(--space-3);
  min-height: 390px;
}

.interactive-teaching__stage.is-layout-speaker {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.9fr);
}

.interactive-teaching__stage.is-layout-desktop {
  grid-template-columns: minmax(220px, 0.75fr) minmax(0, 1.25fr);
}

.interactive-teaching__stage.is-layout-desktop .interactive-teaching__stage-main {
  order: 2;
}

.interactive-teaching__stage.is-layout-desktop .interactive-teaching__stage-side {
  order: 1;
}

.interactive-teaching__stage.is-layout-whiteboard {
  grid-template-columns: minmax(0, 1.7fr) minmax(170px, 0.5fr);
}

.interactive-teaching__stage.is-layout-whiteboard .interactive-teaching__stage-main {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}

.interactive-teaching__stage-main,
.interactive-teaching__stage-side > div {
  display: grid;
  place-items: center;
  gap: var(--space-2);
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  text-align: center;
}

.interactive-teaching__stage-main {
  min-height: 390px;
  padding: var(--space-4);
}

.interactive-teaching__stage-main :deep(.el-icon) {
  color: var(--color-accent);
  font-size: 42px;
}

.interactive-teaching__stage-main strong {
  font-size: 22px;
  font-weight: var(--fw-black);
}

.interactive-teaching__stage-side {
  display: grid;
  gap: var(--space-3);
}

.interactive-teaching__stage-side > div {
  padding: var(--space-3);
}

.interactive-teaching__teacher-video.is-focused {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
  box-shadow: var(--shadow-lift);
}

.interactive-teaching__stage.is-layout-speaker .interactive-teaching__teacher-video {
  min-height: 180px;
}

.interactive-teaching__stage-side :deep(.el-icon) {
  color: var(--color-text-muted);
  font-size: 24px;
}

.interactive-teaching__layout-controls {
  display: flex;
  justify-content: center;
}

.interactive-teaching__control-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.interactive-teaching__focus-row {
  margin: var(--space-3) 0;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  font-size: var(--fs-label);
  font-weight: var(--fw-bold);
}

.interactive-teaching__subsection {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.interactive-teaching__subsection h2 {
  margin: 0;
  font-size: var(--fs-title);
  font-weight: var(--fw-black);
}

.interactive-teaching__subsection p {
  margin: 0;
}

.interactive-teaching__record-row {
  justify-content: space-between;
  min-height: 34px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  font-size: var(--fs-label);
}

.interactive-teaching__record-row :deep(.el-progress) {
  flex: 1;
  min-width: 120px;
}

@container (max-width: 1240px) {
  .interactive-teaching__grid,
  .interactive-teaching__stage {
    grid-template-columns: 1fr;
  }

  .interactive-teaching__stage.is-layout-desktop .interactive-teaching__stage-main,
  .interactive-teaching__stage.is-layout-desktop .interactive-teaching__stage-side {
    order: initial;
  }
}

@media (max-width: 720px) {
  .interactive-teaching__header {
    align-items: stretch;
    flex-direction: column;
  }

  .interactive-teaching__control-grid {
    grid-template-columns: 1fr;
  }
}
</style>
