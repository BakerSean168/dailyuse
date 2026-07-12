<script setup lang="ts">
/**
 * AIContextPanel — AI 工作台右栏三态容器（UI_PAGE_REDESIGN_PLAN §1）
 *
 * 三态：
 *   ① 空闲（无运行工作流）→ #idle（今日概览，≥xl 常驻；<lg 不渲染）
 *   ② 工作流运行 → #action-bar（生命周期操作条）+ #default（产物/证据面板）
 *   ③ 知识问答 → 同 ②（证据列表与接地校验由产物面板/操作条承载）
 *
 * 响应式：≥md 静态右栏；<md 底部浮层（沿用原契约，
 * `ai-context-panel` / `ai-context-panel-close` testid 不变）。
 * 布局容器不持有工作流状态——产物与操作条由 AIChatView 通过 slot 注入。
 */
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { X } from 'lucide-vue-next';

defineProps<{
  /** 是否有激活的工作流上下文（决定 ②/③ 还是 ①） */
  hasWorkflowContext: boolean;
  /** <md 时浮层是否展开 */
  open: boolean;
  /** 面板标题下的当前工具名 */
  toolLabel: string;
}>();

defineEmits<{ close: [] }>();

const { t } = useI18n();
</script>

<template>
  <!-- 工作流态：所有断点可见（<md 需 open） -->
  <aside
    v-if="hasWorkflowContext"
    class="fixed inset-x-0 bottom-0 z-40 max-h-[72vh] min-h-0 flex-col border-t bg-background shadow-xl md:static md:z-auto md:max-h-none md:w-96 md:shrink-0 md:border-l md:border-t-0 md:shadow-none"
    :class="open ? 'flex' : 'hidden md:flex'"
    data-testid="ai-context-panel"
  >
    <div class="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4">
      <div class="min-w-0">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.context.title') }}
        </p>
        <p class="truncate text-sm font-medium text-foreground">
          {{ toolLabel }}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 md:hidden"
        :title="t('aiAssistant.chatPage.context.hide')"
        data-testid="ai-context-panel-close"
        @click="$emit('close')"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- ② 工作流操作条：与产物同屏，置顶 -->
    <slot name="action-bar" />

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <slot />
      </div>
    </div>
  </aside>

  <!-- ① 空闲态：≥xl 常驻今日概览（<xl 不渲染，窄屏概览由 RN 端承担） -->
  <aside
    v-else
    class="hidden w-96 shrink-0 flex-col border-l bg-background xl:flex"
    data-testid="ai-context-panel-idle"
  >
    <div class="flex h-14 shrink-0 items-center border-b px-4">
      <div class="min-w-0">
        <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.chatPage.context.title') }}
        </p>
        <p class="truncate text-sm font-medium text-foreground">
          {{ t('aiAssistant.chatPage.context.todayOverview') }}
        </p>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <slot name="idle" />
      </div>
    </div>
  </aside>
</template>
