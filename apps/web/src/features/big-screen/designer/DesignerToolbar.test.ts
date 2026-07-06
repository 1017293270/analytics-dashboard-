import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { bigScreenText } from '../i18n/zh-CN'
import { bigScreenPresets } from '../presets/presets'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import DesignerToolbar from './DesignerToolbar.vue'

function mountToolbar() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return {
    store: useDashboardDesignerStore(),
    wrapper: mount(DesignerToolbar, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    }),
  }
}

describe('DesignerToolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  test('offers a stable return link to the dashboard library', () => {
    const { wrapper } = mountToolbar()
    const libraryLink = wrapper.get('[data-testid="dashboard-library-link"]')

    expect(libraryLink.attributes('href')).toBe('/workbenches')
    expect(libraryLink.attributes('aria-label')).toBe(bigScreenText.common.actions.backToLibrary)
    expect(libraryLink.attributes('title')).toBe(bigScreenText.common.actions.backToLibrary)
    expect(libraryLink.find('svg').exists()).toBe(true)
  })

  test('allows valid local drafts to save through create-on-save flow', async () => {
    const { store, wrapper } = mountToolbar()
    const saveDraft = vi.fn()
    store.saveDraft = saveDraft

    const saveButton = wrapper.get('[data-testid="save-dashboard-button"]')
    expect(saveButton.attributes('disabled')).toBeUndefined()

    await saveButton.trigger('click')

    expect(saveDraft).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain(bigScreenText.common.status.local)
    expect(wrapper.text()).toContain(bigScreenText.designer.toolbar.readyToCreate)
  })

  test('shows persisted dashboard record status and disables invalid names', async () => {
    const { store, wrapper } = mountToolbar()
    store.dashboardId = 'dashboard-1'
    store.dashboardStatus = 'published'
    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('   ')

    expect(wrapper.text()).toContain(bigScreenText.common.status.published)
    expect(wrapper.get('[data-testid="save-dashboard-button"]').attributes('disabled')).toBeDefined()
  })

  test('shows name-only dirty state and freezes name edits while saving', async () => {
    const { store, wrapper } = mountToolbar()
    store.dashboardId = 'dashboard-1'
    store.dashboardName = 'Saved Name'
    store.savedDashboardName = 'Saved Name'
    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('Changed Name')

    expect(wrapper.text()).toContain(bigScreenText.designer.toolbar.unsavedChanges)

    store.isSaving = true
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="dashboard-name-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="save-dashboard-button"]').attributes('disabled')).toBeDefined()
  })

  test('applies a selected preset from the toolbar menu', async () => {
    const { store, wrapper } = mountToolbar()
    const applyPreset = vi.fn()
    store.applyPreset = applyPreset

    await wrapper.get('[data-testid="preset-select"]').setValue('business-kpi')

    expect(applyPreset).toHaveBeenCalledWith(bigScreenPresets[1]?.schema)
  })

  test('resizes the dashboard canvas from the toolbar presets', async () => {
    const { store, wrapper } = mountToolbar()
    const resizeCanvas = vi.fn()
    store.resizeCanvas = resizeCanvas

    await wrapper.get('[data-testid="canvas-resolution-select"]').setValue('2560x1440')

    expect(resizeCanvas).toHaveBeenCalledWith({ width: 2560, height: 1440, scaleComponents: true })

    await wrapper.get('[data-testid="canvas-scale-toggle"]').setValue(false)
    await wrapper.get('[data-testid="canvas-resolution-select"]').setValue('3840x2160')

    expect(resizeCanvas).toHaveBeenLastCalledWith({ width: 3840, height: 2160, scaleComponents: false })
  })

  test('applies a custom dashboard canvas resolution from the toolbar', async () => {
    const { store, wrapper } = mountToolbar()
    const resizeCanvas = vi.fn()
    store.resizeCanvas = resizeCanvas

    await wrapper.get('[data-testid="canvas-resolution-select"]').setValue('custom')
    await wrapper.get('[data-testid="custom-canvas-width-input"]').setValue('3000')
    await wrapper.get('[data-testid="custom-canvas-height-input"]').setValue('1200')
    await wrapper.get('[data-testid="apply-custom-resolution-button"]').trigger('click')

    expect(resizeCanvas).toHaveBeenCalledWith({ width: 3000, height: 1200, scaleComponents: true })
  })
  test('disables preset selection while saving', async () => {
    const { store, wrapper } = mountToolbar()

    store.isSaving = true
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="preset-select"]').attributes('disabled')).toBeDefined()
  })

  test('keeps preview inert until the dashboard is published and clean', async () => {
    const { store, wrapper } = mountToolbar()
    const previewLink = wrapper.get('[data-testid="preview-runtime-link"]')

    expect(previewLink.attributes('href')).toBeUndefined()
    expect(previewLink.attributes('aria-disabled')).toBe('true')
    expect(previewLink.attributes('tabindex')).toBe('-1')
    expect(previewLink.attributes('title')).toBe(bigScreenText.designer.toolbar.publishSavedFirst)

    store.dashboardId = 'dashboard-1'
    await wrapper.vm.$nextTick()

    const draftPreviewLink = wrapper.get('[data-testid="preview-runtime-link"]')
    expect(draftPreviewLink.attributes('href')).toBeUndefined()
    expect(draftPreviewLink.attributes('aria-disabled')).toBe('true')

    store.dashboardStatus = 'published'
    await wrapper.vm.$nextTick()

    const enabledPreviewLink = wrapper.get('[data-testid="preview-runtime-link"]')
    expect(enabledPreviewLink.attributes('href')).toBe('/runtime/dashboard-1')
    expect(enabledPreviewLink.attributes('target')).toBe('_blank')
    expect(enabledPreviewLink.attributes('aria-disabled')).toBe('false')
    expect(enabledPreviewLink.attributes('tabindex')).toBe('0')
    expect(enabledPreviewLink.attributes('title')).toBe(bigScreenText.designer.toolbar.openPublishedPreview)

    store.dashboardName = 'Dirty dashboard'
    await wrapper.vm.$nextTick()

    const dirtyPreviewLink = wrapper.get('[data-testid="preview-runtime-link"]')
    expect(dirtyPreviewLink.attributes('href')).toBeUndefined()
    expect(dirtyPreviewLink.attributes('aria-disabled')).toBe('true')
  })

  test('publishes available dashboards and surfaces publishing state', async () => {
    const { store, wrapper } = mountToolbar()
    const publish = vi.fn()
    store.publish = publish

    expect(wrapper.get('[data-testid="publish-dashboard-button"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="publish-dashboard-button"]').attributes('title')).toBe(
      bigScreenText.designer.toolbar.createAndPublish,
    )

    store.dashboardId = 'dashboard-1'
    await wrapper.vm.$nextTick()

    const publishButton = wrapper.get('[data-testid="publish-dashboard-button"]')
    expect(publishButton.attributes('disabled')).toBeUndefined()
    expect(publishButton.attributes('title')).toBe(bigScreenText.designer.toolbar.publishDashboard)
    await publishButton.trigger('click')
    expect(publish).toHaveBeenCalledOnce()

    store.isSaving = true
    store.activeSaveIntent = 'publish'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain(bigScreenText.common.actions.publishing)
    expect(wrapper.get('[data-testid="publish-dashboard-button"]').text()).toBe(bigScreenText.common.actions.publishing)
  })
})
