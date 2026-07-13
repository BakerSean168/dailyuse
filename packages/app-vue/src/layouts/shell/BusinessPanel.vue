<script setup lang="ts">
/**
 * BusinessPanel (UI 重构 V2 壳)
 *
 * 多 Tab 业务工作区（V2 §2.3，参照 Codex 桌面端右侧面板）。
 * Tab 条 [模块图标 + 标题] ×N + 右侧 Maximize/Minimize + ✕(关面板)；
 * 内容区 S0 为 <slot>，S1 放 <router-view> + <KeepAlive :include>。
 *
 * S0 骨架：Tab 增删/激活/关闭交互 emit + B⇄C 切换 + 拖宽把手；
 * 不含 router-view（接线在 S1）。Tab 数据由 AppShell 从 store 透传。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AlarmClock,
  Bell,
  Calendar,
  FileText,
  ListTodo,
  Maximize2,
  Minimize2,
  Settings,
  Target,
  X,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import type { BusinessTab, ShellLayout, ShellModule } from './useAppShellStore';

const props = defineProps<{
  tabs: BusinessTab[];
  activeTabId: string | null;
  layout: ShellLayout;
}>();

const emit = defineEmits<{
  (e: 'activate-tab', id: string): void;
  (e: 'close-tab', id: string): void;
  (e: 'close-panel'): void;
  (e: 'toggle-focus'): void;
  (e: 'start-resize', event: MouseEvent): void;
}>();

const { t } = useI18n();

const moduleIcons: Record<ShellModule, Component> = {
  goal: Target,
  task: ListTodo,
  note: FileText,
  reminder: AlarmClock,
  notification: Bell,
  schedule: Calendar,
  setting: Settings,
};

const isFocused = computed(() => props.layout === 'focus');
</script>

<template>
  <section
    class="business-panel relative flex h-full flex-col border-l border-border bg-background"
    data-testid="business-panel"
  >
    <!-- Tab 条 -->
    <div class="flex h-[40px] shrink-0 items-center border-b border-border pr-1">
      <div class="flex flex-1 items-stretch overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="group flex max-w-[200px] items-center gap-1.5 border-r border-border px-3 text-xs transition-colors"
          :class="
            activeTabId === tab.id
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          "
          @click="emit('activate-tab', tab.id)"
        >
          <component :is="moduleIcons[tab.module]" class="h-3.5 w-3.5 shrink-0" />
          <span class="truncate">{{ tab.title }}</span>
          <span
            role="button"
            tabindex="0"
            class="ml-1 shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            :aria-label="t('shell.panel.closeTab')"
            @click.stop="emit('close-tab', tab.id)"
            @keydown.enter.stop="emit('close-tab', tab.id)"
          >
            <X class="h-3 w-3" />
          </span>
        </button>
      </div>

      <!-- 面板级控制 -->
      <div class="flex shrink-0 items-center gap-0.5 pl-1">
        <button
          type="button"
          class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :title="isFocused ? t('shell.panel.exitFocus') : t('shell.panel.enterFocus')"
          @click="emit('toggle-focus')"
        >
          <component :is="isFocused ? Minimize2 : Maximize2" class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          data-testid="business-panel-close"
          class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :title="t('shell.panel.closePanel')"
          @click="emit('close-panel')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- 内容区（S1 放 router-view + KeepAlive） -->
    <div class="min-h-0 flex-1 overflow-auto">
      <slot />
    </div>

    <!-- 拖宽把手（split 态左边缘；focus 态满屏不需要） -->
    <div
      v-if="!isFocused"
      class="absolute left-0 top-0 h-full w-[3px] cursor-col-resize bg-transparent transition-colors hover:bg-primary/40"
      @mousedown="emit('start-resize', $event)"
    />
  </section>
</template>
