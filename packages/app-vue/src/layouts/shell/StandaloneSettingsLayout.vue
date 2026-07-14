<script setup lang="ts">
/**
 * StandaloneSettingsLayout — STATE D 独立设置场景外壳
 *
 * Settings 不再进入 BusinessPanel / ShellModule Tab。
 * 结构：左固定分类导航 + 右内容列；由 AppShell 在 shellScene=settings 时挂载。
 * 分类导航仍由 UserSettingsView 负责（?tab= 深链契约），本布局提供返回应用与外框。
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
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="hidden w-[260px] shrink-0 flex-col border-r border-border bg-card/40 px-3 py-4 md:flex"
        data-testid="settings-scene-rail"
      >
        <button
          type="button"
          data-testid="settings-return-to-app"
          class="mb-4 flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          @click="emit('return-to-app')"
        >
          <ArrowLeft class="h-4 w-4" />
          <span>{{ t('shell.settings.returnToApp') }}</span>
        </button>
        <p class="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {{ t('setting.title') }}
        </p>
      </aside>

      <div class="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div class="absolute left-3 top-3 z-10 md:hidden">
          <button
            type="button"
            data-testid="settings-return-to-app-mobile"
            class="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground shadow-sm"
            @click="emit('return-to-app')"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            {{ t('shell.settings.returnToApp') }}
          </button>
        </div>
        <div class="h-full min-h-0 overflow-auto">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
