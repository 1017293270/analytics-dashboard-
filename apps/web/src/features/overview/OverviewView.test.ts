import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, test } from 'vitest'
import OverviewView from './OverviewView.vue'

describe('OverviewView', () => {
  test('renders overview KPIs and operational lists', () => {
    const wrapper = mount(OverviewView, {
      global: { plugins: [ElementPlus] },
    })

    expect(wrapper.text()).toContain('首页总览')
    expect(wrapper.text()).toContain('设备在线率')
    expect(wrapper.text()).toContain('今日告警')
    expect(wrapper.text()).toContain('工作台发布')
    expect(wrapper.findAll('.el-card').length).toBeGreaterThanOrEqual(4)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })
})
