import { hasRole as sharedHasRole, isSystemAdmin as sharedIsSystemAdmin, type CurrentUser, type RoleCode } from '@analytics/shared'
import { defineStore } from 'pinia'
import { authApi, type LoginInput } from '../api/authApi'

type AuthState = {
  user: CurrentUser | null
  initialized: boolean
  isLoading: boolean
  error: string | null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '认证服务暂不可用'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    isLoading: false,
    error: null,
  }),
  getters: {
    isAuthenticated(state): boolean {
      return state.user !== null
    },
    isSystemAdmin(state): boolean {
      return sharedIsSystemAdmin(state.user)
    },
  },
  actions: {
    hasRole(roleCode: RoleCode) {
      return sharedHasRole(this.user, roleCode)
    },
    async loadCurrentUser() {
      this.isLoading = true
      this.error = null

      try {
        this.user = await authApi.getCurrentUser()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
        this.isLoading = false
      }
    },
    async login(input: LoginInput) {
      this.isLoading = true
      this.error = null

      try {
        this.user = await authApi.login(input)
        this.initialized = true
      } catch (error) {
        this.user = null
        this.error = getErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    async logout() {
      this.isLoading = true
      this.error = null

      try {
        await authApi.logout()
      } finally {
        this.user = null
        this.initialized = true
        this.isLoading = false
      }
    },
  },
})
