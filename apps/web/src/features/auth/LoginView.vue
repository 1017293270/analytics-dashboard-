<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/useAuthStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: 'admin', password: 'Admin@123' })
const submitError = ref<string | null>(null)
const showPassword = ref(false)
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
  <main class="login">
    <!-- Left: emerald brand hero -->
    <aside class="login__hero" aria-hidden="true">
      <div class="login__hero-glow login__hero-glow--a" />
      <div class="login__hero-glow login__hero-glow--b" />
      <div class="login__hero-grid" />

      <div class="login__hero-top">
        <div class="login__logo">
          <span class="login__logo-mark">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
              <path d="M12 8.2l3.4 1.9v3.8L12 15.8l-3.4-1.9v-3.8L12 8.2z" fill="currentColor" />
            </svg>
          </span>
          <span class="login__logo-text">智慧教育集控平台</span>
        </div>
        <p class="login__hero-eyebrow">SMART EDUCATION CONSOLE</p>
      </div>

      <div class="login__hero-body">
        <h2 class="login__hero-headline">
          让校园里的每一组数据，<br />都成为决策的支点。
        </h2>
        <p class="login__hero-sub">
          统一聚合设备、告警、应用与角色工作台运行状态，把分散的校园信号收敛成一个清晰的指挥视图。
        </p>

        <ul class="login__hero-points">
          <li><span class="login__point-dot" />实时设备与告警态势</li>
          <li><span class="login__point-dot" />六类数据看板一键接入</li>
          <li><span class="login__point-dot" />按角色分发的工作台</li>
        </ul>
      </div>

      <div class="login__hero-foot">
        <div class="login__metric">
          <strong>1,284</strong>
          <span>在线设备</span>
        </div>
        <div class="login__metric">
          <strong>98%</strong>
          <span>系统健康度</span>
        </div>
        <div class="login__metric">
          <strong>6</strong>
          <span>看板覆盖</span>
        </div>
      </div>
    </aside>

    <!-- Right: login form -->
    <section class="login__panel" aria-labelledby="login-title">
      <header class="login__brand">
        <h1 id="login-title">欢迎回来</h1>
        <p>请登录智慧教育集控平台</p>
      </header>

      <form class="login__form" :aria-busy="auth.isLoading" @submit.prevent="submitLogin">
        <label class="login__field">
          <span class="login__field-label">账号</span>
          <span class="login__input-wrap">
            <input v-model="form.username" name="username" autocomplete="username" placeholder="请输入账号" required />
          </span>
        </label>

        <label class="login__field">
          <span class="login__field-label">密码</span>
          <span class="login__input-wrap">
            <input
              v-model="form.password"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
              required
            />
            <button
              type="button"
              class="login__toggle-pw"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </span>
        </label>

        <p v-if="submitError || auth.error" class="login__error" role="alert">{{ submitError || auth.error }}</p>

        <button type="submit" class="login__submit" :disabled="auth.isLoading">
          <span v-if="auth.isLoading" class="login__spinner" aria-hidden="true" />
          {{ auth.isLoading ? '登录中…' : '登 录' }}
        </button>
      </form>

      <div class="login__demo" aria-label="演示账号">
        <div class="login__demo-head">
          <span class="login__demo-line" />
          <span>演示账号</span>
          <span class="login__demo-line" />
        </div>
        <div class="login__demo-grid">
          <div class="login__demo-item">
            <strong>系统管理员</strong>
            <code>admin / Admin@123</code>
          </div>
          <div class="login__demo-item">
            <strong>全员</strong>
            <code>all_staff / Demo@123</code>
          </div>
          <div class="login__demo-item">
            <strong>电教主任</strong>
            <code>electro_director / Demo@123</code>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  min-height: 100vh;
  background: var(--color-panel);
}

/* ════════════════════ HERO ════════════════════ */
.login__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  padding: 44px 48px;
  overflow: hidden;
  color: var(--color-text-on-dark);
  background:
    radial-gradient(120% 120% at 15% 10%, var(--color-accent-700) 0%, transparent 55%),
    linear-gradient(150deg, var(--color-sidebar) 0%, var(--color-accent-900) 70%, #052e22 100%);
  isolation: isolate;
}

.login__hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}

.login__hero-glow--a {
  top: -120px;
  right: -80px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.55), transparent 70%);
}

.login__hero-glow--b {
  bottom: -140px;
  left: -60px;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(8, 145, 178, 0.4), transparent 70%);
}

.login__hero-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at 60% 40%, black, transparent 78%);
  pointer-events: none;
}

.login__hero-top,
.login__hero-body,
.login__hero-foot {
  position: relative;
  z-index: 1;
}

.login__hero-top {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login__logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login__logo-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: var(--color-accent-200);
}

.login__logo-mark svg {
  width: 22px;
  height: 22px;
}

.login__logo-text {
  font-size: 17px;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
}

.login__hero-eyebrow {
  margin: 0;
  color: var(--color-accent-200);
  font-size: 11px;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-label);
}

.login__hero-body {
  max-width: 460px;
}

.login__hero-headline {
  margin: 0 0 16px;
  font-size: 34px;
  font-weight: var(--fw-black);
  line-height: var(--lh-tight);
  letter-spacing: var(--tracking-tight);
}

.login__hero-sub {
  margin: 0 0 28px;
  color: var(--color-sidebar-text);
  font-size: 15px;
  line-height: var(--lh-normal);
}

.login__hero-points {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--color-text-on-dark);
}

.login__hero-points li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login__point-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  background: var(--color-accent-300);
  box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.18);
}

.login__hero-foot {
  display: flex;
  gap: 36px;
  padding-top: 24px;
  border-top: 1px solid var(--color-sidebar-border);
}

.login__metric {
  display: grid;
  gap: 4px;
}

.login__metric strong {
  font-size: 24px;
  font-weight: var(--fw-black);
  font-feature-settings: var(--num-feature);
  line-height: 1;
}

.login__metric span {
  font-size: 12px;
  color: var(--color-sidebar-text-muted);
}

/* ════════════════════ PANEL ════════════════════ */
.login__panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 28px;
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  padding: 56px 48px;
  background: var(--color-panel);
}

.login__brand {
  display: grid;
  gap: 8px;
}

.login__brand h1,
.login__brand p,
.login__error {
  margin: 0;
}

.login__brand h1 {
  font-size: 28px;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  line-height: var(--lh-tight);
}

.login__brand p {
  color: var(--color-text-muted);
  font-size: 14px;
}

.login__form {
  display: grid;
  gap: 18px;
}

.login__field {
  display: grid;
  gap: 8px;
}

.login__field-label {
  font-size: 13px;
  font-weight: var(--fw-bold);
  color: var(--color-text);
}

.login__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.login__input-wrap input {
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: var(--color-text);
  font-size: 14px;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.login__input-wrap input::placeholder {
  color: var(--color-text-faint);
}

.login__input-wrap input:focus {
  border-color: var(--color-accent);
  outline: 0;
  box-shadow: var(--shadow-glow);
}

.login__toggle-pw {
  position: absolute;
  right: 8px;
  display: grid;
  place-items: center;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: var(--fw-bold);
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-out);
}

.login__toggle-pw:hover {
  color: var(--color-accent);
}

.login__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  margin-top: 4px;
  border: 0;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-strong) 100%);
  color: var(--color-text-on-accent);
  font-size: 15px;
  font-weight: var(--fw-black);
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.28);
  transition:
    transform var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out),
    opacity var(--motion-fast) var(--ease-out);
}

.login__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(5, 150, 105, 0.36);
}

.login__submit:active:not(:disabled) {
  transform: translateY(0);
}

.login__submit:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

.login__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: var(--radius-circle);
  animation: login-spin 0.7s linear infinite;
}

@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}

.login__error {
  color: var(--color-danger);
  font-size: 13px;
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}

/* ── Demo accounts ── */
.login__demo {
  display: grid;
  gap: 14px;
}

.login__demo-head {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-faint);
  font-size: 11px;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-label);
}

.login__demo-line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.login__demo-grid {
  display: grid;
  gap: 8px;
}

.login__demo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel-muted);
  transition:
    border-color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.login__demo-item:hover {
  border-color: var(--color-border-accent);
  background: var(--color-accent-50);
}

.login__demo-item strong {
  font-size: 12px;
  font-weight: var(--fw-bold);
  color: var(--color-text-muted);
}

.login__demo-item code {
  font-family: ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace;
  font-size: 12px;
  color: var(--color-text);
  font-weight: var(--fw-bold);
}

/* ════════════════════ Responsive ════════════════════ */
@media (max-width: 980px) {
  .login {
    grid-template-columns: 1fr;
  }

  .login__hero {
    display: none;
  }

  .login__panel {
    max-width: 480px;
    padding: 40px 28px;
    min-height: 100vh;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .login__panel {
    padding: 32px 20px;
  }

  .login__demo-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
