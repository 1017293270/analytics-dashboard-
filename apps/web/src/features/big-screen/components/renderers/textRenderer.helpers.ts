import type { CSSProperties } from 'vue'
import { buildBackdropBlurStyle } from './rendererStyle.helpers'

const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 96
const DEFAULT_FONT_SIZE = 28
const DEFAULT_FONT_WEIGHT = 700
const NAMED_FONT_WEIGHTS = new Set(['normal', 'bold', 'lighter', 'bolder'])
const NUMERIC_FONT_WEIGHTS = new Set(['100', '200', '300', '400', '500', '600', '700', '800', '900'])

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeFontSize(value: unknown, fallback = DEFAULT_FONT_SIZE): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return clamp(value, MIN_FONT_SIZE, MAX_FONT_SIZE)
}

export function normalizeFontWeight(value: unknown): CSSProperties['fontWeight'] {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clamp(Math.round(value / 100) * 100, 100, 900)
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (NAMED_FONT_WEIGHTS.has(normalized) || NUMERIC_FONT_WEIGHTS.has(normalized)) {
      return normalized
    }
  }

  return DEFAULT_FONT_WEIGHT
}

export function buildTextStyle(style: Record<string, unknown>): CSSProperties {
  const backgroundColor = typeof style.backgroundColor === 'string' ? style.backgroundColor : 'transparent'
  const color = typeof style.fontColor === 'string' ? style.fontColor : '#f8fafc'

  return {
    backgroundColor,
    color,
    fontSize: `${normalizeFontSize(style.fontSize)}px`,
    fontWeight: normalizeFontWeight(style.fontWeight),
    ...buildBackdropBlurStyle(style),
  }
}
