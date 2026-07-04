import {
  alarmDetailValidator,
  alarmListQueryValidator,
  alarmStatusActionInputValidator,
  createAlarmDisposalRecordInputValidator,
  ok,
  type AlarmDetail,
  type AlarmDisposalRecord,
} from '@analytics/shared'
import { Router, type Request, type RequestHandler } from 'express'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { requireAuth } from '../auth/session.js'
import { prisma } from '../db.js'
import { asyncHandler, sendBadRequest, sendForbidden, sendNotFound } from '../errors.js'
import { ensureDemoManagementSeed, resetDemoAlarmsSeed } from '../management/management.seed.js'

const alarmIdParams = z.object({
  id: z.string().trim().min(1).max(128),
})

export const alarmRoutes = Router()

function hasRole(req: Request, code: string) {
  return Boolean(req.auth?.user?.roles.some((role) => role.code === code))
}

function canManageAlarms(req: Request) {
  return hasRole(req, 'system-admin') || hasRole(req, 'electro-education-director')
}

const requireAlarmManager: RequestHandler = (req, res, next) => {
  if (!canManageAlarms(req)) {
    sendForbidden(res, 'Only system administrators and electro-education directors can manage alarms')
    return
  }
  next()
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function serializeAlarm(alarm: {
  id: string
  deviceIdentifier: string
  deviceName: string
  location: string
  responsibleName: string
  responsiblePhone: string
  triggerMethod: string
  eventType: string
  status: string
  reportedAt: Date
  recording: string
  disposalRecords: string
  createdAt: Date
  updatedAt: Date
}) {
  return alarmDetailValidator.parse({
    id: alarm.id,
    deviceIdentifier: alarm.deviceIdentifier,
    deviceName: alarm.deviceName,
    location: alarm.location,
    responsibleName: alarm.responsibleName,
    responsiblePhone: alarm.responsiblePhone,
    triggerMethod: alarm.triggerMethod,
    eventType: alarm.eventType,
    status: alarm.status,
    reportedAt: alarm.reportedAt.toISOString(),
    recording: parseJson(alarm.recording, { duration: '0:00', url: null }),
    disposalRecords: parseJson<AlarmDisposalRecord[]>(alarm.disposalRecords, []),
    createdAt: alarm.createdAt.toISOString(),
    updatedAt: alarm.updatedAt.toISOString(),
  })
}

function buildAlarmSummary(alarms: AlarmDetail[]) {
  return {
    total: alarms.length,
    unhandled: alarms.filter((alarm) => alarm.status === 'unhandled').length,
    processing: alarms.filter((alarm) => alarm.status === 'processing').length,
    resolved: alarms.filter((alarm) => alarm.status === 'resolved').length,
  }
}

function filterAlarms(alarms: AlarmDetail[], query: z.infer<typeof alarmListQueryValidator>) {
  const keyword = query.keyword.toLowerCase()
  const reportedFrom = query.reportedFrom ? Date.parse(query.reportedFrom) : null
  const reportedTo = query.reportedTo ? Date.parse(query.reportedTo) : null

  return alarms.filter((alarm) => {
    const reportedAt = Date.parse(alarm.reportedAt)
    const matchesKeyword =
      !keyword ||
      alarm.deviceIdentifier.toLowerCase().includes(keyword) ||
      alarm.deviceName.toLowerCase().includes(keyword) ||
      alarm.location.toLowerCase().includes(keyword)
    const matchesStatus = !query.status || alarm.status === query.status
    const matchesTrigger = !query.triggerMethod || alarm.triggerMethod === query.triggerMethod
    const matchesDevice = !query.deviceIdentifier || alarm.deviceIdentifier === query.deviceIdentifier
    const matchesFrom = reportedFrom === null || reportedAt >= reportedFrom
    const matchesTo = reportedTo === null || reportedAt <= reportedTo
    return matchesKeyword && matchesStatus && matchesTrigger && matchesDevice && matchesFrom && matchesTo
  })
}

async function listAlarmPayload(query: z.infer<typeof alarmListQueryValidator>) {
  await ensureDemoManagementSeed()
  const rows = await prisma.alarm.findMany({ orderBy: { reportedAt: 'desc' } })
  const alarms = rows.map(serializeAlarm)
  const filtered = filterAlarms(alarms, query)
  return {
    items: filtered,
    summary: buildAlarmSummary(alarms),
    filteredTotal: filtered.length,
  }
}

function statusFromAction(action: 'processing' | 'resolved') {
  return action
}

function actionLabel(action: 'processing' | 'resolved') {
  return action === 'processing' ? '标记为处理中' : '标记为已处理'
}

function defaultActionNote(action: 'processing' | 'resolved') {
  return action === 'processing' ? '已接收告警，正在确认现场情况。' : '已通知责任人完成处置，事件结束。'
}

alarmRoutes.use('/alarms', requireAuth, requireAlarmManager)

alarmRoutes.get('/alarms', asyncHandler(async (req, res) => {
  const query = alarmListQueryValidator.safeParse(req.query)
  if (!query.success) return sendBadRequest(res, 'ALARM_INVALID_QUERY', 'Alarm query is invalid')

  res.json(ok(await listAlarmPayload(query.data)))
}))

alarmRoutes.post('/alarms/demo-reset', asyncHandler(async (_req, res) => {
  await resetDemoAlarmsSeed()
  res.json(ok(await listAlarmPayload(alarmListQueryValidator.parse({}))))
}))

alarmRoutes.get('/alarms/:id', asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const params = alarmIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'ALARM_INVALID', 'Alarm id is invalid')

  const alarm = await prisma.alarm.findUnique({ where: { id: params.data.id } })
  if (!alarm) return sendNotFound(res, 'Alarm not found')

  res.json(ok(serializeAlarm(alarm)))
}))

alarmRoutes.patch('/alarms/:id/status', asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const params = alarmIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'ALARM_INVALID', 'Alarm id is invalid')
  const body = alarmStatusActionInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'ALARM_INVALID', 'Alarm request is invalid')

  const existing = await prisma.alarm.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Alarm not found')

  const alarm = serializeAlarm(existing)
  const record: AlarmDisposalRecord = {
    id: nanoid(),
    operatorName: req.auth?.user?.displayName ?? '系统管理员',
    action: actionLabel(body.data.action),
    note: body.data.note ?? defaultActionNote(body.data.action),
    createdAt: new Date().toISOString(),
  }
  const updatedRecords = [...alarm.disposalRecords, record]
  const updated = await prisma.alarm.update({
    where: { id: params.data.id },
    data: {
      status: statusFromAction(body.data.action),
      disposalRecords: JSON.stringify(updatedRecords),
    },
  })

  res.json(ok(serializeAlarm(updated)))
}))

alarmRoutes.post('/alarms/:id/disposal-records', asyncHandler(async (req, res) => {
  await ensureDemoManagementSeed()
  const params = alarmIdParams.safeParse(req.params)
  if (!params.success) return sendBadRequest(res, 'ALARM_INVALID', 'Alarm id is invalid')
  const body = createAlarmDisposalRecordInputValidator.safeParse(req.body)
  if (!body.success) return sendBadRequest(res, 'ALARM_INVALID', 'Alarm request is invalid')

  const existing = await prisma.alarm.findUnique({ where: { id: params.data.id } })
  if (!existing) return sendNotFound(res, 'Alarm not found')

  const alarm = serializeAlarm(existing)
  const record: AlarmDisposalRecord = {
    id: nanoid(),
    operatorName: req.auth?.user?.displayName ?? '系统管理员',
    action: body.data.action,
    note: body.data.note,
    createdAt: new Date().toISOString(),
  }
  const updated = await prisma.alarm.update({
    where: { id: params.data.id },
    data: { disposalRecords: JSON.stringify([...alarm.disposalRecords, record]) },
  })

  res.status(201).json(ok(serializeAlarm(updated)))
}))
