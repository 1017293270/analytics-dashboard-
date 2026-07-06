import request from 'supertest'
import { Prisma } from '@prisma/client'
import { describe, expect, test, vi } from 'vitest'
import { prisma } from '../src/db.js'
import { createApp } from '../src/app.js'

type TestApp = ReturnType<typeof createApp>
type TestAgent = ReturnType<typeof request.agent>

async function loginAs(app: TestApp, username = 'admin', password = 'Admin@123'): Promise<TestAgent> {
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ username, password }).expect(200)
  return agent
}

describe('dashboard routes', () => {
  test('requires authentication for private dashboard list', async () => {
    const app = createApp()

    const response = await request(app).get('/api/big-screens').expect(401)

    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  test('admin can list the four default role workbenches', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const listed = await admin.get('/api/big-screens').expect(200)

    expect(listed.body.success).toBe(true)
    expect(listed.body.data.map((dashboard: { id: string; name: string }) => [dashboard.id, dashboard.name])).toEqual(
      expect.arrayContaining([
        ['dashboard-all', '全员工作台'],
        ['dashboard-electro', '电教主任工作台'],
        ['dashboard-moral', '德育主任工作台'],
        ['dashboard-research', '教研主任工作台'],
      ]),
    )

    for (const id of ['dashboard-all', 'dashboard-electro', 'dashboard-moral', 'dashboard-research']) {
      const fetched = await admin.get(`/api/big-screens/${id}`).expect(200)

      expect(fetched.body.data.id).toBe(id)
      expect(fetched.body.data.draftSchema.version).toBe('1.0')
    }
  })

  test('admin list includes workbench visible roles and availability', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const listed = await admin.get('/api/big-screens').expect(200)
    const workbenches = new Map(
      listed.body.data.map((dashboard: { id: string; visibleRoles?: string[]; availability?: string }) => [
        dashboard.id,
        dashboard,
      ]),
    )

    expect(workbenches.get('dashboard-all')).toMatchObject({
      visibleRoles: ['all-staff'],
      availability: 'enabled',
    })
    expect(workbenches.get('dashboard-electro')).toMatchObject({
      visibleRoles: ['electro-education-director'],
      availability: 'enabled',
    })
    expect(workbenches.get('dashboard-moral')).toMatchObject({
      visibleRoles: ['moral-education-director'],
      availability: 'enabled',
    })
    expect(workbenches.get('dashboard-research')).toMatchObject({
      visibleRoles: ['teaching-research-director'],
      availability: 'enabled',
    })
  })

  test('admin can update workbench settings and list returns persisted settings', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const updated = await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({ visibleRoles: ['all-staff', 'electro-education-director'], availability: 'disabled' })
      .expect(200)

    expect(updated.body.data).toMatchObject({
      dashboardId: 'dashboard-electro',
      visibleRoles: ['all-staff', 'electro-education-director'],
      availability: 'disabled',
    })

    const listed = await admin.get('/api/big-screens').expect(200)
    const electro = listed.body.data.find((dashboard: { id: string }) => dashboard.id === 'dashboard-electro')

    expect(electro).toMatchObject({
      visibleRoles: ['all-staff', 'electro-education-director'],
      availability: 'disabled',
    })
  })
  test('admin can update workbench mapped dashboard and list returns persisted mapping', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin
      .post('/api/big-screens')
      .send({ name: '校级态势大屏', description: '数据中心映射目标' })
      .expect(201)

    const updated = await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({
        visibleRoles: ['electro-education-director'],
        availability: 'enabled',
        mappedDashboardId: created.body.data.id,
      })
      .expect(200)

    expect(updated.body.data).toMatchObject({
      dashboardId: 'dashboard-electro',
      visibleRoles: ['electro-education-director'],
      availability: 'enabled',
      mappedDashboardId: created.body.data.id,
    })

    const listed = await admin.get('/api/big-screens').expect(200)
    const electro = listed.body.data.find((dashboard: { id: string }) => dashboard.id === 'dashboard-electro')

    expect(electro).toMatchObject({
      id: 'dashboard-electro',
      mappedDashboardId: created.body.data.id,
    })
  })

  test('rejects workbench mapping to an unknown dashboard', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const response = await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({
        visibleRoles: ['electro-education-director'],
        availability: 'enabled',
        mappedDashboardId: 'missing-dashboard',
      })
      .expect(400)

    expect(response.body.error.code).toBe('REQUEST_INVALID')
  })
  test('archives mapped dashboard targets without blocking later workbench setting updates', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin
      .post('/api/big-screens')
      .send({ name: '临时映射大屏', description: '稍后归档' })
      .expect(201)

    await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({
        visibleRoles: ['electro-education-director'],
        availability: 'enabled',
        mappedDashboardId: created.body.data.id,
      })
      .expect(200)

    await admin.delete(`/api/big-screens/${created.body.data.id}`).expect(200)

    const updated = await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({ visibleRoles: ['electro-education-director'], availability: 'disabled' })
      .expect(200)

    expect(updated.body.data).toMatchObject({
      dashboardId: 'dashboard-electro',
      availability: 'disabled',
      mappedDashboardId: 'dashboard-electro',
    })
  })

  test('non-admin cannot update workbench settings', async () => {
    const app = createApp()
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')

    const response = await allStaff
      .patch('/api/big-screens/dashboard-all/workbench-settings')
      .send({ visibleRoles: ['all-staff'], availability: 'disabled' })
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('rejects invalid workbench settings updates', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const emptyRoles = await admin
      .patch('/api/big-screens/dashboard-all/workbench-settings')
      .send({ visibleRoles: [], availability: 'enabled' })
      .expect(400)
    expect(emptyRoles.body.error.code).toBe('REQUEST_INVALID')

    const invalidAvailability = await admin
      .patch('/api/big-screens/dashboard-all/workbench-settings')
      .send({ visibleRoles: ['all-staff'], availability: 'paused' })
      .expect(400)
    expect(invalidAvailability.body.error.code).toBe('REQUEST_INVALID')

    const unknownRole = await admin
      .patch('/api/big-screens/dashboard-all/workbench-settings')
      .send({ visibleRoles: ['not-a-real-role'], availability: 'enabled' })
      .expect(400)
    expect(unknownRole.body.error.code).toBe('REQUEST_INVALID')
  })

  test('disabled workbench is hidden from non-admin list but visible to admin', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const electroDirector = await loginAs(app, 'electro_director', 'Demo@123')

    await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({ visibleRoles: ['electro-education-director'], availability: 'disabled' })
      .expect(200)

    const nonAdminList = await electroDirector.get('/api/big-screens').expect(200)
    expect(nonAdminList.body.data.map((dashboard: { id: string }) => dashboard.id)).not.toContain('dashboard-electro')

    const adminList = await admin.get('/api/big-screens').expect(200)
    const electro = adminList.body.data.find((dashboard: { id: string }) => dashboard.id === 'dashboard-electro')
    expect(electro).toMatchObject({ id: 'dashboard-electro', availability: 'disabled' })
  })

  test('updated visible roles change non-admin list', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')

    await admin
      .patch('/api/big-screens/dashboard-electro/workbench-settings')
      .send({ visibleRoles: ['all-staff'], availability: 'enabled' })
      .expect(200)

    const listed = await allStaff.get('/api/big-screens').expect(200)

    expect(listed.body.data.map((dashboard: { id: string }) => dashboard.id)).toEqual(
      expect.arrayContaining(['dashboard-all', 'dashboard-electro']),
    )
    expect(listed.body.data).toHaveLength(2)
  })

  test('all staff sees only all-staff visible default workbenches', async () => {
    const app = createApp()
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')

    const listed = await allStaff.get('/api/big-screens').expect(200)

    expect(listed.body.data.map((dashboard: { id: string }) => dashboard.id)).toEqual(['dashboard-all'])
  })

  test('all staff cannot fetch the electro director workbench directly', async () => {
    const app = createApp()
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')

    const response = await allStaff.get('/api/big-screens/dashboard-electro').expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('creates and fetches a dashboard draft', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin
      .post('/api/big-screens')
      .send({ name: 'Operations Overview', description: 'AI Q&A operations' })
      .expect(201)

    expect(created.body.success).toBe(true)
    expect(created.body.data.name).toBe('Operations Overview')

    const fetched = await admin
      .get(`/api/big-screens/${created.body.data.id}`)
      .expect(200)

    expect(fetched.body.data.id).toBe(created.body.data.id)
    expect(fetched.body.data.draftSchema.version).toBe('1.0')
  })

  test('rejects invalid draft schema', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin
      .post('/api/big-screens')
      .send({ name: 'Invalid Schema Screen' })
      .expect(201)

    const response = await admin
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: { version: 'bad' }, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('SCHEMA_INVALID')
  })

  test('rejects invalid create body with stable fail shape', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const response = await admin.post('/api/big-screens').send({ name: '' }).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'REQUEST_INVALID', message: 'Dashboard name is required' },
    })
  })

  test('reuses a client reservation id for repeated local draft creates', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const clientReservationId = 'local-draft-repeatable-create'

    const first = await admin
      .post('/api/big-screens')
      .send({ name: 'First Draft', clientReservationId })
      .expect(201)
    const second = await admin
      .post('/api/big-screens')
      .send({ name: 'Second Draft', clientReservationId })
      .expect(200)

    expect(first.body.data.id).toBe(clientReservationId)
    expect(second.body.data.id).toBe(clientReservationId)

    const dashboards = await prisma.dashboard.findMany({ where: { id: clientReservationId } })
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0]?.name).toBe('First Draft')
  })

  test('rejects invalid local create reservation ids', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const response = await admin
      .post('/api/big-screens')
      .send({ name: 'Invalid Reservation', clientReservationId: 'dashboard-1' })
      .expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'REQUEST_INVALID', message: 'Dashboard name is required' },
    })
  })

  test('rejects local create reservation reuse without edit permission', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')
    const clientReservationId = 'local-draft-forbidden-reuse'

    await admin.post('/api/big-screens').send({ name: 'Reserved Draft', clientReservationId }).expect(201)

    const response = await allStaff
      .post('/api/big-screens')
      .send({ name: 'Forbidden Draft', clientReservationId })
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('rejects archived local reservation reuse with stable not found envelope', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const clientReservationId = 'local-draft-archived-reuse'

    await admin.post('/api/big-screens').send({ name: 'Archived Reservation', clientReservationId }).expect(201)
    await admin.delete(`/api/big-screens/${clientReservationId}`).expect(200)

    const response = await admin
      .post('/api/big-screens')
      .send({ name: 'Should Not Resurrect', clientReservationId })
      .expect(404)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Dashboard not found' },
    })

    const dashboards = await prisma.dashboard.findMany({ where: { id: clientReservationId } })
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0]?.status).toBe('archived')
    expect(dashboards[0]?.name).toBe('Archived Reservation')
  })

  test('rejects cross-workspace local reservation reuse with stable not found envelope', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const clientReservationId = 'local-draft-cross-workspace-reuse'

    await admin.post('/api/big-screens').send({ name: 'Cross Workspace Reservation', clientReservationId }).expect(201)
    await prisma.dashboard.update({
      where: { id: clientReservationId },
      data: { workspaceId: 'other-workspace' },
    })

    const response = await admin
      .post('/api/big-screens')
      .send({ name: 'Should Not Duplicate', clientReservationId })
      .expect(404)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Dashboard not found' },
    })

    const dashboards = await prisma.dashboard.findMany({ where: { id: clientReservationId } })
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0]?.workspaceId).toBe('other-workspace')
    expect(dashboards[0]?.name).toBe('Cross Workspace Reservation')
  })

  test('updates dashboard metadata with edit permission', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Old Name' }).expect(201)

    const updated = await admin
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Renamed Dashboard', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(200)

    expect(updated.body.success).toBe(true)
    expect(updated.body.data.name).toBe('Renamed Dashboard')
    expect(updated.body.data.draftSchema.version).toBe('1.0')

    const fetched = await admin.get(`/api/big-screens/${created.body.data.id}`).expect(200)
    expect(fetched.body.data.name).toBe('Renamed Dashboard')

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'dashboard.metadata.updated', resourceId: created.body.data.id },
    })
    expect(audit).toBeTruthy()
  })

  test('rejects invalid dashboard metadata updates', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Metadata Invalid' }).expect(201)
    const response = await admin.patch(`/api/big-screens/${created.body.data.id}`).send({ name: '' }).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'REQUEST_INVALID', message: 'Dashboard name is required' },
    })
  })

  test('rejects stale dashboard metadata revisions with a stable conflict shape', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Stale Metadata' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { name: 'Changed Elsewhere' },
    })

    const response = await admin
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Stale Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(409)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'DASHBOARD_CONFLICT', message: 'Dashboard changed. Reload before saving.' },
    })
  })

  test('rejects duplicate dashboard metadata revisions after the first write commits', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Duplicate Metadata' }).expect(201)
    await admin
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'First Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(200)

    const response = await admin
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Second Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(409)

    expect(response.body.error.code).toBe('DASHBOARD_CONFLICT')
  })

  test('rejects dashboard metadata updates without edit permission', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')

    const created = await admin.post('/api/big-screens').send({ name: 'Metadata Forbidden' }).expect(201)

    const response = await allStaff
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Forbidden Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('invalid dashboard permission is treated as no permission and does not appear in list', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const allStaff = await loginAs(app, 'all_staff', 'Demo@123')

    const created = await admin.post('/api/big-screens').send({ name: 'Bad Permission' }).expect(201)
    await prisma.dashboardPermission.create({
      data: {
        id: `permission-${created.body.data.id}-all-staff-invalid`,
        dashboardId: created.body.data.id,
        subjectType: 'role',
        subjectId: 'all-staff',
        permission: 'admin',
      },
    })

    const fetched = await allStaff.get(`/api/big-screens/${created.body.data.id}`).expect(403)
    expect(fetched.body.error.code).toBe('FORBIDDEN')

    const update = await allStaff
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Should Not Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(403)
    expect(update.body.error.code).toBe('FORBIDDEN')

    const list = await allStaff.get('/api/big-screens').expect(200)
    expect(list.body.data.map((dashboard: { id: string }) => dashboard.id)).not.toContain(created.body.data.id)
  })

  test('runtime before publish returns not published fail shape', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Draft Runtime' }).expect(201)
    const response = await admin.get(`/api/big-screens/${created.body.data.id}/runtime`).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_PUBLISHED', message: 'Dashboard is not published' },
    })
  })

  test('rejects stale draft revisions with a stable conflict shape', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Stale Draft' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { name: 'Changed Before Draft Save' },
    })

    const response = await admin
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: created.body.data.draftSchema, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(409)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'DASHBOARD_CONFLICT', message: 'Dashboard changed. Reload before saving.' },
    })
  })

  test('rejects duplicate draft revisions after the first write commits', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Duplicate Draft' }).expect(201)
    const draftSchema = {
      ...created.body.data.draftSchema,
      canvas: {
        ...created.body.data.draftSchema.canvas,
        background: { type: 'color', value: '#111827' },
      },
    }
    await admin
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(200)

    const response = await admin
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: created.body.data.draftSchema, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(409)

    expect(response.body.error.code).toBe('DASHBOARD_CONFLICT')
  })

  test('publishes a dashboard and returns runtime schema', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Published Runtime' }).expect(201)
    const published = await admin.post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(200)

    expect(published.body.success).toBe(true)
    expect(published.body.data.status).toBe('published')
    expect(published.body.data.publishedSchema.version).toBe('1.0')

    const runtime = await admin.get(`/api/big-screens/${created.body.data.id}/runtime`).expect(200)

    expect(runtime.body.success).toBe(true)
    expect(runtime.body.data.schema.version).toBe('1.0')
  })

  test('returns a stable conflict when publish version creation races', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Publish Conflict' }).expect(201)
    const conflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed on dashboard version', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['dashboardId', 'version'] },
    })
    const transactionSpy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(conflict)

    const response = await admin.post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(409)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: {
        code: 'PUBLISH_CONFLICT',
        message: 'Dashboard was published concurrently. Reload and try again.',
      },
    })
    expect(transactionSpy).toHaveBeenCalledOnce()
    expect(await prisma.dashboardVersion.count({ where: { dashboardId: created.body.data.id } })).toBe(0)
    expect((await prisma.dashboard.findUnique({ where: { id: created.body.data.id } }))?.status).toBe('draft')
  })

  test('corrupt stored schema returns stable internal error shape', async () => {
    const app = createApp()
    const admin = await loginAs(app)

    const created = await admin.post('/api/big-screens').send({ name: 'Corrupt Stored Schema' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { draftSchema: '{"version":"bad"}' },
    })

    const response = await admin.get(`/api/big-screens/${created.body.data.id}`).expect(500)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
    })
  })
})
