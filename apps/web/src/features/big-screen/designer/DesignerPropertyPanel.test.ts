import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { createComponent } from '../components/registry'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import DesignerPropertyPanel from './DesignerPropertyPanel.vue'

function mountWithPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(DesignerPropertyPanel, {
    global: { plugins: [pinia] },
  })
}

describe('DesignerPropertyPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('renders an empty selection state', () => {
    const wrapper = mountWithPinia()

    expect(wrapper.get('[data-testid="property-empty"]').text()).toContain('No component selected')
  })

  test('updates selected component fields through the designer store', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.addComponent(createComponent('text', 20, 30, 1))
    await nextTick()

    await wrapper.get('[data-testid="component-name-input"]').setValue('Command Title')
    await wrapper.get('[data-testid="component-name-input"]').trigger('change')

    await wrapper.get('[data-testid="layout-x-input"]').setValue('-50')
    await wrapper.get('[data-testid="layout-x-input"]').trigger('change')

    expect(store.selectedComponent?.name).toBe('Command Title')
    expect(store.selectedComponent?.layout.x).toBe(0)
  })

  test('disables edits for locked components and allows unlocking', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    const component = createComponent('text', 20, 30, 1)
    store.addComponent({ ...component, layout: { ...component.layout, locked: true } })
    await nextTick()

    expect(wrapper.get('[data-testid="component-name-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="layout-x-input"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="component-locked-input"]').setValue(false)

    expect(store.selectedComponent?.layout.locked).toBe(false)
    await nextTick()
    expect(wrapper.get('[data-testid="layout-x-input"]').attributes('disabled')).toBeUndefined()
  })
})
