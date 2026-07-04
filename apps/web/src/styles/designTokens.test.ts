import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const stylesDir = dirname(fileURLToPath(import.meta.url))
const tokensCss = readFileSync(resolve(stylesDir, 'tokens.css'), 'utf8')
const elementThemeCss = readFileSync(resolve(stylesDir, 'element-theme.css'), 'utf8')

describe('design tokens brand theme', () => {
  test('uses the emerald accent ramp for product brand tokens', () => {
    expect(tokensCss).toContain('--color-accent: #059669')
    expect(tokensCss).toContain('--color-accent-strong: #047857')
    expect(tokensCss).toContain('--color-accent-soft: #d1fae5')
    expect(tokensCss).toContain('--color-accent-50: #ecfdf5')
    expect(tokensCss).toContain('--color-accent-100: #d1fae5')
    expect(tokensCss).toContain('--color-accent-200: #a7f3d0')
    expect(tokensCss).toContain('--color-accent-300: #6ee7b7')
    expect(tokensCss).toContain('--color-accent-400: #34d399')
    expect(tokensCss).toContain('--color-accent-500: #10b981')
    expect(tokensCss).toContain('--color-accent-600: #059669')
    expect(tokensCss).toContain('--color-accent-700: #047857')
    expect(tokensCss).toContain('--color-accent-800: #065f46')
    expect(tokensCss).toContain('--color-accent-900: #064e3b')
    expect(tokensCss).toContain('--brand: #059669')
  })

  test('keeps brand surfaces and shadows free of blue primary leftovers', () => {
    expect(tokensCss).toContain('--color-sidebar-active: rgba(5, 150, 105, 0.18)')
    expect(tokensCss).toContain('--color-border-accent: #a7f3d0')
    expect(tokensCss).toContain('--shadow-lift: 0 8px 28px rgba(5, 150, 105, 0.16)')
    expect(tokensCss).toContain('--shadow-glow: 0 0 0 4px rgba(5, 150, 105, 0.14)')
    expect(tokensCss).not.toMatch(/rgba\(37,\s*99,\s*235,/)
    expect(tokensCss).not.toMatch(/full blue|blue-aligned/i)
  })

  test('maps Element Plus primary states to the emerald ramp', () => {
    expect(elementThemeCss).toContain('full emerald ramp')
    expect(elementThemeCss).toContain('--el-color-primary-light-1: #1ba774')
    expect(elementThemeCss).toContain('--el-color-primary-light-2: #2fb07f')
    expect(elementThemeCss).toContain('--el-color-primary-light-3: #34d399')
    expect(elementThemeCss).toContain('--el-color-primary-light-4: #52dba8')
    expect(elementThemeCss).toContain('--el-color-primary-light-5: #6ee7b7')
    expect(elementThemeCss).toContain('--el-color-primary-light-6: #8fecd0')
    expect(elementThemeCss).toContain('--el-color-primary-light-7: #b6f2dd')
    expect(elementThemeCss).toContain('--el-color-primary-light-8: #d1fae5')
    expect(elementThemeCss).toContain('--el-color-primary-light-9: var(--color-accent-50)')
    expect(elementThemeCss).toContain('--el-color-primary-dark-2: var(--color-accent-strong)')
    expect(elementThemeCss).toContain('box-shadow: 0 4px 12px rgba(5, 150, 105, 0.24)')
    expect(elementThemeCss).not.toMatch(/rgba\(37,\s*99,\s*235,/)
    expect(elementThemeCss).not.toMatch(/full blue|blue ramp/i)
  })
})
