<script setup lang="ts">
/**
 * StandaloneSettingsLayout — STATE D 独立设置场景外壳
 *
 * Settings 不再进入 BusinessPanel / ShellModule Tab。
 * 结构：独立页头 + 单一内容滚动容器；分类导航由 UserSettingsView 负责。
 * 不再渲染遗留的场景栏，避免设置页出现三栏嵌套导航。
 */
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'return-to-app'): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background text-foreground"
    data-testid="standalone-settings-layout"
    data-shell-scene="settings"
  >
    <div class="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
      <button
        type="button"
        data-testid="settings-return-to-app"
        class="flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        @click="emit('return-to-app')"
      >
        <ArrowLeft class="h-4 w-4" />
        <span>{{ t('shell.settings.returnToApp') }}</span>
      </button>
      <span class="h-4 w-px bg-border" aria-hidden="true" />
      <h1 class="truncate text-sm font-semibold">{{ t('setting.title') }}</h1>
    </div>

    <main class="min-h-0 min-w-0 flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>
