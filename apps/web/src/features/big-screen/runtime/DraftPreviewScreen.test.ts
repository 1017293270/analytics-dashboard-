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

function createTwoKWorkbenchSchema(): DashboardSchema {
  return {
    ...createDefaultDashboardSchema(),
    canvas: { width: 2560, height: 1440, background: { type: 'color', value: '#021b12' }, scaleMode: 'fit-screen' },
    components: [
      {
        id: 'dashboard-research-title',
        type: 'text',
        name: '教研主任教师发展工作台',
        layout: { x: 64, y: 53, width: 1200, height: 85, zIndex: 1, visible: true },
        props: {},
        style: {},
      },
      ...[
        'research-teacher-index',
        'research-task-count',
        'research-activity-count',
        'research-app-launches',
      ].map((id, index) => ({
        id,
        type: 'metric-card' as const,
        name: `指标 ${index + 1}`,
        layout: { x: 64 + index * 466, y: 240, width: 440, height: 227, zIndex: 2, visible: true },
        props: {},
        style: {},
      })),
      {
        id: 'research-task-trend',
        type: 'line-chart',
        name: '教研任务趋势',
        layout: { x: 64, y: 480, width: 1120, height: 480, zIndex: 3, visible: true },
        props: {},
        style: {},
      },
      {
        id: 'research-capability',
        type: 'radar-chart',
        name: '教师能力画像',
        layout: { x: 1237, y: 480, width: 573, height: 480, zIndex: 3, visible: true },
        props: {},
        style: {},
      },
      {
        id: 'research-activity-mix',
        type: 'pie-chart',
        name: '课堂活动类型',
        layout: { x: 64, y: 1000, width: 747, height: 347, zIndex: 3, visible: true },
        props: {},
        style: {},
      },
      {
        id: 'research-task-table',
        type: 'table',
        name: '教研任务明细',
        layout: { x: 864, y: 1000, width: 947, height: 347, zIndex: 3, visible: true },
        props: {},
        style: {},
      },
      {
        id: 'dashboard-research-bottom-rule',
        type: 'decoration',
        name: '底部装饰',
        layout: { x: 64, y: 1370, width: 2432, height: 32, zIndex: 0, visible: true },
        props: {},
        style: {},
      },
    ],
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
          template: '<span data-testid="draft-preview-component">{{ component.name }}:{{ component.layout.x }}</span>',
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

  test('normalizes saved 2K education workbench drafts for fullscreen preview', async () => {
    vi.mocked(bigScreenApi.getDashboard).mockResolvedValue({
      ...createDashboardRecord(),
      draftSchema: createTwoKWorkbenchSchema(),
    })

    const { wrapper } = await mountDraftPreview('/workbenches/dashboard-research/preview')
    const table = wrapper.findAll('[data-testid="draft-preview-component"]').find((item) => item.text().includes('教研任务明细'))

    expect(table?.text()).toContain('教研任务明细:880')
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
