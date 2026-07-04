import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test } from 'vitest'
import { nextTick } from 'vue'
import { getChartThemeById } from '../components/chartThemes'
import { createComponent } from '../components/registry'
import { bigScreenText } from '../i18n/zh-CN'
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

    expect(wrapper.get('[data-testid="property-empty"]').text()).toContain(bigScreenText.propertyPanel.emptyTitle)
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

  test('updates third-party web embed URL without persisting unsafe schemes', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.addComponent(createComponent('web-embed', 20, 30, 1))
    await nextTick()

    await wrapper.get('[data-testid="web-embed-url-input"]').setValue('https://demo.school.local/teacher-bi')
    await wrapper.get('[data-testid="web-embed-url-input"]').trigger('change')

    expect(store.selectedComponent?.props.url).toBe('https://demo.school.local/teacher-bi')

    await wrapper.get('[data-testid="web-embed-url-input"]').setValue('javascript:alert(1)')
    await wrapper.get('[data-testid="web-embed-url-input"]').trigger('change')

    expect(store.selectedComponent?.props.url).toBe('https://demo.school.local/teacher-bi')
    expect((wrapper.get('[data-testid="web-embed-url-input"]').element as HTMLInputElement).value).toBe(
      'javascript:alert(1)',
    )
    expect(wrapper.text()).toContain('仅支持 https://')

    await wrapper.get('[data-testid="web-embed-url-input"]').setValue('http://example.com/public-bi')
    await wrapper.get('[data-testid="web-embed-url-input"]').trigger('change')

    expect(store.selectedComponent?.props.url).toBe('https://demo.school.local/teacher-bi')
    expect(wrapper.text()).toContain('仅支持 https://')

    await wrapper.get('[data-testid="web-embed-url-input"]').setValue('https:example.com/public-bi')
    await wrapper.get('[data-testid="web-embed-url-input"]').trigger('change')

    expect(store.selectedComponent?.props.url).toBe('https://demo.school.local/teacher-bi')
    expect(wrapper.text()).toContain('仅支持 https://')
  })

  test('converts chart type from the visual picker while preserving compatible component state', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.patchSchema((draft) => {
      draft.dataBindings['binding-1'] = {
        id: 'binding-1',
        sourceType: 'mock',
        query: { dimensions: ['category'], metrics: ['value'] },
      }
    })
    const component = {
      ...createComponent('bar-chart', 20, 30, 1),
      dataBindingId: 'binding-1',
      props: { ...createComponent('bar-chart').props, title: 'Revenue Focus' },
      style: {
        ...createComponent('bar-chart').style,
        backgroundColor: '#111827',
        fontColor: '#f8fafc',
        borderColor: '#334155',
      },
    }
    const layout = { ...component.layout }
    store.addComponent(component)
    await nextTick()

    await wrapper.get('[data-testid="chart-preset-pie-rose"]').trigger('click')

    expect(store.selectedComponent).toMatchObject({
      id: component.id,
      type: 'pie-chart',
      name: bigScreenText.components.names.pieChart,
      layout,
      dataBindingId: 'binding-1',
      props: expect.objectContaining({
        title: 'Revenue Focus',
        chartType: 'pie',
        variant: 'pie-rose',
      }),
      style: expect.objectContaining({
        backgroundColor: '#111827',
        fontColor: '#f8fafc',
        borderColor: '#334155',
        accentColor: '#fb7185',
      }),
    })
  })

  test('applies chart color themes while preserving non-color component state', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.patchSchema((draft) => {
      draft.dataBindings['binding-1'] = {
        id: 'binding-1',
        sourceType: 'mock',
        query: { dimensions: ['category'], metrics: ['value'] },
      }
    })
    const component = {
      ...createComponent('bar-chart', 20, 30, 1),
      dataBindingId: 'binding-1',
      props: { ...createComponent('bar-chart').props, title: 'Revenue Focus' },
      style: {
        ...createComponent('bar-chart').style,
        backgroundBlur: 18,
      },
    }
    const layout = { ...component.layout }
    const theme = getChartThemeById('high-contrast')
    if (!theme) throw new Error('Expected high-contrast chart theme')
    store.addComponent(component)
    await nextTick()

    await wrapper.get('[data-testid="chart-theme-trigger"]').trigger('click')
    expect(wrapper.find('[data-testid="chart-theme-menu"]').exists()).toBe(true)
    await wrapper.get('[data-testid="chart-theme-option-high-contrast"]').trigger('click')

    expect(store.selectedComponent).toMatchObject({
      id: component.id,
      type: 'bar-chart',
      layout,
      dataBindingId: 'binding-1',
      props: expect.objectContaining({ title: 'Revenue Focus' }),
      style: expect.objectContaining({
        ...theme.style,
        backgroundBlur: 18,
      }),
    })
    expect(wrapper.get('[data-testid="chart-theme-trigger"]').text()).toContain(
      bigScreenText.chartThemes.titles.highContrast,
    )
  })

  test('updates color fields from popover controls and professional text input', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.addComponent(createComponent('metric-card', 20, 30, 1))
    await nextTick()

    await wrapper.get('[data-testid="color-trigger-accentColor"]').trigger('click')
    expect(wrapper.find('[data-testid="color-popover-accentColor"]').exists()).toBe(true)

    await wrapper.get('[data-testid="color-popover-swatch-accentColor-0"]').trigger('click')
    expect(store.selectedComponent?.style.accentColor).toBe('#2563eb')

    await wrapper.get('[data-testid="color-hex-accentColor"]').setValue('#123456')
    await wrapper.get('[data-testid="color-hex-accentColor"]').trigger('change')
    expect(store.selectedComponent?.style.accentColor).toBe('#123456')

    await wrapper.get('[data-testid="color-r-accentColor"]').setValue('10')
    await wrapper.get('[data-testid="color-r-accentColor"]').trigger('change')
    expect(store.selectedComponent?.style.accentColor).toBe('#0A3456')

    await wrapper.get('[data-testid="color-alpha-accentColor"]').setValue('40')
    expect(store.selectedComponent?.style.accentColor).toBe('rgba(10, 52, 86, 0.4)')

    await wrapper.get('[data-testid="color-transparent-accentColor"]').trigger('click')
    expect(store.selectedComponent?.style.accentColor).toBe('transparent')

    const textInput = wrapper.get('[data-testid="color-input-accentColor"]')
    await textInput.setValue('rgba(1, 2, 3, 0.4)')
    await textInput.trigger('change')
    expect(store.selectedComponent?.style.accentColor).toBe('rgba(1, 2, 3, 0.4)')

    await textInput.setValue('')
    await textInput.trigger('change')
    expect(store.selectedComponent?.style.accentColor).toBeUndefined()
  })

  test('restores default color, updates background blur, and closes the popover', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.addComponent({
      ...createComponent('bar-chart', 20, 30, 1),
      style: { backgroundColor: '#111827', backgroundBlur: 16 },
    })
    await nextTick()

    await wrapper.get('[data-testid="color-trigger-backgroundColor"]').trigger('click')
    await wrapper.get('[data-testid="color-blur-backgroundColor"]').setValue('24')
    expect(store.selectedComponent?.style.backgroundBlur).toBe(24)

    await wrapper.get('[data-testid="color-reset-backgroundColor"]').trigger('click')
    expect(store.selectedComponent?.style.backgroundColor).toBe('rgba(15, 23, 42, 0.82)')
    expect(store.selectedComponent?.style.backgroundBlur).toBe(0)

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('[data-testid="color-popover-backgroundColor"]').exists()).toBe(false)

    await wrapper.get('[data-testid="color-trigger-backgroundColor"]').trigger('click')
    expect(wrapper.find('[data-testid="color-popover-backgroundColor"]').exists()).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('[data-testid="color-popover-backgroundColor"]').exists()).toBe(false)
  })

  test('disables edits for locked components and allows unlocking', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    const component = createComponent('bar-chart', 20, 30, 1)
    store.addComponent({ ...component, layout: { ...component.layout, locked: true } })
    await nextTick()

    expect(wrapper.get('[data-testid="component-name-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="layout-x-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="chart-preset-pie-rose"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="chart-theme-trigger"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="color-input-accentColor"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="color-trigger-accentColor"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="component-locked-input"]').setValue(false)

    expect(store.selectedComponent?.layout.locked).toBe(false)
    await nextTick()
    expect(wrapper.get('[data-testid="layout-x-input"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="chart-preset-pie-rose"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="chart-theme-trigger"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-testid="color-trigger-accentColor"]').attributes('disabled')).toBeUndefined()
  })

  test('disables selected component edits while saving', async () => {
    const wrapper = mountWithPinia()
    const store = useDashboardDesignerStore()
    store.addComponent(createComponent('bar-chart', 20, 30, 1))
    store.isSaving = true
    await nextTick()

    expect(wrapper.get('[data-testid="component-name-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="layout-x-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="component-locked-input"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="chart-preset-pie-rose"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="chart-theme-trigger"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="color-input-accentColor"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="color-trigger-accentColor"]').attributes('disabled')).toBeDefined()
  })
})
