import { z } from 'zod'

export const alarmStatusValidator = z.enum(['unhandled', 'processing', 'resolved'])
export type AlarmStatus = z.infer<typeof alarmStatusValidator>

export const alarmStatusActionValidator = z.enum(['processing', 'resolved'])
export type AlarmStatusAction = z.infer<typeof alarmStatusActionValidator>

const nonEmptyText = z.string().trim().min(1)

export const alarmRecordingValidator = z.object({
  duration: nonEmptyText.max(40),
  url: z.string().trim().url().nullable(),
})

export type AlarmRecording = z.infer<typeof alarmRecordingValidator>

export const alarmDisposalRecordValidator = z.object({
  id: nonEmptyText.max(128),
  operatorName: nonEmptyText.max(80),
  action: nonEmptyText.max(80),
  note: z.string().trim().max(500),
  createdAt: z.string().datetime(),
})

export type AlarmDisposalRecord = z.infer<typeof alarmDisposalRecordValidator>

export const alarmDetailValidator = z.object({
  id: nonEmptyText.max(128),
  deviceIdentifier: nonEmptyText.max(120),
  deviceName: nonEmptyText.max(120),
  location: nonEmptyText.max(200),
  responsibleName: nonEmptyText.max(80),
  responsiblePhone: z.string().trim().max(40),
  triggerMethod: nonEmptyText.max(80),
  eventType: nonEmptyText.max(120),
  status: alarmStatusValidator,
  reportedAt: z.string().datetime(),
  recording: alarmRecordingValidator,
  disposalRecords: z.array(alarmDisposalRecordValidator),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type AlarmDetail = z.infer<typeof alarmDetailValidator>
export const alarmRowValidator = alarmDetailValidator
export type AlarmRow = AlarmDetail

export const alarmStatusActionInputValidator = z.object({
  action: alarmStatusActionValidator,
  note: z.string().trim().max(500).optional(),
})

export type AlarmStatusActionInput = z.infer<typeof alarmStatusActionInputValidator>

export const createAlarmDisposalRecordInputValidator = z.object({
  action: nonEmptyText.max(80),
  note: z.string().trim().max(500),
})

export type CreateAlarmDisposalRecordInput = z.infer<typeof createAlarmDisposalRecordInputValidator>

export const alarmListQueryValidator = z.object({
  keyword: z.string().trim().optional().default(''),
  status: alarmStatusValidator.optional(),
  triggerMethod: z.string().trim().min(1).optional(),
  reportedFrom: z.string().datetime().optional(),
  reportedTo: z.string().datetime().optional(),
  deviceIdentifier: z.string().trim().min(1).optional(),
})

export type AlarmListQuery = z.infer<typeof alarmListQueryValidator>
