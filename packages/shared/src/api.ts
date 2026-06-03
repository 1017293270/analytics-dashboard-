export type ApiSuccess<T> = {
  success: true
  data: T
  error: null
  meta?: Record<string, unknown>
}

export type ApiFailure = {
  success: false
  data: null
  error: {
    code: string
    message: string
  }
  meta?: Record<string, unknown>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return meta === undefined ? { success: true, data, error: null } : { success: true, data, error: null, meta }
}

export function fail(code: string, message: string, meta?: Record<string, unknown>): ApiFailure {
  return meta === undefined
    ? { success: false, data: null, error: { code, message } }
    : { success: false, data: null, error: { code, message }, meta }
}
