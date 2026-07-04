import request from 'supertest'
import { Prisma } from '@prisma/client'
import { describe, expect, test, vi } from 'vitest'
import { prisma } from '../src/db.js'
import { createApp } from '../src/app.js'

describe('dashboard routes', () => {
  test('seeds the four default role workbenches as editable dashboard records', async () => {
    const app = createApp()

    const listed = await request(app).get('/api/big-screens').expect(200)

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
      const fetched = await request(app).get(`/api/big-screens/${id}`).expect(200)

      expect(fetched.body.data.id).toBe(id)
      expect(fetched.body.data.draftSchema.version).toBe('1.0')
    }
  })

  test('creates and fetches a dashboard draft', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Operations Overview', description: 'AI Q&A operations' })
      .expect(201)

    expect(created.body.success).toBe(true)
    expect(created.body.data.name).toBe('Operations Overview')

    const fetched = await request(app)
      .get(`/api/big-screens/${created.body.data.id}`)
      .expect(200)

    expect(fetched.body.data.id).toBe(created.body.data.id)
    expect(fetched.body.data.draftSchema.version).toBe('1.0')
  })

  test('rejects invalid draft schema', async () => {
    const app = createApp()

    const created = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Invalid Schema Screen' })
      .expect(201)

    const response = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: { version: 'bad' }, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('SCHEMA_INVALID')
  })

  test('rejects invalid create body with stable fail shape', async () => {
    const app = createApp()

    const response = await request(app).post('/api/big-screens').send({ name: '' }).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'REQUEST_INVALID', message: 'Dashboard name is required' },
    })
  })

  test('reuses a client reservation id for repeated local draft creates', async () => {
    const app = createApp()
    const clientReservationId = 'local-draft-repeatable-create'

    const first = await request(app)
      .post('/api/big-screens')
      .send({ name: 'First Draft', clientReservationId })
      .expect(201)
    const second = await request(app)
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

    const response = await request(app)
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
    const clientReservationId = 'local-draft-forbidden-reuse'

    await request(app).post('/api/big-screens').send({ name: 'Reserved Draft', clientReservationId }).expect(201)
    await prisma.dashboardPermission.deleteMany({ where: { dashboardId: clientReservationId } })

    const response = await request(app)
      .post('/api/big-screens')
      .send({ name: 'Forbidden Draft', clientReservationId })
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('rejects archived local reservation reuse with stable not found envelope', async () => {
    const app = createApp()
    const clientReservationId = 'local-draft-archived-reuse'

    await request(app).post('/api/big-screens').send({ name: 'Archived Reservation', clientReservationId }).expect(201)
    await request(app).delete(`/api/big-screens/${clientReservationId}`).expect(200)

    const response = await request(app)
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
    const clientReservationId = 'local-draft-cross-workspace-reuse'

    await request(app).post('/api/big-screens').send({ name: 'Cross Workspace Reservation', clientReservationId }).expect(201)
    await prisma.dashboard.update({
      where: { id: clientReservationId },
      data: { workspaceId: 'other-workspace' },
    })

    const response = await request(app)
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

    const created = await request(app).post('/api/big-screens').send({ name: 'Old Name' }).expect(201)

    const updated = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Renamed Dashboard', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(200)

    expect(updated.body.success).toBe(true)
    expect(updated.body.data.name).toBe('Renamed Dashboard')
    expect(updated.body.data.draftSchema.version).toBe('1.0')

    const fetched = await request(app).get(`/api/big-screens/${created.body.data.id}`).expect(200)
    expect(fetched.body.data.name).toBe('Renamed Dashboard')

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'dashboard.metadata.updated', resourceId: created.body.data.id },
    })
    expect(audit).toBeTruthy()
  })

  test('rejects invalid dashboard metadata updates', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Metadata Invalid' }).expect(201)
    const response = await request(app).patch(`/api/big-screens/${created.body.data.id}`).send({ name: '' }).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'REQUEST_INVALID', message: 'Dashboard name is required' },
    })
  })

  test('rejects stale dashboard metadata revisions with a stable conflict shape', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Stale Metadata' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { name: 'Changed Elsewhere' },
    })

    const response = await request(app)
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

    const created = await request(app).post('/api/big-screens').send({ name: 'Duplicate Metadata' }).expect(201)
    await request(app)
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'First Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(200)

    const response = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Second Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(409)

    expect(response.body.error.code).toBe('DASHBOARD_CONFLICT')
  })

  test('rejects dashboard metadata updates without edit permission', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Metadata Forbidden' }).expect(201)
    await prisma.dashboardPermission.deleteMany({ where: { dashboardId: created.body.data.id } })

    const response = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Forbidden Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  test('invalid dashboard permission is treated as no permission and does not appear in list', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Bad Permission' }).expect(201)
    await prisma.dashboardPermission.updateMany({
      where: { dashboardId: created.body.data.id, subjectId: 'demo-user' },
      data: { permission: 'admin' },
    })

    const fetched = await request(app).get(`/api/big-screens/${created.body.data.id}`).expect(403)
    expect(fetched.body.error.code).toBe('FORBIDDEN')

    const update = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}`)
      .send({ name: 'Should Not Rename', expectedUpdatedAt: created.body.data.updatedAt })
      .expect(403)
    expect(update.body.error.code).toBe('FORBIDDEN')

    const list = await request(app).get('/api/big-screens').expect(200)
    expect(list.body.data.map((dashboard: { id: string }) => dashboard.id)).not.toContain(created.body.data.id)
  })

  test('runtime before publish returns not published fail shape', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Draft Runtime' }).expect(201)
    const response = await request(app).get(`/api/big-screens/${created.body.data.id}/runtime`).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_PUBLISHED', message: 'Dashboard is not published' },
    })
  })

  test('rejects stale draft revisions with a stable conflict shape', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Stale Draft' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { name: 'Changed Before Draft Save' },
    })

    const response = await request(app)
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

    const created = await request(app).post('/api/big-screens').send({ name: 'Duplicate Draft' }).expect(201)
    const draftSchema = {
      ...created.body.data.draftSchema,
      canvas: {
        ...created.body.data.draftSchema.canvas,
        background: { type: 'color', value: '#111827' },
      },
    }
    await request(app)
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(200)

    const response = await request(app)
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({ draftSchema: created.body.data.draftSchema, expectedUpdatedAt: created.body.data.updatedAt })
      .expect(409)

    expect(response.body.error.code).toBe('DASHBOARD_CONFLICT')
  })

  test('publishes a dashboard and returns runtime schema', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Published Runtime' }).expect(201)
    const published = await request(app).post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(200)

    expect(published.body.success).toBe(true)
    expect(published.body.data.status).toBe('published')
    expect(published.body.data.publishedSchema.version).toBe('1.0')

    const runtime = await request(app).get(`/api/big-screens/${created.body.data.id}/runtime`).expect(200)

    expect(runtime.body.success).toBe(true)
    expect(runtime.body.data.schema.version).toBe('1.0')
  })

  test('returns a stable conflict when publish version creation races', async () => {
    const app = createApp()

    const created = await request(app).post('/api/big-screens').send({ name: 'Publish Conflict' }).expect(201)
    const conflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed on dashboard version', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['dashboardId', 'version'] },
    })
    const transactionSpy = vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(conflict)

    const response = await request(app).post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(409)

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

    const created = await request(app).post('/api/big-screens').send({ name: 'Corrupt Stored Schema' }).expect(201)
    await prisma.dashboard.update({
      where: { id: created.body.data.id },
      data: { draftSchema: '{"version":"bad"}' },
    })

    const response = await request(app).get(`/api/big-screens/${created.body.data.id}`).expect(500)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred' },
    })
  })
})
