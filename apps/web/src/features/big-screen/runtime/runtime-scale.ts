import type { DashboardSchema } from '@analytics/shared'

export type RuntimeScaleMode = DashboardSchema['canvas']['scaleMode']

function isPositiveFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

function safeRatio(numerator: number, denominator: number): number {
  if (!isPositiveFiniteNumber(numerator) || !isPositiveFiniteNumber(denominator)) {
    return 1
  }

  const ratio = numerator / denominator
  return isPositiveFiniteNumber(ratio) ? ratio : 1
}

export function calculateFitScreenScale(options: {
  viewportWidth: number
  viewportHeight: number
  canvasWidth: number
  canvasHeight: number
}): number {
  const widthScale = safeRatio(options.viewportWidth, options.canvasWidth)
  const heightScale = safeRatio(options.viewportHeight, options.canvasHeight)
  const scale = Math.min(widthScale, heightScale)

  return isPositiveFiniteNumber(scale) ? scale : 1
}

export function calculateRuntimeScale(options: {
  scaleMode: RuntimeScaleMode
  viewportWidth: number
  viewportHeight: number
  canvasWidth: number
  canvasHeight: number
}): number {
  if (options.scaleMode === 'fixed') {
    return 1
  }

  if (options.scaleMode === 'fit-width') {
    return safeRatio(options.viewportWidth, options.canvasWidth)
  }

  return calculateFitScreenScale(options)
}
