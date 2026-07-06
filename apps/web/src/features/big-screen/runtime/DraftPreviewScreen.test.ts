import type { DashboardComponent, DashboardSchema } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { bigScreenApi, type DashboardRecord } from '../api/bigScreenApi'
import { createDefaultDashboardSchema } from '../schema/defaults'
import DraftPreviewScreen from './DraftPreviewScreen.vue'

vi.mock('../api/bigScreenApi', () => ({
  bigScreenApi: {
    getDashboard: vi.fn(),
  },
}))

function createPreviewComponent(): DashboardComponent {
  return {
    id: 'overview-title',
    type: 'text',
    name: '校级总览',
    layout: { x: 16, y: 16, width: 420, height: 88, zIndex: 1, visible: true },
    props: { text: '未来实验学校数据总览' },
    style: {},
  }
}

function createPreviewSchema(): DashboardSchema {
  const schema = createDefaultDashboardSchema()

  return {
    ...schema,
    components: [createPreviewComponent()],
  }
}

function createDashboardRecord(): DashboardRecord {
  return {
    id: 'dashboard-all',
    name: '未来实验学校数据总览',
    description: '全员可查看的校级驾驶舱',
    status: 'draft',
    draftSchema: createPreviewSchema(),
    publishedSchema: null,
    createdAt: '2026-07-09T10:00:00.000Z',
    updatedAt: '2026-07-09T10:30:00.000Z',
    publishedAt: null,
  }
}

async function mountDraftPreview(path = '/workbenches/dashboard-all/preview') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/workbenches/:id/preview', component: DraftPreviewScreen }],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(DraftPreviewScreen, {
    global: {
      plugins: [router],
      stubs: {
        RuntimeScaler: { template: '<section data-testid="draft-preview-stage"><slot /></section>' },
        RuntimeComponent: {
          props: ['component', 'schema'],
          template: '<span data-testid="draft-preview-component">{{ component.name }}</span>',
        },
      },
    },
  })

  await flushPromises()
  return { wrapper, router }
}

describe('DraftPreviewScreen', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('loads a dashboard draft schema for fullscreen preview without configuration controls', async () => {
    vi.mocked(bigScreenApi.getDashboard).mockResolvedValue(createDashboardRecord())

    const { wrapper } = await mountDraftPreview()

    expect(bigScreenApi.getDashboard).toHaveBeenCalledWith('dashboard-all')
    expect(wrapper.find('[data-testid="draft-preview-screen"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="draft-preview-component"]').text()).toContain('校级总览')
    expect(wrapper.get('[data-testid="draft-preview-fullscreen-button"]').text()).toContain('全屏')
    expect(wrapper.text()).not.toContain('组件库')
    expect(wrapper.text()).not.toContain('属性配置')
  })

  test('requests browser fullscreen from the lightweight preview action', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    vi.mocked(bigScreenApi.getDashboard).mockResolvedValue(createDashboardRecord())

    const { wrapper } = await mountDraftPreview()

    await wrapper.get('[data-testid="draft-preview-fullscreen-button"]').trigger('click')

    expect(requestFullscreen).toHaveBeenCalledTimes(1)
  })

  test('shows an error state when draft preview loading fails', async () => {
    vi.mocked(bigScreenApi.getDashboard).mockRejectedValue(new Error('加载失败'))

    const { wrapper } = await mountDraftPreview()

    expect(wrapper.text()).toContain('大屏暂时无法预览')
    expect(wrapper.text()).toContain('加载失败')
  })
})
