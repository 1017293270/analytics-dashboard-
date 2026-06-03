import { fail } from '@analytics/shared'
import type { Response } from 'express'

export function sendBadRequest(res: Response, code: string, message: string) {
  return res.status(400).json(fail(code, message))
}

export function sendForbidden(res: Response, message = 'You do not have permission for this dashboard') {
  return res.status(403).json(fail('FORBIDDEN', message))
}

export function sendNotFound(res: Response, message = 'Dashboard not found') {
  return res.status(404).json(fail('NOT_FOUND', message))
}
