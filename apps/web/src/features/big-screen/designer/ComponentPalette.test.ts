import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { bigScreenText } from '../i18n/zh-CN'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import ComponentPalette from './ComponentPalette.vue'

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
    expect(store.selectedComponent).toMatchObject({ type: 'text', name: bigScreenText.components.names.text })
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
