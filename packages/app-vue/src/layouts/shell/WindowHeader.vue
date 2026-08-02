<script setup lang="ts">
/**
 * WindowHeader (UI 重构 V2 壳)
 *
 * 桌面式壳的顶栏（h-48px）。三段式：
 * - 左：侧栏折叠按钮 · 返回/前进
 * - 中：单一业务工作区 launcher
 * - 右：右侧面板 Toggle · [桌面端] 窗口控制
 *
 * 业务上下文只由 BusinessPanel Tab 表达；顶栏不再保留第二套模块导航。
 * 桌面窗控复用既有 useDesktopWindowControls（apps/desktop 已落地 IPC）。
 * 交互逻辑不接业务数据，只 emit 给 AppShell。
 *
 * 契约：workspace launcher 的 data-testid = `shell-workspace-launcher`。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Minus,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Square,
  PanelsTopLeft,
  X,
} from '@lucide/vue';

interface WindowControlsState {
  isMaximized: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  isClosable: boolean;
}

const props = defineProps<{
  /** workspace = 业务壳顶栏；settings = 独立设置场景（隐藏工作区入口）。 */
  mode?: 'workspace' | 'settings';
  /** 侧栏是否已折叠（控制折叠按钮图标）。 */
  sidebarCollapsed: boolean;
  /** 右侧面板是否打开（独立于业务 Tab 和左侧栏）。 */
  rightPanelOpen: boolean;
  /** 工作流等待用户查看时显示在右侧面板 Toggle 上。 */
  workflowAttentionCount?: number;
  /** 是否桌面环境（渲染窗控 + 拖拽区）。 */
  isDesktop?: boolean;
  /** macOS：原生交通灯占左上角——左侧留位、不渲染自绘窗控。 */
  isMac?: boolean;
  /** 桌面窗控状态（isDesktop 时由 AppShell 透传）。 */
  windowControls?: WindowControlsState;
}>();

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void;
  (e: 'toggle-right-panel'): void;
  (e: 'go-back'): void;
  (e: 'go-forward'): void;
  (e: 'open-workspace'): void;
  (e: 'window-minimize'): void;
  (e: 'window-toggle-maximize'): void;
  (e: 'window-close'): void;
}>();

const { t } = useI18n();
</script>

<template>
  <header
    class="window-header flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 text-xs"
    :class="[isDesktop ? 'window-header--drag' : '', isMac ? 'pl-20' : '']"
  >
    <!-- 左：侧栏折叠 + 前进后退 -->
    <div class="flex shrink-0 items-center gap-2 no-drag">
      <button
        v-if="props.mode !== 'settings'"
        type="button"
        class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :title="sidebarCollapsed ? t('common.expand') : t('common.collapse')"
        :aria-label="sidebarCollapsed ? t('common.expand') : t('common.collapse')"
        @click="emit('toggle-sidebar')"
      >
        <PanelLeftClose v-if="!sidebarCollapsed" class="h-4 w-4" />
        <PanelLeft v-else class="h-4 w-4" />
      </button>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          :title="t('shell.back')"
          :aria-label="t('shell.back')"
          @click="emit('go-back')"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          :title="t('shell.forward')"
          :aria-label="t('shell.forward')"
          @click="emit('go-forward')"
        >
          <ArrowRight class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <div v-if="props.mode !== 'settings'" class="no-drag">
      <button
        type="button"
        data-testid="shell-workspace-launcher"
        class="flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :aria-label="t('shell.openWorkspace')"
        @click="emit('open-workspace')"
      >
        <PanelsTopLeft class="h-4 w-4" />
        <span>{{ t('shell.openWorkspace') }}</span>
      </button>
    </div>

    <!-- 右：面板与桌面窗控。业务模块只从 workspace launcher / panel tabs 进入。 -->
    <div class="flex shrink-0 items-center gap-3 no-drag">
      <button
        v-if="props.mode !== 'settings'"
        type="button"
        class="relative rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        data-testid="shell-right-panel-toggle"
        :title="rightPanelOpen ? t('shell.hideSidePanel') : t('shell.showSidePanel')"
        :aria-label="rightPanelOpen ? t('shell.hideSidePanel') : t('shell.showSidePanel')"
        :aria-pressed="rightPanelOpen"
        @click="emit('toggle-right-panel')"
      >
        <PanelRightClose v-if="rightPanelOpen" class="h-4 w-4" />
        <PanelRight v-else class="h-4 w-4" />
        <span
          v-if="(workflowAttentionCount ?? 0) > 0"
          class="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[9px] font-semibold leading-4 text-primary-foreground"
          data-testid="shell-workflow-attention-badge"
        >
          {{ workflowAttentionCount }}
        </span>
      </button>

      <div v-if="isDesktop && !isMac" class="flex items-center gap-1">
        <button
          type="button"
          class="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :disabled="windowControls && !windowControls.isMinimizable"
          :title="t('shell.window.minimize')"
          :aria-label="t('shell.window.minimize')"
          @click="emit('window-minimize')"
        >
          <Minus class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :disabled="windowControls && !windowControls.isMaximizable"
          :title="t('shell.window.maximize')"
          :aria-label="t('shell.window.maximize')"
          @click="emit('window-toggle-maximize')"
        >
          <Copy v-if="windowControls?.isMaximized" class="h-3 w-3" />
          <Square v-else class="h-3 w-3" />
        </button>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          :disabled="windowControls && !windowControls.isClosable"
          :title="t('shell.window.close')"
          :aria-label="t('shell.window.close')"
          @click="emit('window-close')"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.window-header--drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
</style>
