import type { AccountRow } from '@analytics/shared'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { AccountRoleRow } from './accountApi'
import { accountApi } from './accountApi'
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

vi.mock('./accountApi', () => ({
  accountApi: {
    listAccounts: vi.fn(),
    listRoles: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    resetPassword: vi.fn(),
    resetDemoAccounts: vi.fn(),
  },
}))

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

const accountRows: AccountRow[] = [
  {
    id: 'user-system-admin',
    username: 'admin',
    displayName: '系统管理员',
    phone: '13800000001',
    roleCodes: ['system-admin'],
    status: 'active',
    lastLoginAt: '2026-07-03T09:18:00.000Z',
  },
  {
    id: 'user-electro-director',
    username: 'electro_director',
    displayName: '电教主任',
    phone: '13800000003',
    roleCodes: ['electro-education-director'],
    status: 'active',
    lastLoginAt: '2026-07-03T08:42:00.000Z',
  },
  {
    id: 'user-research-director',
    username: 'research_director',
    displayName: '教研主任',
    phone: '13800000005',
    roleCodes: ['teaching-research-director'],
    status: 'active',
    lastLoginAt: '2026-07-03T08:20:00.000Z',
  },
]

const roleRows: AccountRoleRow[] = [
  {
    id: 'role-system-admin',
    code: 'system-admin',
    name: '系统管理员',
    description: '平台配置与演示管理账号',
  },
  {
    id: 'role-all-staff',
    code: 'all-staff',
    name: '全员',
    description: '全校教职工默认角色',
  },
  {
    id: 'role-electro-education-director',
    code: 'electro-education-director',
    name: '电教主任',
    description: '负责电教设备、应用与运维告警',
  },
  {
    id: 'role-moral-education-director',
    code: 'moral-education-director',
    name: '德育主任',
    description: '负责德育与学生成长相关看板',
  },
  {
    id: 'role-teaching-research-director',
    code: 'teaching-research-director',
    name: '教研主任',
    description: '负责教研与教师发展相关看板',
  },
]

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

function mockApiData(accounts: AccountRow[] = accountRows, roles: AccountRoleRow[] = roleRows) {
  vi.mocked(accountApi.listAccounts).mockResolvedValue(accounts)
  vi.mocked(accountApi.listRoles).mockResolvedValue(roles)
  vi.mocked(accountApi.createAccount).mockResolvedValue(accounts[0])
  vi.mocked(accountApi.updateAccount).mockResolvedValue(accounts[0])
  vi.mocked(accountApi.resetPassword).mockResolvedValue(accounts[0])
  vi.mocked(accountApi.resetDemoAccounts).mockResolvedValue(accounts)
}

describe('AccountsView', () => {
  beforeEach(() => {
    vi.mocked(accountApi.listAccounts).mockReset()
    vi.mocked(accountApi.listRoles).mockReset()
    vi.mocked(accountApi.createAccount).mockReset()
    vi.mocked(accountApi.updateAccount).mockReset()
    vi.mocked(accountApi.resetPassword).mockReset()
    vi.mocked(accountApi.resetDemoAccounts).mockReset()
    mockApiData()
    vi.mocked(ElMessage.error).mockReset()
    vi.mocked(ElMessage.success).mockReset()
    vi.mocked(ElMessageBox.confirm).mockReset()
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(
      'confirm' as unknown as Awaited<ReturnType<typeof ElMessageBox.confirm>>,
    )
  })

  test('loads accounts and roles from the API on mount', async () => {
    const wrapper = await mountAccountsView()

    expect(accountApi.listAccounts).toHaveBeenCalledTimes(1)
    expect(accountApi.listRoles).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('账号与角色')
    expect(wrapper.text()).toContain('账号总数')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('electro_director')
    expect(wrapper.text()).toContain('系统管理员')
    expect(wrapper.text()).toContain('角色可见性预览')
    expect(wrapper.text()).toContain('账号角色用于预览菜单与工作台可见范围，工作台发布策略在工作台配置页统一维护。')
    expect(wrapper.text()).not.toContain('演示级本地状态')
    expect(wrapper.text()).not.toContain('本页为演示级角色绑定')
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
    expect(accountApi.createAccount).not.toHaveBeenCalled()
  })

  test('adds an account through the API and renders the returned account', async () => {
    const created: AccountRow = {
      id: 'user-demo-teacher',
      username: 'demo_teacher',
      displayName: '演示教师',
      phone: '13800000006',
      roleCodes: ['all-staff'],
      status: 'active',
      lastLoginAt: null,
    }
    vi.mocked(accountApi.createAccount).mockResolvedValue(created)
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="accounts-add-button"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="account-username-input"]').setValue('demo_teacher')
    await wrapper.get('[data-testid="account-display-name-input"]').setValue('演示教师')
    await wrapper.get('[data-testid="account-phone-input"]').setValue('13800000006')
    await wrapper.findComponent({ name: 'ElCheckboxGroup' }).vm.$emit('update:modelValue', ['all-staff'])
    await wrapper.get('[data-testid="account-save-button"]').trigger('click')
    await flushPromises()

    expect(accountApi.createAccount).toHaveBeenCalledWith({
      username: 'demo_teacher',
      displayName: '演示教师',
      phone: '13800000006',
      password: 'Demo@123',
      roleCodes: ['all-staff'],
    })
    expect(wrapper.text()).toContain('demo_teacher')
    expect(wrapper.text()).toContain('演示教师')
    expect(ElMessage.success).toHaveBeenCalledWith('账号已添加')
  })

  test('toggles account status through PATCH and updates the row', async () => {
    vi.mocked(accountApi.updateAccount).mockResolvedValue({
      ...accountRows[2],
      status: 'disabled',
    })
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-toggle-user-research-director"]').trigger('click')
    await flushPromises()

    expect(accountApi.updateAccount).toHaveBeenCalledWith('user-research-director', { status: 'disabled' })
    expect(wrapper.get('[data-testid="account-status-user-research-director"]').text()).toContain('已停用')
    expect(ElMessage.success).toHaveBeenCalledWith('账号已停用')
  })

  test('resets password through the API reset route after confirmation', async () => {
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="account-reset-password-user-research-director"]').trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalled()
    expect(accountApi.resetPassword).toHaveBeenCalledWith('user-research-director', { password: 'Demo@123' })
    expect(ElMessage.success).toHaveBeenCalledWith('密码已重置为 Demo@123')
  })

  test('edits role description and workbench bindings as front-end preview only', async () => {
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
    expect(accountApi.updateAccount).not.toHaveBeenCalled()
    expect(ElMessage.success).toHaveBeenCalledWith('角色预览已更新')
  })

  test('reset demo state restores the backend seed through the API', async () => {
    vi.mocked(accountApi.resetDemoAccounts).mockResolvedValue([{ ...accountRows[2], status: 'disabled' }])
    const wrapper = await mountAccountsView()

    await wrapper.get('[data-testid="accounts-reset-button"]').trigger('click')
    await flushPromises()

    expect(accountApi.resetDemoAccounts).toHaveBeenCalledTimes(1)
    expect(accountApi.listAccounts).toHaveBeenCalledTimes(1)
    expect(accountApi.listRoles).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="account-status-user-system-admin"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="account-status-user-research-director"]').text()).toContain('已停用')
    expect(ElMessage.success).toHaveBeenCalledWith('演示状态已重置')
  })
})
