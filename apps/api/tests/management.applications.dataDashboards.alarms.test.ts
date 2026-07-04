import request from 'supertest'
import { beforeEach, describe, expect, test } from 'vitest'
import { createApp } from '../src/app.js'
import { ensureDemoAuthSeed } from '../src/auth/auth.seed.js'
import { prisma } from '../src/db.js'

const app = createApp()

type TestAgent = ReturnType<typeof request.agent>

async function loginAs(username = 'admin', password = 'Admin@123'): Promise<TestAgent> {
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ username, password }).expect(200)
  return agent
}

describe('management module routes', () => {
  beforeEach(async () => {
    await ensureDemoAuthSeed()
  })

  test('anonymous users cannot access management APIs', async () => {
    await request(app).get('/api/applications').expect(401)
    await request(app).post('/api/applications').send({}).expect(401)
    await request(app).get('/api/application-categories').expect(401)
    await request(app).get('/api/data-dashboards').expect(401)
    await request(app).post('/api/data-dashboards').send({}).expect(401)
    await request(app).get('/api/alarms').expect(401)
    await request(app).get('/api/alarms/alarm-camera-101').expect(401)
  })

  test('system admin lists seeded applications with summary and filters', async () => {
    const admin = await loginAs()

    const listed = await admin.get('/api/applications').expect(200)
    expect(listed.body.data.summary).toEqual({ total: 8, web: 5, mobile: 3, enabled: 6 })
    expect(listed.body.data.filteredTotal).toBe(8)
    expect(listed.body.data.items.map((application: { id: string }) => application.id)).toEqual([
      'app-notice',
      'app-inspection',
      'app-leave',
      'app-energy',
      'app-family',
      'app-resource',
      'app-governance',
      'app-blackboard',
    ])

    const categories = await admin.get('/api/application-categories').expect(200)
    expect(categories.body.data.map((category: { id: string; name: string }) => [category.id, category.name])).toEqual([
      ['teaching-tools', '教学工具'],
      ['management-tools', '管理工具'],
      ['data-dashboard', '数据看板'],
      ['mobile-service', '移动服务'],
    ])

    const filtered = await admin
      .get('/api/applications')
      .query({
        keyword: '治理',
        categoryId: 'data-dashboard',
        platform: 'web',
        status: 'enabled',
        visibleRoleCode: 'electro-education-director',
      })
      .expect(200)
    expect(filtered.body.data.items.map((application: { id: string }) => application.id)).toEqual(['app-governance'])
  })

  test('electro director can write applications while other non-admin roles cannot', async () => {
    const electroDirector = await loginAs('electro_director', 'Demo@123')
    const moralDirector = await loginAs('moral_director', 'Demo@123')

    const created = await electroDirector
      .post('/api/applications')
      .send({
        name: '设备巡课助手',
        categoryId: 'management-tools',
        platform: 'mobile',
        packageId: 'com.school.patrol',
        icon: 'shield',
        visibleRoleCodes: ['electro-education-director'],
        status: 'enabled',
      })
      .expect(201)

    expect(created.body.data).toMatchObject({
      name: '设备巡课助手',
      categoryName: '管理工具',
      platform: 'mobile',
      status: 'enabled',
      visibleRoleCodes: ['electro-education-director'],
    })

    const updated = await electroDirector
      .patch(`/api/applications/${created.body.data.id}`)
      .send({ status: 'disabled', visibleRoleCodes: ['all-staff', 'electro-education-director'] })
      .expect(200)
    expect(updated.body.data).toMatchObject({
      status: 'disabled',
      visibleRoleCodes: ['all-staff', 'electro-education-director'],
    })

    const uninstalled = await electroDirector.post(`/api/applications/${created.body.data.id}/uninstall`).expect(200)
    expect(uninstalled.body.data.status).toBe('uninstalled')

    const forbidden = await moralDirector
      .post('/api/applications')
      .send({
        name: '德育临时应用',
        categoryId: 'management-tools',
        platform: 'web',
        url: 'https://demo.school.local/moral-temp',
        visibleRoleCodes: ['moral-education-director'],
        status: 'enabled',
      })
      .expect(403)
    expect(forbidden.body.error.code).toBe('FORBIDDEN')
  })

  test('data dashboard list is role filtered and writes are system-admin only', async () => {
    const admin = await loginAs()
    const allStaff = await loginAs('all_staff', 'Demo@123')
    const electroDirector = await loginAs('electro_director', 'Demo@123')

    const adminList = await admin.get('/api/data-dashboards').expect(200)
    expect(adminList.body.data.summary).toEqual({ total: 6, default: 3, embedded: 2 })
    expect(adminList.body.data.filteredTotal).toBe(6)

    const staffList = await allStaff.get('/api/data-dashboards').expect(200)
    expect(staffList.body.data.items.map((dashboard: { id: string }) => dashboard.id)).toEqual([
      'dashboard-governance',
      'dashboard-app-usage',
    ])

    const filteredForElectro = await electroDirector
      .get('/api/data-dashboards')
      .query({ roleCode: 'electro-education-director', source: 'embedded' })
      .expect(200)
    expect(filteredForElectro.body.data.items.map((dashboard: { id: string }) => dashboard.id)).toEqual([
      'dashboard-alarm',
      'dashboard-app-usage',
    ])

    await electroDirector
      .post('/api/data-dashboards')
      .send({
        name: '被拦截的看板',
        type: '设备运维',
        source: 'builtin',
        visibleRoleCodes: ['electro-education-director'],
        status: 'enabled',
      })
      .expect(403)

    const created = await admin
      .post('/api/data-dashboards')
      .send({
        name: '一卡通态势',
        type: '治理分析',
        source: 'embedded',
        embedUrl: 'https://demo.school.local/card-bi',
        visibleRoleCodes: ['system-admin'],
        status: 'enabled',
        metrics: [{ label: '今日刷卡', value: '821', trend: '平稳' }],
      })
      .expect(201)
    expect(created.body.data).toMatchObject({ source: 'embedded', embedUrl: 'https://demo.school.local/card-bi' })
  })

  test('alarms return summary, details, status actions, and operator disposal records', async () => {
    const electroDirector = await loginAs('electro_director', 'Demo@123')

    const listed = await electroDirector.get('/api/alarms').expect(200)
    expect(listed.body.data.summary).toEqual({ total: 8, unhandled: 4, processing: 2, resolved: 2 })
    expect(listed.body.data.filteredTotal).toBe(8)

    const filtered = await electroDirector
      .get('/api/alarms')
      .query({ status: 'unhandled', triggerMethod: 'AI识别', deviceIdentifier: 'CAM-3-101-01' })
      .expect(200)
    expect(filtered.body.data.items.map((alarm: { id: string }) => alarm.id)).toEqual(['alarm-camera-101'])

    const detail = await electroDirector.get('/api/alarms/alarm-camera-101').expect(200)
    expect(detail.body.data).toMatchObject({
      id: 'alarm-camera-101',
      status: 'unhandled',
      recording: { duration: '0:15', url: null },
    })

    const processing = await electroDirector
      .patch('/api/alarms/alarm-camera-101/status')
      .send({ action: 'processing', note: '正在远程确认现场情况' })
      .expect(200)
    expect(processing.body.data.status).toBe('processing')
    expect(processing.body.data.disposalRecords.at(-1)).toMatchObject({
      operatorName: '电教主任',
      action: '标记为处理中',
      note: '正在远程确认现场情况',
    })

    const appended = await electroDirector
      .post('/api/alarms/alarm-camera-101/disposal-records')
      .send({ action: '现场排查', note: '已通知楼层负责人' })
      .expect(201)
    expect(appended.body.data.disposalRecords.at(-1)).toMatchObject({
      operatorName: '电教主任',
      action: '现场排查',
      note: '已通知楼层负责人',
    })
  })

  test('unauthorized roles cannot write alarms and demo reset restores management seed data', async () => {
    const admin = await loginAs()
    const moralDirector = await loginAs('moral_director', 'Demo@123')

    await moralDirector
      .patch('/api/alarms/alarm-camera-101/status')
      .send({ action: 'processing', note: '不应允许' })
      .expect(403)

    await admin
      .patch('/api/alarms/alarm-camera-101/status')
      .send({ action: 'resolved', note: '演示改动' })
      .expect(200)
    await admin.post('/api/applications/app-energy/uninstall').expect(200)
    await admin
      .patch('/api/data-dashboards/dashboard-alarm')
      .send({ status: 'enabled', visibleRoleCodes: ['all-staff'] })
      .expect(200)

    const resetApps = await admin.post('/api/applications/demo-reset').expect(200)
    const resetDashboards = await admin.post('/api/data-dashboards/demo-reset').expect(200)
    const resetAlarms = await admin.post('/api/alarms/demo-reset').expect(200)

    expect(resetApps.body.data.summary).toEqual({ total: 8, web: 5, mobile: 3, enabled: 6 })
    expect(resetDashboards.body.data.summary).toEqual({ total: 6, default: 3, embedded: 2 })
    expect(resetAlarms.body.data.summary).toEqual({ total: 8, unhandled: 4, processing: 2, resolved: 2 })
    expect(await prisma.managedApplication.count()).toBe(8)
    expect(await prisma.dataDashboard.count()).toBe(6)
    expect(await prisma.alarm.count()).toBe(8)
  })
})
