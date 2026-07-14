<script setup lang="ts">
/**
 * AIContextPanel — AI 工作区侧栏（V2 §6.0 精修）
 *
 * V1 右栏三态：
 *   ① 空闲今日概览 → 已迁到欢迎态主列（消息区下方）
 *   ②/③ 工作流产物 → 主列消息时间线内嵌 + Composer 上方操作条
 *
 * 本组件仍保留作为工作流产物的可选窄侧栏容器（桌面 md+ / 移动浮层），
 * 以维持 `ai-context-panel` / `ai-context-panel-close` testid 契约
 * 与 AIChatView.spec 状态机断言。空闲态右栏不再渲染。
 *
 * 布局容器不持有工作流状态——产物由 AIChatView 通过 slot 注入。
 */
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { X } from '@lucide/vue';

defineProps<{
  /** 是否有激活的工作流上下文（决定是否渲染） */
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

    <!-- Optional top strip (unused when actions live near composer/timeline) -->
    <slot name="action-bar" />

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <slot />
      </div>
    </div>
  </aside>
</template>
