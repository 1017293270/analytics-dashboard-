import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { prisma } from '../src/db.js'
import { createApp } from '../src/app.js'

async function createPublishedDashboard(app: ReturnType<typeof createApp>, name = 'Published Workflow') {
  const created = await request(app).post('/api/big-screens').send({ name }).expect(201)
  const published = await request(app).post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(200)

  return published.body.data
}

describe('dashboard workflow routes', () => {
  test('copy dashboard creates a draft copy with owner permission', async () => {
    const app = createApp()
    const source = await createPublishedDashboard(app, 'Board to Copy')

    const copied = await request(app).post(`/api/big-screens/${source.id}/copy`).send({}).expect(201)

    expect(copied.body.success).toBe(true)
    expect(copied.body.data.id).not.toBe(source.id)
    expect(copied.body.data.name).toBe('Copy of Board to Copy')
    expect(copied.body.data.status).toBe('draft')
    expect(copied.body.data.publishedSchema).toBeNull()
    expect(copied.body.data.draftSchema.version).toBe('1.0')

    const permission = await prisma.dashboardPermission.findFirst({
      where: { dashboardId: copied.body.data.id, subjectId: 'demo-user' },
    })
    expect(permission?.permission).toBe('owner')

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'dashboard.copied', resourceId: copied.body.data.id },
    })
    expect(audit).toBeTruthy()
  })

  test('publish to unpublish to archive workflow records audits', async () => {
    const app = createApp()
    const dashboard = await createPublishedDashboard(app, 'Workflow Lifecycle')

    const unpublished = await request(app).post(`/api/big-screens/${dashboard.id}/unpublish`).send({}).expect(200)
    expect(unpublished.body.data.status).toBe('draft')
    expect(unpublished.body.data.publishedSchema).toBeNull()
    expect(unpublished.body.data.publishedAt).toBeNull()

    const archived = await request(app).delete(`/api/big-screens/${dashboard.id}`).expect(200)
    expect(archived.body.data.status).toBe('archived')

    const auditActions = await prisma.auditLog.findMany({
      where: { resourceId: dashboard.id },
      orderBy: { createdAt: 'asc' },
    })
    expect(auditActions.map((audit) => audit.action)).toEqual(
      expect.arrayContaining(['dashboard.published', 'dashboard.unpublished', 'dashboard.archived']),
    )
  })

  test('archived dashboards do not show in list and list hides schemas', async () => {
    const app = createApp()
    const visible = await request(app).post('/api/big-screens').send({ name: 'Visible Draft' }).expect(201)
    const archived = await request(app).post('/api/big-screens').send({ name: 'Archived Draft' }).expect(201)
    await request(app).delete(`/api/big-screens/${archived.body.data.id}`).expect(200)

    const list = await request(app).get('/api/big-screens').expect(200)

    expect(list.body.data.map((dashboard: { id: string }) => dashboard.id)).toContain(visible.body.data.id)
    expect(list.body.data.map((dashboard: { id: string }) => dashboard.id)).not.toContain(archived.body.data.id)
    expect(list.body.data[0]).not.toHaveProperty('draftSchema')
    expect(list.body.data[0]).not.toHaveProperty('publishedSchema')
  })

  test('versions list and rollback restores a published version', async () => {
    const app = createApp()
    const created = await request(app).post('/api/big-screens').send({ name: 'Versioned Board' }).expect(201)

    await request(app).post(`/api/big-screens/${created.body.data.id}/publish`).send({ publishNote: 'v1' }).expect(200)

    const draftSchema = created.body.data.draftSchema
    await request(app)
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({
        draftSchema: {
          ...draftSchema,
          canvas: { ...draftSchema.canvas, background: { type: 'color', value: '#111827' } },
        },
      })
      .expect(200)
    await request(app).post(`/api/big-screens/${created.body.data.id}/publish`).send({ publishNote: 'v2' }).expect(200)

    const versions = await request(app).get(`/api/big-screens/${created.body.data.id}/versions`).expect(200)
    expect(versions.body.data.map((version: { version: number }) => version.version)).toEqual([2, 1])
    expect(versions.body.data[0]).not.toHaveProperty('schema')

    const rolledBack = await request(app)
      .post(`/api/big-screens/${created.body.data.id}/versions/1/rollback`)
      .send({})
      .expect(200)
    expect(rolledBack.body.data.publishedSchema.canvas.background.value).toBe('#0b1220')

    const runtime = await request(app).get(`/api/big-screens/${created.body.data.id}/runtime`).expect(200)
    expect(runtime.body.data.schema.canvas.background.value).toBe('#0b1220')
  })

  test('share link can be created for a published dashboard and public runtime loads by token', async () => {
    const app = createApp()
    const dashboard = await createPublishedDashboard(app, 'Shared Runtime')

    const share = await request(app).post(`/api/big-screens/${dashboard.id}/share-links`).send({}).expect(201)
    expect(share.body.data.token).toEqual(expect.any(String))

    const runtime = await request(app).get(`/api/public/big-screens/${share.body.data.token}`).expect(200)
    expect(runtime.body.data.id).toBe(dashboard.id)
    expect(runtime.body.data.name).toBe('Shared Runtime')
    expect(runtime.body.data.schema.version).toBe('1.0')

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'dashboard.share.created', resourceId: dashboard.id },
    })
    expect(audit).toBeTruthy()
  })

  test('cannot create share link before publish', async () => {
    const app = createApp()
    const created = await request(app).post('/api/big-screens').send({ name: 'Draft Share' }).expect(201)

    const response = await request(app).post(`/api/big-screens/${created.body.data.id}/share-links`).send({}).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_PUBLISHED', message: 'Dashboard is not published' },
    })
  })

  test('archived dashboards cannot be fetched, edited, published, or loaded at runtime', async () => {
    const app = createApp()
    const dashboard = await createPublishedDashboard(app, 'Archived Boundary')
    await request(app).delete(`/api/big-screens/${dashboard.id}`).expect(200)

    await request(app).get(`/api/big-screens/${dashboard.id}`).expect(404)
    await request(app).patch(`/api/big-screens/${dashboard.id}`).send({ name: 'Archived Rename' }).expect(404)
    await request(app).patch(`/api/big-screens/${dashboard.id}/draft`).send({ draftSchema: dashboard.draftSchema }).expect(404)
    await request(app).post(`/api/big-screens/${dashboard.id}/publish`).send({}).expect(404)
    await request(app).get(`/api/big-screens/${dashboard.id}/runtime`).expect(404)
    await request(app).post(`/api/big-screens/${dashboard.id}/copy`).send({}).expect(404)
    await request(app).post(`/api/big-screens/${dashboard.id}/unpublish`).send({}).expect(404)
    await request(app).get(`/api/big-screens/${dashboard.id}/versions`).expect(404)
    await request(app).post(`/api/big-screens/${dashboard.id}/versions/1/rollback`).send({}).expect(404)
    await request(app).post(`/api/big-screens/${dashboard.id}/share-links`).send({}).expect(404)
  })

  test('cross-workspace dashboards cannot be fetched, updated, published, or loaded at runtime even with permission', async () => {
    const app = createApp()
    const dashboard = await createPublishedDashboard(app, 'Cross Workspace Boundary')
    await prisma.dashboard.update({
      where: { id: dashboard.id },
      data: { workspaceId: 'other-workspace' },
    })

    await request(app).get(`/api/big-screens/${dashboard.id}`).expect(404)
    await request(app).patch(`/api/big-screens/${dashboard.id}`).send({ name: 'Cross Workspace Rename' }).expect(404)
    await request(app).patch(`/api/big-screens/${dashboard.id}/draft`).send({ draftSchema: dashboard.draftSchema }).expect(404)
    await request(app).post(`/api/big-screens/${dashboard.id}/publish`).send({}).expect(404)
    await request(app).get(`/api/big-screens/${dashboard.id}/runtime`).expect(404)
  })
})
