import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
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
})
