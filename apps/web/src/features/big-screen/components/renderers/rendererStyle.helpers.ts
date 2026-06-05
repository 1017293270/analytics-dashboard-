import type { CSSProperties } from 'vue'

export function normalizeBackgroundBlur(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0

  return Math.round(Math.min(Math.max(value, 0), 100))
}

export function buildBackdropBlurStyle(style: Record<string, unknown>): CSSProperties {
  const backgroundBlur = normalizeBackgroundBlur(style.backgroundBlur)
  if (backgroundBlur <= 0) return {}

  return {
    backdropFilter: `blur(${backgroundBlur}px)`,
    WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
  }
}
