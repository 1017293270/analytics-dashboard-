import { expect, test, type Locator, type Page } from '@playwright/test'

const WORKBENCH_AVAILABILITY_STORAGE_KEY = 'analytics-dashboard.workbench-availability.v1'

const demoNavLabels = ['首页总览', '工作台配置', '数据看板', '应用中心', '告警管理', '智慧黑板', '互动教学', '账号与角色']

function collectLocalBrowserErrors(page: Page) {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []

  page.on('pageerror', (error) => {
    if (error.message.includes("Failed to read the 'localStorage' property from 'Window'")) return

    pageErrors.push(error.message)
  })

  page.on('console', (message) => {
    if (message.type() !== 'error') return

    const locationUrl = message.location().url
    const text = message.text()
    const isLocalSource =
      locationUrl.includes('localhost') ||
      locationUrl.includes('127.0.0.1') ||
      (!locationUrl && !text.includes('demo.school.local'))

    if (isLocalSource) consoleErrors.push(text)
  })

  return { pageErrors, consoleErrors }
}

async function loginAsAdmin(page: Page, redirect = '/overview') {
  await page.addInitScript((storageKey) => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Cross-origin demo iframes can deny storage access; only same-origin storage matters for this gate.
    }

    try {
      window.sessionStorage.removeItem(storageKey)
    } catch {
      // Cross-origin demo iframes can deny storage access; only same-origin storage matters for this gate.
    }
  }, WORKBENCH_AVAILABILITY_STORAGE_KEY)

  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await page.locator('input[name="username"]').fill('admin')
  await page.locator('input[name="password"]').fill('Admin@123')
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(new RegExp(`${redirect.replace('/', '\\/')}$`))
  await expect(page.getByText('系统管理员').first()).toBeVisible()
}

async function gotoRoute(page: Page, route: string, visibleText: string) {
  await page.goto(route)
  await expect(page.getByText(visibleText).first()).toBeVisible()
}

async function expectMetricCard(card: Locator, value: string) {
  await expect(card).toBeVisible()
  await expect(card).toContainText(value)
}

test('passes the July 9 smart education demo route gates', async ({ page }) => {
  await loginAsAdmin(page)
  const browserErrors = collectLocalBrowserErrors(page)

  const sidebar = page.getByRole('navigation', { name: '智慧教育主导航' })
  await expect(sidebar).toBeVisible()
  for (const label of demoNavLabels) {
    await expect(sidebar.getByText(label, { exact: true })).toBeVisible()
  }
  await expect(sidebar.getByText('账号权限')).toHaveCount(0)
  await expect(sidebar.getByText('系统设置')).toHaveCount(0)
  await expect(sidebar.getByText('账号与角色', { exact: true })).toBeVisible()

  await expectMetricCard(page.locator('.overview__kpi-card').filter({ hasText: '未处理告警' }), '4')
  await expectMetricCard(page.locator('.overview__kpi-card').filter({ hasText: '今日上报' }), '8 条')
  await expectMetricCard(page.locator('.overview__kpi-card').filter({ hasText: '角色工作台' }), '4')
  await expectMetricCard(page.locator('.overview__kpi-card').filter({ hasText: '演示应用' }), '8')
  await expect(page.getByText('2 个第三方嵌入看板接入')).toBeVisible()
  await expect(page.getByText('42ms')).toHaveCount(0)
  await expect(page.getByText('第三方看板延迟')).toHaveCount(0)

  await gotoRoute(page, '/accounts', '账号与角色')
  await page.getByTestId('accounts-reset-button').click()
  await expectMetricCard(page.locator('section[aria-label="账号统计"] .el-card').filter({ hasText: '账号总数' }), '5')
  await expectMetricCard(page.locator('section[aria-label="账号统计"] .el-card').filter({ hasText: '启用账号' }), '5')
  await expectMetricCard(page.locator('section[aria-label="账号统计"] .el-card').filter({ hasText: '角色数量' }), '5')
  await expect(page.getByText('admin').first()).toBeVisible()
  await expect(page.getByText('electro_director').first()).toBeVisible()
  await expect(page.getByText('research_director').first()).toBeVisible()
  await page.getByTestId('account-preview-role-select').click()
  await page.getByRole('option', { name: '电教主任' }).click()
  await expect(page.getByTestId('account-visible-menu-list')).toContainText('应用中心')
  await expect(page.getByTestId('account-visible-menu-list')).toContainText('告警管理')
  await expect(page.getByTestId('account-visible-workbench-list')).toContainText('电教主任工作台')
  await page.getByTestId('account-toggle-user-research-director').click()
  await expect(page.getByTestId('account-status-user-research-director')).toContainText('已停用')
  await page.getByTestId('accounts-reset-button').click()
  await expect(page.getByTestId('account-status-user-research-director')).toContainText('已启用')

  await gotoRoute(page, '/workbenches', '大屏库')
  await expect(page.getByText('全员工作台')).toBeVisible()
  await expect(page.getByText('电教主任工作台')).toBeVisible()
  await expect(page.getByText('德育主任工作台')).toBeVisible()
  await expect(page.getByText('教研主任工作台')).toBeVisible()
  await expect(page.getByTestId('toggle-workbench-availability-dashboard-electro')).toContainText('停用')

  await gotoRoute(page, '/workbenches/dashboard-electro', '构建模块')
  await expect(page.getByLabel('大屏名称')).toHaveValue('电教主任工作台')
  await expect(page.getByLabel('组件库')).toBeVisible()
  expect(await page.locator('[data-testid^="add-"]').count()).toBeGreaterThanOrEqual(30)
  await page.getByTestId('add-third-party-web').click()
  await expect(page.getByLabel('第三方链接')).toHaveValue('https://demo.school.local/alarm-bi')

  await gotoRoute(page, '/data-dashboards', '数据看板')
  await expectMetricCard(page.locator('section[aria-label="数据看板统计"] .el-card').filter({ hasText: '看板总数' }), '6')
  await expect(page.getByText('教育治理').first()).toBeVisible()
  await expect(page.getByText('教师发展').first()).toBeVisible()
  await expect(page.getByText('学生成长').first()).toBeVisible()
  await page.getByTestId('dashboard-preview-dashboard-alarm').click()
  await expect(page.getByLabel('第三方链接')).toHaveValue('https://demo.school.local/alarm-bi')
  await expect(page.getByTestId('dashboard-embed-metrics')).toContainText('今日告警')
  await expect(page.getByTestId('dashboard-embed-metrics')).toContainText('8')
  await expect(page.getByTestId('dashboard-embed-metrics')).toContainText('未处理 4')

  await gotoRoute(page, '/applications', '应用中心')
  await expectMetricCard(page.locator('section[aria-label="应用统计"] .el-card').filter({ hasText: '应用总数' }), '8')
  await expectMetricCard(page.locator('section[aria-label="应用统计"] .el-card').filter({ hasText: '网页端' }), '5')
  await expectMetricCard(page.locator('section[aria-label="应用统计"] .el-card').filter({ hasText: '移动端' }), '3')
  await expectMetricCard(page.locator('section[aria-label="应用统计"] .el-card').filter({ hasText: '已启用' }), '6')
  await expect(page.getByTestId('application-edit-app-resource')).toBeVisible()
  await expect(page.getByTestId('application-toggle-app-energy')).toBeVisible()
  await expect(page.getByTestId('application-uninstall-app-blackboard')).toBeVisible()

  await gotoRoute(page, '/alarms', '告警管理')
  await page.getByPlaceholder('请输入设备编号/名称/位置').fill('HB-3F-021')
  await page.getByTestId('alarm-search-button').click()
  await expect(page.getByText('HB-3F-021')).toBeVisible()
  await page.getByTestId('alarm-view-HB-3F-021').click()
  await expect(page.getByText('责任人电话')).toBeVisible()
  await expect(page.getByTestId('alarm-recording-track')).toBeVisible()
  await page.getByTestId('alarm-recording-toggle').click()
  await expect(page.getByTestId('alarm-recording-toggle')).toContainText('暂停')
  await page.getByTestId('alarm-mark-processing').click()
  await expect(page.getByText('系统管理员 · 标记为处理中')).toBeVisible()

  await gotoRoute(page, '/teaching', '互动教学')
  await page.getByTestId('set-teacher-member-student-chen').click()
  await expect(page.getByTestId('member-row-member-student-chen')).toContainText('授课老师')
  await page.getByTestId('set-student-member-teacher-zhou').click()
  await expect(page.getByTestId('member-row-member-teacher-zhou')).toContainText('学生')
  await page.getByTestId('teaching-whiteboard-share').click()
  await expect(page.getByTestId('teaching-stage')).toContainText('远程白板共享中')
  await page.getByTestId('teaching-desktop-share').click()
  await expect(page.getByTestId('teaching-stage')).toContainText('电脑桌面共享中')
  await page.getByTestId('teaching-insert-screenshot').click()
  await expect(page.getByTestId('teaching-screenshot-list')).toContainText('截图 1')
  await page.getByTestId('teaching-answer-launch').click()
  await expect(page.getByTestId('teaching-answer-panel')).toContainText('已作答 2 人')
  await page.getByTestId('teaching-layout-whiteboard').click()
  await expect(page.getByTestId('teaching-stage')).toHaveClass(/is-layout-whiteboard/)
  await page.getByTestId('teaching-focus-toggle').click()
  await expect(page.getByTestId('teacher-video-tile')).toHaveClass(/is-focused/)

  await gotoRoute(page, '/blackboard', '课堂活动制作')
  await page.getByTestId('blackboard-type-cloze').click()
  await page.getByLabel('课堂文本').fill('选词填空：指南针是中国古代四大发明之一。答案：指南针')
  await page.getByTestId('blackboard-parse-button').click()
  await expect(page.getByTestId('blackboard-preview')).toContainText('____')
  await expect(page.getByTestId('blackboard-preview')).toContainText('正确答案')
  await page.getByTestId('blackboard-tab-video').click()
  await expect(page.getByText('不接入真实视频处理')).toBeVisible()
  await expect(page.getByText('视频片段同步删除：暂未启用')).toBeVisible()

  await gotoRoute(page, '/overview', '首页总览')
  expect(browserErrors.pageErrors).toEqual([])
  expect(browserErrors.consoleErrors).toEqual([])
})
