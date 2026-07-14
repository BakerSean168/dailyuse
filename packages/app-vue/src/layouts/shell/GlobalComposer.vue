<script setup lang="ts">
/**
 * GlobalComposer (UI 重构 V2 壳)
 *
 * 常驻 AI 输入条骨架。S1 切换后暂未挂载：真实 Composer 仍是 AIChatView
 * 内的 AIFooterComposer（常驻层单实例，专注态由 composer-only 模式收缩）。
 * 本组件是 S3「AI 工作区精修」的落点——届时 AIFooterComposer 的模式/
 * 模型选择逻辑收敛进来，成为壳级 Composer（V2 §6.0）。
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Send } from '@lucide/vue';

const emit = defineEmits<{
  (e: 'send', text: string): void;
}>();

const { t } = useI18n();
const draft = ref('');

function submit() {
  const text = draft.value.trim();
  if (!text) return;
  emit('send', text);
  draft.value = '';
}
</script>

<template>
  <div class="global-composer shrink-0 border-t border-border bg-background p-3" data-testid="global-composer">
    <div class="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-card p-2">
      <textarea
        v-model="draft"
        rows="1"
        class="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
        :placeholder="t('shell.composer.placeholder')"
        @keydown.enter.exact.prevent="submit"
      />
      <button
        type="button"
        class="shrink-0 rounded-lg bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        :disabled="!draft.trim()"
        :title="t('shell.composer.send')"
        @click="submit"
      >
        <Send class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
