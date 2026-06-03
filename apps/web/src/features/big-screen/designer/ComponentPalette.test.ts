import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import ComponentPalette from './ComponentPalette.vue'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

describe('ComponentPalette', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('adds and selects components from the registry', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(ComponentPalette, { global: { plugins: [pinia] } })
    const store = useDashboardDesignerStore()

    await wrapper.get('[data-testid="add-text"]').trigger('click')

    expect(store.schema.components).toHaveLength(1)
    expect(store.selectedComponent).toMatchObject({ type: 'text', name: 'Text' })
  })

  test('disables component creation while saving', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(ComponentPalette, { global: { plugins: [pinia] } })
    const store = useDashboardDesignerStore()
    store.isSaving = true
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="add-text"]').attributes('disabled')).toBeDefined()
  })
})
