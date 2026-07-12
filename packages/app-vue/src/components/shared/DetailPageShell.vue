<script setup lang="ts">
/**
 * DetailPageShell — 详情页标准壳（UI_PAGE_REDESIGN_PLAN §0.1）
 *
 * 返回按钮 + 标题 + 状态徽章（#badges）+ 右置操作（#actions）
 *   → 可选单行元数据（#meta）
 *   → 内容 max-w-4xl（#default）
 *
 * 适用：目标详情、KR 详情、复盘、任务详情、规则详情/编辑/历史。
 */
import { useRouter } from 'vue-router';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { ArrowLeft } from 'lucide-vue-next';

const props = defineProps<{
  title: string;
  /** 显式返回目标路径；缺省时走 history back。 */
  backTo?: string;
}>();

const router = useRouter();

function goBack() {
  if (props.backTo) {
    router.push(props.backTo);
  } else {
    router.back();
  }
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden bg-background">
    <div
      class="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-6 py-3"
    >
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 shrink-0"
        data-testid="detail-page-back"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <h1 class="truncate text-base font-semibold tracking-tight text-foreground">
          {{ title }}
        </h1>
        <slot name="badges" />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.meta" class="border-b border-border/40 px-6 py-2">
      <slot name="meta" />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto w-full max-w-4xl px-6 py-6">
        <slot />
      </div>
    </div>
  </div>
</template>
