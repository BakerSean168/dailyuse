<template>
  <footer
    class="global-composer-footer bg-transparent"
    :class="footerPaddingClass"
    data-testid="ai-footer-composer"
  >
    <div class="mx-auto flex w-full flex-col gap-2" :class="maxWidthClass">
      <!-- Tool mode action rail (workflow strips stay above pure dialogue input) -->
      <slot name="action-rail" />

      <!-- Single rounded input surface (§8.2) -->
      <div
        class="rounded-2xl border border-border bg-card shadow-sm"
        :class="density === 'comfortable' ? 'p-3' : 'p-2'"
      >
        <textarea
          ref="composerTextarea"
          :value="modelValue"
          rows="1"
          class="block w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          :style="{ maxHeight: `${textareaMaxPx}px` }"
          :disabled="loading || !canSend"
          :placeholder="t('aiAssistant.dialogs.chat.messagePlaceholder')"
          data-testid="ai-chat-composer"
          @input="handleInput"
          @keydown="handleKeydown"
          @compositionstart="isComposing = true"
          @compositionend="handleCompositionEnd"
        />

        <div
          class="flex items-center gap-2 border-t border-border/60"
          :class="density === 'comfortable' ? 'mt-3 pt-3' : 'mt-2 pt-2'"
        >
          <div class="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <!-- Tool mode dropdown -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="h-8 shrink-0 rounded-xl"
                  :class="density === 'icon' ? 'px-2' : 'px-2.5'"
                  data-testid="ai-chat-tool-menu-trigger"
                  :disabled="!hasAvailableModels"
                  :title="
                    hasAvailableModels
                      ? toolButtonLabel
                      : t('aiAssistant.chatPage.quickEntryDisabled')
                  "
                >
                  <Sparkles class="h-4 w-4" :class="density === 'icon' ? '' : 'mr-1.5'" />
                  <span v-if="density !== 'icon'" class="max-w-[7rem] truncate text-xs">
                    {{ toolButtonLabel }}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-64">
                <DropdownMenuItem
                  data-testid="ai-chat-tool-chat"
                  :disabled="!hasAvailableModels"
                  @click="hasAvailableModels && $emit('start-conversation')"
                >
                  <MessageSquare class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.chatPage.workflow.tools.chat') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="ai-chat-tool-goal-create"
                  :disabled="!hasAvailableModels"
                  @click="hasAvailableModels && $emit('start-conversation', 'goal-create')"
                >
                  <Sparkles class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.chatPage.workflow.tools.goalCreate') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="ai-chat-tool-task-create"
                  :disabled="!hasAvailableModels"
                  @click="hasAvailableModels && $emit('start-conversation', 'task-create')"
                >
                  <ClipboardCheck class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.chatPage.workflow.tools.taskCreate') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="ai-chat-tool-knowledge-qa"
                  :disabled="!hasAvailableModels"
                  @click="hasAvailableModels && $emit('start-conversation', 'knowledge-qa')"
                >
                  <Search class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.chatPage.workflow.tools.knowledgeQa') }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="ai-chat-tool-knowledge-generate"
                  :disabled="!hasAvailableModels"
                  @click="hasAvailableModels && $emit('start-conversation', 'knowledge-generate')"
                >
                  <NotebookPen class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.chatPage.workflow.tools.knowledgeGenerate') }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <WandSparkles class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.actions.automateGoalSetup') }}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <NotebookPen class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.actions.expandDraft') }}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <BarChart3 class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.actions.askAnalytics') }}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <ClipboardCheck class="mr-2 h-4 w-4" />
                  {{ t('aiAssistant.actions.viewQualityReports') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


            <!-- Residual 369: Host engine profile (DirectTurn vs ReadonlyAnalysis) -->
            <div class="shrink-0" data-testid="ai-chat-execution-profile">
              <Select
                :model-value="executionProfileId"
                @update:model-value="
                  $emit(
                    'select-execution-profile',
                    String($event) === 'pi_readonly' ? 'pi_readonly' : 'direct_turn',
                  )
                "
              >
                <SelectTrigger
                  class="h-8 rounded-xl"
                  :class="density === 'icon' ? 'w-10 px-2' : 'w-[7.5rem] px-2.5'"
                  data-testid="ai-chat-execution-profile-trigger"
                  :title="t('aiAssistant.chatPage.hostProfile.label')"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="direct_turn"
                    data-testid="ai-chat-execution-profile-direct"
                  >
                    {{ t('aiAssistant.chatPage.hostProfile.directTurn') }}
                  </SelectItem>
                  <SelectItem
                    value="pi_readonly"
                    data-testid="ai-chat-execution-profile-readonly"
                  >
                    {{ t('aiAssistant.chatPage.hostProfile.piReadonly') }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Model selector / empty warning (no permanent full-row empty card) -->
            <div v-if="modelGroups.length" class="min-w-0" :class="density === 'icon' ? 'flex-1' : 'flex-1'">
              <Select
                :model-value="selectedModelKey"
                @update:model-value="$emit('select-model', String($event))"
              >
                <SelectTrigger
                  class="h-8 w-full rounded-xl"
                  :class="density === 'comfortable' ? 'sm:max-w-xs' : 'max-w-full'"
                >
                  <SelectValue :placeholder="t('aiAssistant.chatPage.emptyModels')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup v-for="group in modelGroups" :key="group.providerId">
                    <SelectLabel>{{ group.providerName }}</SelectLabel>
                    <SelectItem
                      v-for="model in group.models"
                      :key="model.key"
                      :value="model.key"
                    >
                      {{ model.modelName }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div
              v-else
              class="flex min-w-0 flex-1 flex-col gap-1"
              data-testid="ai-chat-empty-models-cue"
            >
              <Button
                variant="outline"
                class="h-8 w-full shrink-0 rounded-xl border-dashed text-amber-900 dark:text-amber-300"
                :class="density === 'icon' ? 'px-2' : 'px-2.5'"
                data-testid="ai-chat-empty-models"
                :title="t('aiAssistant.chatPage.emptyModelsHint')"
                @click="$emit('open-settings')"
              >
                <AlertTriangle class="h-4 w-4" :class="density === 'icon' ? '' : 'mr-1.5'" />
                <span v-if="density !== 'icon'" class="max-w-[10rem] truncate text-xs">
                  {{ t('aiAssistant.chatPage.emptyModelsConfigure') }}
                </span>
              </Button>
              <p
                v-if="density !== 'icon'"
                class="truncate px-1 text-[11px] text-amber-900/80 dark:text-amber-200/80"
                data-testid="ai-chat-empty-models-hint"
              >
                {{ t('aiAssistant.chatPage.emptyModelsHint') }}
              </p>
            </div>
          </div>

          <!-- Send / Stop -->
          <Button
            v-if="loading"
            variant="outline"
            class="h-8 shrink-0 rounded-xl"
            :class="density === 'icon' ? 'px-2' : 'px-2.5'"
            data-testid="ai-chat-stop-generating"
            :title="t('aiAssistant.dialogs.chat.stopGenerating')"
            @click="$emit('stop')"
          >
            <Square class="h-4 w-4" :class="density === 'icon' ? '' : 'mr-1.5'" />
            <span v-if="density !== 'icon'" class="text-xs">
              {{ t('aiAssistant.dialogs.chat.stopGenerating') }}
            </span>
          </Button>
          <Button
            v-else
            class="h-8 shrink-0 rounded-xl"
            :class="density === 'icon' ? 'px-2' : 'px-2.5'"
            :disabled="!modelValue.trim() || !canSend"
            data-testid="ai-chat-send-message"
            :title="t('aiAssistant.dialogs.chat.sendMessage')"
            @click="$emit('send')"
          >
            <ArrowUp class="h-4 w-4" :class="density === 'icon' ? '' : 'mr-1.5'" />
            <span v-if="density !== 'icon'" class="text-xs">
              {{ t('aiAssistant.dialogs.chat.sendMessage') }}
            </span>
          </Button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  AlertTriangle,
  ArrowUp,
  BarChart3,
  ClipboardCheck,
  MessageSquare,
  NotebookPen,
  Search,
  Sparkles,
  Square,
  WandSparkles,
} from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import type { ChatModelOption, WorkflowMode } from '../composables/types';
import {
  COMPOSER_TEXTAREA_MAX_PX,
  type ComposerDensity,
} from '../../../layouts/shell/panel-geometry';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    loading: boolean;
    canSend: boolean;
    toolButtonLabel: string;
    modelGroups: Array<{
      providerId: string;
      providerName: string;
      models: ChatModelOption[];
    }>;
    selectedModelKey: string;
    /** Residual 369: Host open-chat engine profile. */
    executionProfileId?: 'direct_turn' | 'pi_readonly';
    /** Shell density: comfortable (chat) / compact (focus or mid split) / icon (narrow AI). */
    density?: ComposerDensity;
  }>(),
  { density: 'comfortable', executionProfileId: 'direct_turn' },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
  stop: [];
  'start-conversation': [mode?: WorkflowMode | string];
  'select-model': [modelKey: string];
  'select-execution-profile': [profile: 'direct_turn' | 'pi_readonly'];
  'open-settings': [];
}>();

const { t } = useI18n();

const composerTextarea = ref<HTMLTextAreaElement | null>(null);
const isComposing = ref(false);
const textareaMaxPx = COMPOSER_TEXTAREA_MAX_PX;

/** Quick-entry tools require at least one configured model. */
const hasAvailableModels = computed(
  () => props.modelGroups.some((group) => group.models.length > 0) && props.canSend,
);

const footerPaddingClass = computed(() => {
  if (props.density === 'comfortable') return 'px-4 py-3 sm:px-6';
  if (props.density === 'compact') return 'px-3 py-2';
  return 'px-2 py-1.5';
});

const maxWidthClass = computed(() =>
  props.density === 'comfortable' ? 'max-w-4xl' : 'max-w-none',
);

defineExpose({ composerTextarea });

function resizeTextarea() {
  const el = composerTextarea.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, textareaMaxPx)}px`;
}

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  void nextTick(resizeTextarea);
}

function handleCompositionEnd(event: CompositionEvent) {
  isComposing.value = false;
  const target = event.target as HTMLTextAreaElement | null;
  if (target) {
    emit('update:modelValue', target.value);
    void nextTick(resizeTextarea);
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) return;
  // IME: do not send while composing (Chinese etc.) or browser composition keyCode 229
  if (isComposing.value || event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  if (props.loading || !props.modelValue.trim() || !props.canSend) return;
  emit('send');
}

watch(
  () => props.modelValue,
  () => {
    void nextTick(resizeTextarea);
  },
);
</script>
