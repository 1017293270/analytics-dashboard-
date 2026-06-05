import { describe, expect, test } from 'vitest'
import { bigScreenText } from '../i18n/zh-CN'
import { chartThemeRegistry, getChartThemeById, getMatchingChartThemeId } from './chartThemes'

describe('chartThemeRegistry', () => {
  test('provides compact chart theme presets with complete style patches', () => {
    expect(chartThemeRegistry.length).toBeGreaterThanOrEqual(8)

    for (const theme of chartThemeRegistry) {
      expect(theme.id).toBeTruthy()
      expect(theme.title).toBeTruthy()
      expect(theme.seriesColors.length).toBeGreaterThanOrEqual(5)
      expect(theme.style).toMatchObject({
        backgroundColor: expect.any(String),
        fontColor: expect.any(String),
        accentColor: theme.seriesColors[0],
        borderColor: expect.any(String),
        seriesColors: theme.seriesColors,
      })
    }
  })

  test('finds themes by id and detects exact style matches', () => {
    const theme = getChartThemeById('high-contrast')
    if (!theme) throw new Error('Expected high-contrast chart theme')

    expect(theme.title).toBe(bigScreenText.chartThemes.titles.highContrast)
    expect(getMatchingChartThemeId(theme.style)).toBe('high-contrast')
    expect(getMatchingChartThemeId({ ...theme.style, accentColor: '#123456' })).toBe('')
  })
})
