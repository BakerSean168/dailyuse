<script setup lang="ts">
/**
 * BusinessPanel (UI 重构 V2 壳)
 *
 * 多 Tab 业务工作区（V2 §2.3，参照 Codex 桌面端右侧面板）。
 * Tab 条 [模块图标 + 标题] ×N + 右侧 Maximize/Minimize + ✕(关面板)；
 * 内容区放 <router-view> + KeepAlive（由 AppShell 通过 slot 注入）。
 *
 * 面板两档（V2 §7）：内容区用 ResizeObserver 实测宽度并 provide
 * （usePanelWidth），同时挂 Tailwind 命名容器 `@container/panel`——
 * 结构性切换（第二侧栏 ↔ 下拉）走 JS 档位，纯样式（网格列数）走
 * CSS 容器查询（`@2xl/panel:` 等）。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AlarmClock,
  Bell,
  Calendar,
  FileText,
  ListTodo,
  Maximize2,
  Minimize2,
  Target,
  X,
} from '@lucide/vue';
import type { Component } from 'vue';
import type { BusinessTab, ShellLayout, ShellModule } from './useAppShellStore';
import { providePanelWidth } from './usePanelWidth';

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
  (e: 'start-resize', event: PointerEvent): void;
  (e: 'reset-width'): void;
}>();

const { t } = useI18n();

// ── 面板宽度上下文（V2 §7 两档；面板内业务视图 usePanelWidth 消费） ──
const { width: panelContentWidth } = providePanelWidth();
const contentEl = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!contentEl.value || typeof ResizeObserver === 'undefined') return;
  panelContentWidth.value = contentEl.value.clientWidth;
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) panelContentWidth.value = entry.contentRect.width;
  });
  resizeObserver.observe(contentEl.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

const moduleIcons: Record<ShellModule, Component> = {
  goal: Target,
  task: ListTodo,
  note: FileText,
  reminder: AlarmClock,
  notification: Bell,
  schedule: Calendar,
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

    <!-- 内容区（router-view 由 AppShell slot 注入；命名容器供 CSS 容器查询） -->
    <div ref="contentEl" class="@container/panel min-h-0 flex-1 overflow-auto">
      <slot />
    </div>

    <!-- 拖宽把手（split 态左边缘；focus 态满屏不需要） -->
    <div
      v-if="!isFocused"
      data-testid="business-panel-resizer"
      class="absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-col-resize bg-transparent transition-colors hover:bg-primary/40"
      title="Drag to resize · double-click to reset"
      @pointerdown="emit('start-resize', $event)"
      @dblclick.stop="emit('reset-width')"
    />
  </section>
</template>
