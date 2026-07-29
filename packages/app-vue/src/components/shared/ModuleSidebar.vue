<script setup lang="ts">
/**
 * ModuleSidebar — 模块第二侧栏统一容器（UI_PAGE_REDESIGN_PLAN §0.1 / §0.5）
 *
 * w-64 可折叠：展开 = 内容列 + 底部收起按钮；折叠 = w-10 细轨 + 展开按钮。
 * goal / reminder / repository 等模块的第二侧栏统一用它，
 * 各页不得自造宽度与折叠交互。
 *
 * 用法：
 *   <ModuleSidebar v-model:collapsed="collapsed" :label="t('...')">…</ModuleSidebar>
 */
import { useI18n } from 'vue-i18n';
import { Button } from '@memoflow/ui-vue-shadcn';
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue';

withDefaults(
  defineProps<{
    /** 无障碍区域标签 */
    label?: string;
    /** 是否提供折叠交互（默认开） */
    collapsible?: boolean;
  }>(),
  { collapsible: true },
);

const collapsed = defineModel<boolean>('collapsed', { default: false });

const { t } = useI18n();
</script>

<template>
  <aside
    v-if="!collapsed"
    class="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar/50"
    :aria-label="label"
    data-testid="module-sidebar"
  >
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <slot />
    </div>
    <div v-if="collapsible" class="shrink-0 border-t border-border/40 p-2">
      <Button
        variant="ghost"
        size="sm"
        class="w-full justify-start gap-2 text-muted-foreground"
        data-testid="module-sidebar-collapse"
        @click="collapsed = true"
      >
        <PanelLeftClose class="h-4 w-4" />
        <span class="text-xs">{{ t('common.collapse') }}</span>
      </Button>
    </div>
  </aside>

  <div
    v-else
    class="flex h-full w-10 shrink-0 flex-col items-center border-r border-border bg-sidebar/50 py-2"
    :aria-label="label"
    data-testid="module-sidebar-collapsed"
  >
    <Button
      variant="ghost"
      size="icon"
      :aria-label="t('common.expand')"
      class="h-8 w-8"
      :title="t('common.expand')"
      data-testid="module-sidebar-expand"
      @click="collapsed = false"
    >
      <PanelLeftOpen class="h-4 w-4" />
    </Button>
  </div>
</template>
