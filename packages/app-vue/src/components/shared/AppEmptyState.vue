<script setup lang="ts">
/**
 * AppEmptyState — 统一空态（UI_PAGE_REDESIGN_PLAN §0.3）
 *
 * 图标（lucide, muted）+ 一句话标题 + 可选描述
 *   + 可选主操作按钮（与页头主操作同一动作，通过 @action 发出）
 *   + 可选次链接（#secondary slot 或 secondaryLabel/@secondary）
 *
 * testid 约定：传入 `testid`（如 `goals-empty-state`），或用默认插槽自定义。
 */
import type { Component } from 'vue';
import { Button } from '@dailyuse/ui-vue-shadcn';

defineProps<{
  /** lucide-vue-next 图标组件 */
  icon?: Component;
  title: string;
  description?: string;
  /** 主操作按钮文案；缺省则不渲染主按钮 */
  actionLabel?: string;
  /** 次链接文案；缺省则不渲染次链接 */
  secondaryLabel?: string;
  testid?: string;
}>();

defineEmits<{
  action: [];
  secondary: [];
}>();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    :data-testid="testid"
  >
    <component :is="icon" v-if="icon" class="h-10 w-10 text-muted-foreground/60" />
    <div class="space-y-1">
      <p class="text-sm font-medium text-foreground">{{ title }}</p>
      <p v-if="description" class="mx-auto max-w-sm text-xs text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div v-if="actionLabel || $slots.action" class="mt-1">
      <slot name="action">
        <Button size="sm" data-testid="empty-state-action" @click="$emit('action')">
          {{ actionLabel }}
        </Button>
      </slot>
    </div>
    <slot name="secondary">
      <button
        v-if="secondaryLabel"
        type="button"
        class="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        data-testid="empty-state-secondary"
        @click="$emit('secondary')"
      >
        {{ secondaryLabel }}
      </button>
    </slot>
  </div>
</template>
