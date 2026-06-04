import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { aiOperationsPreset } from '../presets/presets'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import DesignerToolbar from './DesignerToolbar.vue'

function mountToolbar() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return {
    store: useDashboardDesignerStore(),
    wrapper: mount(DesignerToolbar, { global: { plugins: [pinia] } }),
  }
}

describe('DesignerToolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  test('allows valid local drafts to save through create-on-save flow', async () => {
    const { store, wrapper } = mountToolbar()
    const saveDraft = vi.fn()
    store.saveDraft = saveDraft

    const saveButton = wrapper.get('[data-testid="save-dashboard-button"]')
    expect(saveButton.attributes('disabled')).toBeUndefined()

    await saveButton.trigger('click')

    expect(saveDraft).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('LOCAL')
    expect(wrapper.text()).toContain('Ready to create')
  })

  test('shows persisted dashboard record status and disables invalid names', async () => {
    const { store, wrapper } = mountToolbar()
    store.dashboardId = 'dashboard-1'
    store.dashboardStatus = 'published'
    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('   ')

    expect(wrapper.text()).toContain('PUBLISHED')
    expect(wrapper.get('[data-testid="save-dashboard-button"]').attributes('disabled')).toBeDefined()
  })

  test('shows name-only dirty state and freezes name edits while saving', async () => {
    const { store, wrapper } = mountToolbar()
    store.dashboardId = 'dashboard-1'
    store.dashboardName = 'Saved Name'
    store.savedDashboardName = 'Saved Name'
    await wrapper.get('[data-testid="dashboard-name-input"]').setValue('Changed Name')

    expect(wrapper.text()).toContain('Unsaved changes')

    store.isSaving = true
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="dashboard-name-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="save-dashboard-button"]').attributes('disabled')).toBeDefined()
  })

  test('applies the AI operations preset from the toolbar', async () => {
    const { store, wrapper } = mountToolbar()
    const applyPreset = vi.fn()
    store.applyPreset = applyPreset

    await wrapper.get('[data-testid="apply-preset-button"]').trigger('click')

    expect(applyPreset).toHaveBeenCalledWith(aiOperationsPreset)
  })

  test('keeps preview inert until the dashboard is published and clean', async () => {
    const { store, wrapper } = mountToolbar()
    const previewLink = wrapper.get('[data-testid="preview-runtime-link"]')

    expect(previewLink.attributes('href')).toBeUndefined()
    expect(previewLink.attributes('aria-disabled')).toBe('true')
    expect(previewLink.attributes('tabindex')).toBe('-1')
    expect(previewLink.attributes('title')).toBe('Publish saved changes before previewing')

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
    expect(enabledPreviewLink.attributes('title')).toBe('Open published runtime preview')

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
      'Create, save, and publish dashboard',
    )

    store.dashboardId = 'dashboard-1'
    await wrapper.vm.$nextTick()

    const publishButton = wrapper.get('[data-testid="publish-dashboard-button"]')
    expect(publishButton.attributes('disabled')).toBeUndefined()
    expect(publishButton.attributes('title')).toBe('Publish dashboard')
    await publishButton.trigger('click')
    expect(publish).toHaveBeenCalledOnce()

    store.isSaving = true
    store.activeSaveIntent = 'publish'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Publishing')
    expect(wrapper.get('[data-testid="publish-dashboard-button"]').text()).toBe('Publishing')
  })
})
