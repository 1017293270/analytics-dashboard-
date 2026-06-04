import { expect, test } from '@playwright/test'

const PRESET_TITLE = 'AI Operations Command Center'
const SCALE_TOLERANCE = 0.01

function parseScale(transform: string) {
  if (transform === 'none') return 1

  const matrixMatch = /^matrix\(([^,]+),/.exec(transform)
  if (!matrixMatch) {
    throw new Error(`Unexpected transform format: ${transform}`)
  }

  return Number(matrixMatch[1])
}

test('publishes the AI Ops preset and renders its runtime canvas', async ({ page }) => {
  await page.goto('/big-screens/new')

  await expect(page.getByLabel('Designer canvas')).toBeVisible()
  await expect(page.getByTestId('dashboard-name-input')).toBeVisible()

  await page.getByTestId('apply-preset-button').click()
  await expect(page.getByText(PRESET_TITLE)).toBeVisible()
  await expect(page.getByText('Total AI Requests')).toBeVisible()

  await page.getByTestId('publish-dashboard-button').click()

  const previewLink = page.getByTestId('preview-runtime-link')
  await expect(previewLink).toHaveAttribute('aria-disabled', 'false')
  await expect(previewLink).toHaveAttribute('href', /\/runtime\//)

  const runtimeHref = await previewLink.getAttribute('href')
  expect(runtimeHref).toBeTruthy()

  await page.goto(runtimeHref!)

  await expect(page.getByText(PRESET_TITLE)).toBeVisible()
  await expect(page.getByText('Total AI Requests')).toBeVisible()
  await expect(page.getByText('128,430').first()).toBeVisible()
  await expect(page.getByText('Resolution Trend')).toBeVisible()
  await expect(page.getByText('Workload Mix')).toBeVisible()
  await expect(page.getByText('Operational Queue Detail')).toBeVisible()
  await expect(page.getByText('Pending questions')).toBeVisible()
  await expect(
    page.getByText(/Runtime unavailable|Data unavailable|Chart unavailable|Table unavailable|No visible components/i),
  ).toHaveCount(0)

  const runtimeCanvas = page.locator('.runtime-scaler__canvas')
  await expect(runtimeCanvas).toBeVisible()

  const transform = await runtimeCanvas.evaluate((element) => window.getComputedStyle(element).transform)
  const scale = parseScale(transform)
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()

  const expectedScale = Math.min(viewport!.width / 1920, viewport!.height / 1080)
  expect(scale).toBeGreaterThanOrEqual(expectedScale - SCALE_TOLERANCE)
  expect(scale).toBeLessThanOrEqual(expectedScale + SCALE_TOLERANCE)

  const boundingBox = await runtimeCanvas.boundingBox()
  expect(boundingBox).not.toBeNull()

  if (viewport!.width === 1920 && viewport!.height === 1080) {
    expect(scale).toBe(1)
    expect(Math.round(boundingBox!.x)).toBe(0)
    expect(Math.round(boundingBox!.y)).toBe(0)
  }
})
