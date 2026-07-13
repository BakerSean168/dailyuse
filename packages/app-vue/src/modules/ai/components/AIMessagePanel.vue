<template>
  <div ref="viewport" class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <!-- Message timeline -->
      <template v-if="timeline.length">
        <article
          v-for="item in timeline"
          :key="item.id"
          class="flex"
          :class="item.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[78%]"
            :class="
              item.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'border bg-card text-card-foreground'
            "
          >
            <p class="mb-2 text-[11px] uppercase tracking-[0.18em] opacity-70">
              {{
                item.role === 'user'
                  ? t('aiAssistant.dialogs.chat.you')
                  : t('aiAssistant.dialogs.chat.assistant')
              }}
            </p>
            <p class="whitespace-pre-wrap break-words">
              {{ item.content || typingPlaceholder(item) }}
            </p>
            <p
              v-if="item.role === 'assistant' && (item.status === 'aborted' || item.status === 'error')"
              class="mt-2 text-xs"
              :class="item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'"
            >
              {{ getMessageStatusLabel(item) }}
            </p>
          </div>
        </article>
      </template>

      <!-- Empty state -->
      <div v-else class="flex min-h-[20rem] items-center justify-center">
        <div class="w-full max-w-xl space-y-4">
          <div class="rounded-3xl border bg-card p-6 text-left">
            <div
              class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <component
                :is="
                  toolMode === 'knowledge-generate'
                    ? NotebookPen
                    : toolMode === 'goal-create'
                      ? Sparkles
                      : toolMode === 'knowledge-qa'
                        ? Search
                        : Bot
                "
                class="h-5 w-5"
              />
            </div>
            <h2 class="text-base font-medium text-foreground">
              {{
                toolMode === 'chat'
                  ? t('aiAssistant.chatPage.emptyTitle')
                  : t(`aiAssistant.chatPage.toolIntro.${getToolLocaleKey(toolMode)}.title`)
              }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{
                toolMode === 'chat'
                  ? t('aiAssistant.chatPage.emptyDescription')
                  : t(`aiAssistant.chatPage.toolIntro.${getToolLocaleKey(toolMode)}.description`)
              }}
            </p>
          </div>

          <!-- 三个工作流入口卡（仅 chat 模式空态，点击即设定工具模式，§1-4） -->
          <div v-if="toolMode === 'chat'" class="grid gap-2 sm:grid-cols-3">
            <button
              v-for="entry in workflowEntries"
              :key="entry.mode"
              type="button"
              class="rounded-2xl border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-muted/40"
              :data-testid="`ai-welcome-entry-${entry.mode}`"
              @click="$emit('select-tool', entry.mode)"
            >
              <component :is="entry.icon" class="h-4 w-4 text-muted-foreground" />
              <p class="mt-2 text-sm font-medium text-foreground">
                {{ t(`aiAssistant.chatPage.toolIntro.${entry.localeKey}.title`) }}
              </p>
              <p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {{ t(`aiAssistant.chatPage.toolIntro.${entry.localeKey}.description`) }}
              </p>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Bot, NotebookPen, Search, Sparkles } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { getToolLocaleKey, type ChatItem, type WorkflowMode } from '../composables/types';
import { useAIFormatters } from '../composables/useAIFormatters';

defineProps<{
  timeline: ChatItem[];
  toolMode: WorkflowMode;
}>();

defineEmits<{
  'select-tool': [mode: WorkflowMode];
}>();

const workflowEntries = [
  { mode: 'goal-create', localeKey: getToolLocaleKey('goal-create'), icon: Sparkles },
  { mode: 'knowledge-generate', localeKey: getToolLocaleKey('knowledge-generate'), icon: NotebookPen },
  { mode: 'knowledge-qa', localeKey: getToolLocaleKey('knowledge-qa'), icon: Search },
] as const;

const viewport = ref<HTMLElement | null>(null);

defineExpose({ viewport });

const { t } = useI18n();
const { typingPlaceholder, getMessageStatusLabel } = useAIFormatters();
</script>
