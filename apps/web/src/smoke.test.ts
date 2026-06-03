import { describe, expect, test } from 'vitest'
import { router } from './router'

describe('web smoke test', () => {
  test('registers expected application routes', () => {
    const routePaths = router.getRoutes().map((route) => route.path)

    expect(routePaths).toEqual(expect.arrayContaining([
      '/',
      '/big-screens/:id',
      '/runtime/:id',
      '/share/:token',
    ]))
  })
})
