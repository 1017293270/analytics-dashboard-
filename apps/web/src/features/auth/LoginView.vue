<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/useAuthStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: 'admin', password: 'Admin@123' })
const submitError = ref<string | null>(null)
const redirectTarget = computed(() => {
  const redirect = route.query.redirect

  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
})

async function submitLogin() {
  submitError.value = null

  try {
    await auth.login({ username: form.username, password: form.password })
    await router.push(redirectTarget.value)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '登录失败'
  }
}
</script>

<template>
  <main class="login-view">
    <section class="login-view__panel" aria-labelledby="login-title">
      <header class="login-view__brand">
        <p class="login-view__eyebrow">Smart Education Console</p>
        <h1 id="login-title">智慧教育集控平台</h1>
        <p>请输入演示账号登录。</p>
      </header>

      <form class="login-view__form" :aria-busy="auth.isLoading" @submit.prevent="submitLogin">
        <label>
          <span>账号</span>
          <input v-model="form.username" name="username" autocomplete="username" required />
        </label>

        <label>
          <span>密码</span>
          <input v-model="form.password" name="password" type="password" autocomplete="current-password" required />
        </label>

        <p v-if="submitError || auth.error" class="login-view__error" role="alert">{{ submitError || auth.error }}</p>

        <button type="submit" :disabled="auth.isLoading">
          {{ auth.isLoading ? '登录中' : '登录' }}
        </button>
      </form>

      <div class="login-view__demo" aria-label="演示账号">
        <strong>演示账号</strong>
        <span>系统管理员：admin / Admin@123</span>
        <span>全员：all_staff / Demo@123</span>
        <span>电教主任：electro_director / Demo@123</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-view {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: var(--color-page);
  color: var(--color-text);
}

.login-view__panel {
  display: grid;
  gap: 22px;
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.login-view__brand,
.login-view__brand h1,
.login-view__brand p,
.login-view__error {
  margin: 0;
}

.login-view__brand {
  display: grid;
  gap: 8px;
}

.login-view__eyebrow {
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.login-view__brand h1 {
  font-size: 28px;
  font-weight: 900;
  line-height: 1.12;
}

.login-view__brand p,
.login-view__demo {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.login-view__form,
.login-view__form label,
.login-view__demo {
  display: grid;
}

.login-view__form {
  gap: 14px;
}

.login-view__form label,
.login-view__demo {
  gap: 6px;
}

.login-view__form label span {
  font-size: 13px;
  font-weight: 800;
}

.login-view__form input {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  color: var(--color-text);
}

.login-view__form input:focus {
  border-color: var(--color-accent);
  outline: 3px solid var(--color-accent-soft);
}

.login-view__form button {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  background: var(--color-accent);
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;
}

.login-view__form button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.login-view__error {
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.login-view__demo {
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

.login-view__demo strong {
  color: var(--color-text);
}
</style>
