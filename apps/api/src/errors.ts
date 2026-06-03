import { fail } from '@analytics/shared'
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next)
  }
}

export function sendBadRequest(res: Response, code: string, message: string) {
  return res.status(400).json(fail(code, message))
}

export function sendForbidden(res: Response, message = 'You do not have permission for this dashboard') {
  return res.status(403).json(fail('FORBIDDEN', message))
}

export function sendNotFound(res: Response, message = 'Dashboard not found') {
  return res.status(404).json(fail('NOT_FOUND', message))
}

export const errorMiddleware: ErrorRequestHandler = (_error, _req, res, _next) => {
  res.status(500).json(fail('INTERNAL_ERROR', 'An internal server error occurred'))
}
