import request from 'supertest'
import { describe, expect, test } from 'vitest'
import { prisma } from '../src/db.js'
import { createApp } from '../src/app.js'

type TestApp = ReturnType<typeof createApp>
type TestAgent = ReturnType<typeof request.agent>

async function loginAs(app: TestApp, username = 'admin', password = 'Admin@123'): Promise<TestAgent> {
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ username, password }).expect(200)
  return agent
}

async function createPublishedDashboard(agent: TestAgent, name = 'Published Workflow') {
  const created = await agent.post('/api/big-screens').send({ name }).expect(201)
  const published = await agent.post(`/api/big-screens/${created.body.data.id}/publish`).send({}).expect(200)

  return published.body.data
}

describe('dashboard workflow routes', () => {
  test('copy dashboard creates a draft copy with owner permission', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const source = await createPublishedDashboard(admin, 'Board to Copy')

    const copied = await admin.post(`/api/big-screens/${source.id}/copy`).send({}).expect(201)

    expect(copied.body.success).toBe(true)
    expect(copied.body.data.id).not.toBe(source.id)
    expect(copied.body.data.name).toBe('Copy of Board to Copy')
    expect(copied.body.data.status).toBe('draft')
    expect(copied.body.data.ownerId).toBe('user-system-admin')
    expect(copied.body.data.publishedSchema).toBeNull()
    expect(copied.body.data.draftSchema.version).toBe('1.0')

    const permission = await prisma.dashboardPermission.findFirst({
      where: { dashboardId: copied.body.data.id, subjectType: 'user', subjectId: 'user-system-admin' },
    })
    expect(permission?.permission).toBe('owner')

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'dashboard.copied', resourceId: copied.body.data.id },
    })
    expect(audit).toBeTruthy()
  })

  test('publish to unpublish to archive workflow records audits', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const dashboard = await createPublishedDashboard(admin, 'Workflow Lifecycle')

    const unpublished = await admin.post(`/api/big-screens/${dashboard.id}/unpublish`).send({}).expect(200)
    expect(unpublished.body.data.status).toBe('draft')
    expect(unpublished.body.data.publishedSchema).toBeNull()
    expect(unpublished.body.data.publishedAt).toBeNull()

    const archived = await admin.delete(`/api/big-screens/${dashboard.id}`).expect(200)
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
    const admin = await loginAs(app)
    const visible = await admin.post('/api/big-screens').send({ name: 'Visible Draft' }).expect(201)
    const archived = await admin.post('/api/big-screens').send({ name: 'Archived Draft' }).expect(201)
    await admin.delete(`/api/big-screens/${archived.body.data.id}`).expect(200)

    const list = await admin.get('/api/big-screens').expect(200)

    expect(list.body.data.map((dashboard: { id: string }) => dashboard.id)).toContain(visible.body.data.id)
    expect(list.body.data.map((dashboard: { id: string }) => dashboard.id)).not.toContain(archived.body.data.id)
    expect(list.body.data[0]).not.toHaveProperty('draftSchema')
    expect(list.body.data[0]).not.toHaveProperty('publishedSchema')
  })

  test('versions list and rollback restores a published version', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const created = await admin.post('/api/big-screens').send({ name: 'Versioned Board' }).expect(201)

    const publishedV1 = await admin
      .post(`/api/big-screens/${created.body.data.id}/publish`)
      .send({ publishNote: 'v1' })
      .expect(200)

    const draftSchema = created.body.data.draftSchema
    await admin
      .patch(`/api/big-screens/${created.body.data.id}/draft`)
      .send({
        draftSchema: {
          ...draftSchema,
          canvas: { ...draftSchema.canvas, background: { type: 'color', value: '#111827' } },
        },
        expectedUpdatedAt: publishedV1.body.data.updatedAt,
      })
      .expect(200)
    await admin.post(`/api/big-screens/${created.body.data.id}/publish`).send({ publishNote: 'v2' }).expect(200)

    const versions = await admin.get(`/api/big-screens/${created.body.data.id}/versions`).expect(200)
    expect(versions.body.data.map((version: { version: number }) => version.version)).toEqual([2, 1])
    expect(versions.body.data[0]).not.toHaveProperty('schema')

    const rolledBack = await admin
      .post(`/api/big-screens/${created.body.data.id}/versions/1/rollback`)
      .send({})
      .expect(200)
    expect(rolledBack.body.data.publishedSchema.canvas.background.value).toBe('#0b1220')

    const runtime = await admin.get(`/api/big-screens/${created.body.data.id}/runtime`).expect(200)
    expect(runtime.body.data.schema.canvas.background.value).toBe('#0b1220')
  })

  test('share link can be created for a published dashboard and public runtime loads by token', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const dashboard = await createPublishedDashboard(admin, 'Shared Runtime')

    const share = await admin.post(`/api/big-screens/${dashboard.id}/share-links`).send({}).expect(201)
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

  test('non-public-runtime share scope cannot load public runtime', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const dashboard = await createPublishedDashboard(admin, 'Scoped Share Runtime')
    const share = await admin.post(`/api/big-screens/${dashboard.id}/share-links`).send({}).expect(201)
    await prisma.dashboardShareLink.update({
      where: { token: share.body.data.token },
      data: { accessScope: 'internal-review' },
    })

    const response = await request(app).get(`/api/public/big-screens/${share.body.data.token}`).expect(404)

    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  test('share token is disabled after unpublish and archive', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const unpublishedDashboard = await createPublishedDashboard(admin, 'Unpublished Share Runtime')
    const unpublishedShare = await admin
      .post(`/api/big-screens/${unpublishedDashboard.id}/share-links`)
      .send({})
      .expect(201)
    await admin.post(`/api/big-screens/${unpublishedDashboard.id}/unpublish`).send({}).expect(200)
    await request(app).get(`/api/public/big-screens/${unpublishedShare.body.data.token}`).expect(404)

    const archivedDashboard = await createPublishedDashboard(admin, 'Archived Share Runtime')
    const archivedShare = await admin
      .post(`/api/big-screens/${archivedDashboard.id}/share-links`)
      .send({})
      .expect(201)
    await admin.delete(`/api/big-screens/${archivedDashboard.id}`).expect(200)
    await request(app).get(`/api/public/big-screens/${archivedShare.body.data.token}`).expect(404)
  })

  test('cannot create share link before publish', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const created = await admin.post('/api/big-screens').send({ name: 'Draft Share' }).expect(201)

    const response = await admin.post(`/api/big-screens/${created.body.data.id}/share-links`).send({}).expect(400)

    expect(response.body).toEqual({
      success: false,
      data: null,
      error: { code: 'NOT_PUBLISHED', message: 'Dashboard is not published' },
    })
  })

  test('archived dashboards cannot be fetched, edited, published, or loaded at runtime', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const dashboard = await createPublishedDashboard(admin, 'Archived Boundary')
    await admin.delete(`/api/big-screens/${dashboard.id}`).expect(200)

    await admin.get(`/api/big-screens/${dashboard.id}`).expect(404)
    await admin
      .patch(`/api/big-screens/${dashboard.id}`)
      .send({ name: 'Archived Rename', expectedUpdatedAt: dashboard.updatedAt })
      .expect(404)
    await admin
      .patch(`/api/big-screens/${dashboard.id}/draft`)
      .send({ draftSchema: dashboard.draftSchema, expectedUpdatedAt: dashboard.updatedAt })
      .expect(404)
    await admin.post(`/api/big-screens/${dashboard.id}/publish`).send({}).expect(404)
    await admin.get(`/api/big-screens/${dashboard.id}/runtime`).expect(404)
    await admin.post(`/api/big-screens/${dashboard.id}/copy`).send({}).expect(404)
    await admin.post(`/api/big-screens/${dashboard.id}/unpublish`).send({}).expect(404)
    await admin.get(`/api/big-screens/${dashboard.id}/versions`).expect(404)
    await admin.post(`/api/big-screens/${dashboard.id}/versions/1/rollback`).send({}).expect(404)
    await admin.post(`/api/big-screens/${dashboard.id}/share-links`).send({}).expect(404)
  })

  test('cross-workspace dashboards cannot be fetched, updated, published, or loaded at runtime even with permission', async () => {
    const app = createApp()
    const admin = await loginAs(app)
    const dashboard = await createPublishedDashboard(admin, 'Cross Workspace Boundary')
    await prisma.dashboard.update({
      where: { id: dashboard.id },
      data: { workspaceId: 'other-workspace' },
    })

    await admin.get(`/api/big-screens/${dashboard.id}`).expect(404)
    await admin
      .patch(`/api/big-screens/${dashboard.id}`)
      .send({ name: 'Cross Workspace Rename', expectedUpdatedAt: dashboard.updatedAt })
      .expect(404)
    await admin
      .patch(`/api/big-screens/${dashboard.id}/draft`)
      .send({ draftSchema: dashboard.draftSchema, expectedUpdatedAt: dashboard.updatedAt })
      .expect(404)
    await admin.post(`/api/big-screens/${dashboard.id}/publish`).send({}).expect(404)
    await admin.get(`/api/big-screens/${dashboard.id}/runtime`).expect(404)
  })
})
