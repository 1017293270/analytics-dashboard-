<script setup lang="ts">
import { ArrowDown, Bell } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../auth/stores/useAuthStore'

defineProps<{
  schoolName: string
}>()

const router = useRouter()
const auth = useAuthStore()

const roleNames = computed(() => auth.user?.roles.map((role) => role.name).join(' / ') ?? '未登录')

async function logout() {
  await auth.logout()
  await router.push('/login')
}

async function handleUserCommand(command: string) {
  if (command === 'logout') {
    await logout()
  }
}
</script>

<template>
  <header class="top-bar">
    <div class="top-bar__school">
      <strong>{{ schoolName }}</strong>
      <ElTag size="small" effect="plain">{{ roleNames }}</ElTag>
    </div>

    <div class="top-bar__actions">
      <ElBadge :value="3" class="top-bar__badge">
        <ElButton :icon="Bell" circle aria-label="通知" />
      </ElBadge>
      <ElDropdown trigger="click" @command="handleUserCommand">
        <ElButton>
          {{ auth.user?.displayName ?? '未登录' }}
          <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
        </ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem disabled>{{ auth.user?.username ?? 'anonymous' }}</ElDropdownItem>
            <ElDropdownItem command="logout" divided>退出登录</ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-panel);
}

.top-bar__school,
.top-bar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar__school strong {
  font-size: 16px;
}
</style>
