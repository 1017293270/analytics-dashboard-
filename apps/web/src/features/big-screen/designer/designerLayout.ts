import type { ComponentType, DashboardComponent, DashboardSchema } from '@analytics/shared'
import { componentRegistry, createComponent } from '../components/registry'

export const MIN_COMPONENT_SIZE = 24
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 2
export const ZOOM_STEP = 0.1

const MAX_Z_INDEX = 10000
const MIN_Z_INDEX = 0
const DEFAULT_COMPONENT_OFFSET = 64
const COMPONENT_STAGGER = 36

function toFiniteNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function clampZoom(value: number): number {
  return Math.round(clampNumber(toFiniteNumber(value, 1), MIN_ZOOM, MAX_ZOOM) * 100) / 100
}

export function parseBoundedNumber(
  rawValue: string,
  fallback: number,
  options: { min: number; max: number; integer?: boolean },
): number {
  const parsed = Number(rawValue)
  const finite = Number.isFinite(parsed) ? parsed : fallback
  const rounded = options.integer === false ? finite : Math.round(finite)

  return clampNumber(rounded, options.min, options.max)
}

export function clampLayout(
  layout: DashboardComponent['layout'],
  canvas: DashboardSchema['canvas'],
): DashboardComponent['layout'] {
  const canvasWidth = Math.max(MIN_COMPONENT_SIZE, canvas.width)
  const canvasHeight = Math.max(MIN_COMPONENT_SIZE, canvas.height)
  const width = Math.round(clampNumber(toFiniteNumber(layout.width, MIN_COMPONENT_SIZE), MIN_COMPONENT_SIZE, canvasWidth))
  const height = Math.round(
    clampNumber(toFiniteNumber(layout.height, MIN_COMPONENT_SIZE), MIN_COMPONENT_SIZE, canvasHeight),
  )
  const x = Math.round(clampNumber(toFiniteNumber(layout.x, 0), 0, Math.max(0, canvasWidth - width)))
  const y = Math.round(clampNumber(toFiniteNumber(layout.y, 0), 0, Math.max(0, canvasHeight - height)))
  const zIndex = Math.round(clampNumber(toFiniteNumber(layout.zIndex, 1), MIN_Z_INDEX, MAX_Z_INDEX))

  return {
    ...layout,
    x,
    y,
    width,
    height,
    zIndex,
    visible: layout.visible ?? true,
  }
}

function getNextZIndex(schema: DashboardSchema): number {
  const currentMax = schema.components.reduce((max, component) => Math.max(max, component.layout.zIndex), 0)

  return clampNumber(currentMax + 1, MIN_Z_INDEX, MAX_Z_INDEX)
}

export function createDesignerComponent(type: ComponentType, schema: DashboardSchema): DashboardComponent {
  const definition = componentRegistry[type]
  const index = schema.components.length
  const x = DEFAULT_COMPONENT_OFFSET + (index % 8) * COMPONENT_STAGGER
  const y = DEFAULT_COMPONENT_OFFSET + (index % 6) * COMPONENT_STAGGER
  const component = createComponent(type, x, y, getNextZIndex(schema))

  return {
    ...component,
    layout: clampLayout(component.layout, schema.canvas),
    name: definition.title,
  }
}

export function getCanvasBackgroundStyle(canvas: DashboardSchema['canvas']): Record<string, string> {
  if (canvas.background.type === 'color') {
    return { backgroundColor: canvas.background.value }
  }

  return {
    backgroundImage: `url("${canvas.background.assetId}")`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: canvas.background.fit,
  }
}

export function formatZoomPercent(value: number): string {
  return `${Math.round(clampZoom(value) * 100)}%`
}
