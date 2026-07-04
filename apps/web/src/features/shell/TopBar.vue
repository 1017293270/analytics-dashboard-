<script setup lang="ts">
import { ArrowDown, Bell, Search } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../auth/stores/useAuthStore'

defineProps<{
  schoolName: string
}>()

const router = useRouter()
const auth = useAuthStore()

const roleNames = computed(() => auth.user?.roles.map((role) => role.name).join(' / ') ?? '未登录')
const initials = computed(() => {
  const name = auth.user?.displayName ?? '?'
  return name.slice(0, 1)
})

async function logout() {
  try {
    await auth.logout()
  } catch {
    // The store clears local auth state in finally; keep the UI moving to login even if the request fails.
  } finally {
    await router.push('/login')
  }
}

async function handleUserCommand(command: string) {
  if (command === 'logout') {
    await logout()
  }
}
</script>

<template>
  <header class="top-bar">
    <div class="top-bar__left">
      <div class="top-bar__school">
        <strong>{{ schoolName }}</strong>
        <span class="top-bar__role">{{ roleNames }}</span>
      </div>
    </div>

    <div class="top-bar__center">
      <div class="top-bar__search" role="search">
        <ElIcon class="top-bar__search-icon" aria-hidden="true"><Search /></ElIcon>
        <span class="top-bar__search-text">搜索设备、看板、应用…</span>
        <kbd class="top-bar__kbd">⌘K</kbd>
      </div>
    </div>

    <div class="top-bar__actions">
      <ElBadge :value="3" class="top-bar__badge">
        <button type="button" class="top-bar__icon-btn" aria-label="通知">
          <ElIcon><Bell /></ElIcon>
        </button>
      </ElBadge>

      <ElDropdown trigger="click" @command="handleUserCommand">
        <button type="button" class="top-bar__user">
          <span class="top-bar__avatar" aria-hidden="true">{{ initials }}</span>
          <span class="top-bar__user-name">{{ auth.user?.displayName ?? '未登录' }}</span>
          <ElIcon class="top-bar__user-caret"><ArrowDown /></ElIcon>
        </button>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto;
  align-items: center;
  gap: 24px;
  height: var(--topbar-height);
  padding: 0 var(--space-page);
  background: var(--color-panel);
  border-bottom: 1px solid var(--color-border);
}

/* ── School identity ── */
.top-bar__left {
  min-width: 0;
}

.top-bar__school {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.top-bar__school strong {
  font-size: 15px;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-bar__role {
  flex: none;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-50);
  color: var(--color-accent-700);
  font-size: 11px;
  font-weight: var(--fw-bold);
}

/* ── Search (visual placeholder) ── */
.top-bar__center {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.top-bar__search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 460px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  color: var(--color-text-faint);
  cursor: text;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.top-bar__search:hover {
  border-color: var(--color-border-strong);
  background: var(--color-panel);
}

.top-bar__search-icon {
  font-size: 16px;
}

.top-bar__search-text {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-bar__kbd {
  flex: none;
  padding: 2px 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-panel);
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 11px;
  font-weight: var(--fw-bold);
  color: var(--color-text-muted);
}

/* ── Actions ── */
.top-bar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar__icon-btn {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: var(--color-text-muted);
  font-size: 16px;
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.top-bar__icon-btn:hover {
  border-color: var(--color-border-accent);
  background: var(--color-accent-50);
  color: var(--color-accent-700);
}

.top-bar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 8px 0 6px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-panel);
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.top-bar__user:hover {
  border-color: var(--color-border-strong);
  background: var(--color-panel-muted);
}

.top-bar__avatar {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  background: linear-gradient(135deg, var(--color-accent-500), var(--color-accent-700));
  color: #fff;
  font-size: 12px;
  font-weight: var(--fw-black);
}

.top-bar__user-name {
  font-size: 13px;
  font-weight: var(--fw-bold);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-bar__user-caret {
  color: var(--color-text-faint);
  font-size: 12px;
}

@media (max-width: 1100px) {
  .top-bar {
    grid-template-columns: 1fr auto;
  }

  .top-bar__center {
    display: none;
  }
}

@media (max-width: 720px) {
  .top-bar {
    gap: 12px;
    padding: 0 14px;
  }

  .top-bar__role {
    display: none;
  }

  .top-bar__user-name {
    display: none;
  }
}
</style>
