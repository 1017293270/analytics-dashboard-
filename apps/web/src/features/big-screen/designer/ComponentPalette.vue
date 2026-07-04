<script setup lang="ts">
import { computed } from 'vue'
import { createComponentFromPaletteEntry, getWorkbenchPaletteEntries, type WorkbenchPaletteEntry } from '../components/paletteEntries'
import { bigScreenText } from '../i18n/zh-CN'
import { useDashboardDesignerStore } from '../stores/useDashboardDesignerStore'

const designer = useDashboardDesignerStore()

const definitions = computed(() => getWorkbenchPaletteEntries())

function addComponent(entry: WorkbenchPaletteEntry) {
  designer.addComponent(createComponentFromPaletteEntry(entry.id, designer.schema))
}
</script>

<template>
  <aside class="component-palette" :aria-label="bigScreenText.designer.library.aria">
    <header class="component-palette__header">
      <p class="component-palette__eyebrow">{{ bigScreenText.designer.library.eyebrow }}</p>
      <h2 class="component-palette__title">{{ bigScreenText.designer.library.title }}</h2>
    </header>

    <div class="component-palette__list">
      <button
        v-for="definition in definitions"
        :key="definition.id"
        class="component-palette__item"
        type="button"
        :disabled="designer.isLoading || designer.isSaving"
        :data-testid="`add-${definition.id}`"
        @click="addComponent(definition)"
      >
        <span class="component-palette__glyph" aria-hidden="true">{{ definition.title.slice(0, 1) }}</span>
        <span class="component-palette__copy">
          <span class="component-palette__name">{{ definition.title }}</span>
        <span class="component-palette__meta">{{ definition.group }} · {{ definition.description }}</span>
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.component-palette {
  display: grid;
  grid-template-rows: auto 1fr;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-panel);
}

.component-palette__header {
  padding: 18px 16px 12px;
  border-bottom: 1px solid var(--color-border);
}

.component-palette__eyebrow,
.component-palette__title {
  margin: 0;
}

.component-palette__eyebrow {
  color: var(--color-accent);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.component-palette__title {
  margin-top: 4px;
  font-size: 18px;
  line-height: 1.1;
}

.component-palette__list {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}

.component-palette__item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 58px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-panel) 92%, #eef6ff);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--motion-fast) var(--ease-enter),
    background var(--motion-fast) var(--ease-enter),
    transform var(--motion-fast) var(--ease-enter);
}

.component-palette__item:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-accent) 46%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent-soft) 32%, var(--color-panel));
  transform: translateY(-1px);
}

.component-palette__item:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.component-palette__glyph {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 7px;
  background: #0f172a;
  color: white;
  font-size: 16px;
  font-weight: 900;
}

.component-palette__copy,
.component-palette__name,
.component-palette__meta {
  min-width: 0;
}

.component-palette__copy {
  display: grid;
  gap: 3px;
}

.component-palette__name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component-palette__meta {
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 700;
}
</style>
