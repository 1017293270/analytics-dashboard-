import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AccountsView from './AccountsView.vue'

const elementStubs = {
  ElSelect: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<select :data-testid="$attrs[\'data-testid\']" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  ElOption: {
    props: ['label', 'value'],
    template: '<option :value="value">{{ label }}</option>',
  },
  teleport: true,
}

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
  }
})

async function mountAccountsView() {
  const wrapper = mount(AccountsView, {
    global: {
      plugins: [ElementPlus],
      stubs: elementStubs,
    },
  })

  await flushPromises()
  return wrapper
}

describe('AccountsView', () => {
  beforeEach(() => {
    vi.mocked(ElMessage.error).mockReset()
    vi.mocked(ElMessage.success).mockReset()
    vi.mocked(ElMessageBox.confirm).mockReset()
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(
      'confirm' as unknown as Awaited<ReturnType<typeof ElMessageBox.confirm>>,
    )
  })

  test('renders summary cards, account table, role table, and visibility preview', async () => {
    const wrapper = await mountAccountsView()

    expect(wrapper.text()).toContain('账号与角色')
    expect(wrapper.text()).toContain('账号总数')
    expect(wrapper.text()).toContain('启用账号')
    expect(wrapper.text()).toContain('角色数量')
    expect(wrapper.text()).toContain('已绑定工作台')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('electro_director')
    expect(wrapper.text()).toContain('系统管理员')
    expect(wrapper.text()).toContain('角色可见性预览')
  })

  test('updates the preview when selecting another role', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-preview-role-select"]').setValue('electro-education-director')
    await flushPromises()

    expect(wrapper.get('[data-testid="account-visible-menu-list"]').text()).toContain('应用中心')
    expect(wrapper.get('[data-testid="account-visible-menu-list"]').text()).toContain('告警管理')
    expect(wrapper.get('[data-testid="account-visible-menu-list"]').text()).not.toContain('智慧黑板')
    expect(wrapper.get('[data-testid="account-visible-workbench-list"]').text()).toContain('电教主任工作台')
  })

  test('validates required fields before adding an account', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="accounts-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="account-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('账号不能为空')
    expect(wrapper.text()).toContain('姓名不能为空')
    expect(wrapper.text()).toContain('至少选择一个角色')
    expect(ElMessage.error).toHaveBeenCalledWith('账号不能为空')
  })

  test('adds a valid local demo account', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="accounts-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="account-username-input"]').setValue('demo_teacher')
    await wrapper.get('[data-testid="account-display-name-input"]').setValue('演示教师')
    await wrapper.get('[data-testid="account-phone-input"]').setValue('13800000006')
    await wrapper.findComponent({ name: 'ElCheckboxGroup' }).vm.$emit('update:modelValue', ['all-staff'])
    await wrapper.get('[data-testid="account-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('demo_teacher')
    expect(wrapper.text()).toContain('演示教师')
    expect(ElMessage.success).toHaveBeenCalledWith('演示账号已添加')
  })

  test('toggles account status and resets password through simulated actions', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-toggle-user-research-director"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="account-status-user-research-director"]').text()).toContain('已停用')

    await wrapper.get('[data-testid="account-reset-password-user-research-director"]').trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalled()
    expect(ElMessage.success).toHaveBeenCalledWith('已生成演示密码：Demo@123')
  })

  test('edits a role description and visible workbenches through the local role drawer', async () => {
    const wrapper = await mountAccountsView()

    wrapper.findComponent({ name: 'ElTabs' }).vm.$emit('update:modelValue', 'roles')
    await flushPromises()
    await wrapper.get('[data-testid="account-role-edit-role-electro-education-director"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="role-description-input"]').setValue('负责电教设备、应用与告警联动演示')
    const checkboxGroups = wrapper.findAllComponents({ name: 'ElCheckboxGroup' })
    expect(checkboxGroups.length).toBeGreaterThan(0)
    checkboxGroups.at(-1)!.vm.$emit('update:modelValue', ['dashboard-electro', 'dashboard-all'])
    await wrapper.get('[data-testid="role-save-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('负责电教设备、应用与告警联动演示')
    await wrapper.get('[data-testid="account-preview-role-select"]').setValue('electro-education-director')
    expect(wrapper.get('[data-testid="account-visible-workbench-list"]').text()).toContain('全员工作台')
    expect(ElMessage.success).toHaveBeenCalledWith('角色绑定已更新')
  })

  test('restores seeded demo state', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-toggle-user-research-director"]').trigger('click')
    await wrapper.get('[data-testid="accounts-reset-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="account-status-user-research-director"]').text()).toContain('已启用')
    expect(ElMessage.success).toHaveBeenCalledWith('演示状态已重置')
  })
})
