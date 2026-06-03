import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { createComponent } from '../components/registry'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'
import DesignerCanvas from './DesignerCanvas.vue'

function mountCanvas() {
  const pinia = createPinia()
  setActivePinia(pinia)

  return {
    store: useDashboardDesignerStore(),
    wrapper: mount(DesignerCanvas, { global: { plugins: [pinia] } }),
  }
}

describe('DesignerCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('does not move or delete locked components from keyboard controls', async () => {
    const { store, wrapper } = mountCanvas()
    const component = createComponent('text', 20, 30, 1)
    store.addComponent({ ...component, layout: { ...component.layout, locked: true } })
    await wrapper.vm.$nextTick()

    const frame = wrapper.get('.designer-canvas__component-frame')
    await frame.trigger('keydown', { key: 'ArrowRight' })
    await frame.trigger('keydown', { key: 'Delete' })

    expect(store.schema.components).toHaveLength(1)
    expect(store.selectedComponent?.layout).toMatchObject({ x: 20, locked: true })
    expect(wrapper.find('.designer-canvas__resize-handle').exists()).toBe(false)
  })
})
