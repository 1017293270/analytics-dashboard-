import { describe, expect, test } from 'vitest'
import { calculateFitScreenScale, calculateRuntimeScale } from './runtime-scale'

describe('runtime scale utilities', () => {
  test('uses the smaller ratio for fit-screen scaling', () => {
    expect(
      calculateFitScreenScale({
        viewportWidth: 1280,
        viewportHeight: 720,
        canvasWidth: 1920,
        canvasHeight: 1080,
      }),
    ).toBeCloseTo(0.6667, 4)
  })

  test('keeps fit-screen constrained by height in a wide viewport', () => {
    expect(
      calculateRuntimeScale({
        scaleMode: 'fit-screen',
        viewportWidth: 2560,
        viewportHeight: 720,
        canvasWidth: 1920,
        canvasHeight: 1080,
      }),
    ).toBeCloseTo(0.6667, 4)
  })

  test('uses viewport width for fit-width scaling', () => {
    expect(
      calculateRuntimeScale({
        scaleMode: 'fit-width',
        viewportWidth: 960,
        viewportHeight: 1080,
        canvasWidth: 1920,
        canvasHeight: 1080,
      }),
    ).toBe(0.5)
  })

  test('returns one for fixed scale mode', () => {
    expect(
      calculateRuntimeScale({
        scaleMode: 'fixed',
        viewportWidth: 960,
        viewportHeight: 540,
        canvasWidth: 1920,
        canvasHeight: 1080,
      }),
    ).toBe(1)
  })

  test('returns a safe value for invalid dimensions', () => {
    expect(
      calculateRuntimeScale({
        scaleMode: 'fit-screen',
        viewportWidth: Number.NaN,
        viewportHeight: 0,
        canvasWidth: 1920,
        canvasHeight: Number.POSITIVE_INFINITY,
      }),
    ).toBe(1)
  })
})
