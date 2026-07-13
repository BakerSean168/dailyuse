<script setup lang="ts">
/**
 * GlobalComposer (UI 重构 V2 壳)
 *
 * 常驻 AI 输入条。三态下都在 AI 列底部（专注态浮在业务面板底部——由
 * AppShell 决定挂载位置）。S0 为纯骨架：输入框 + 模式占位 + 发送按钮，
 * emit 事件；S1 接 AIFooterComposer 的真实逻辑（模式/模型 ⚙、发送、
 * 流式 stop）。此处不直连 AI 服务（走 composable 门面，S1 接线）。
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Send } from 'lucide-vue-next';

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
