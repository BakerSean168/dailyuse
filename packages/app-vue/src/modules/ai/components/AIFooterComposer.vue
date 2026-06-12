<template>
  <footer class="border-t bg-background px-4 py-4 sm:px-6">
    <div class="mx-auto flex w-full max-w-4xl flex-col gap-3">
      <!-- Tool mode action rail -->
      <slot name="action-rail" />

      <!-- Composer -->
      <div class="rounded-2xl border bg-card p-3">
        <textarea
          ref="composerTextarea"
          :value="modelValue"
          rows="2"
          class="block w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          :disabled="loading || !canSend"
          :placeholder="t('aiAssistant.dialogs.chat.messagePlaceholder')"
          data-testid="ai-chat-composer"
          @input="handleInput"
          @keydown="handleKeydown"
        />

        <div class="mt-3 flex flex-col gap-3 border-t pt-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <!-- Tool mode dropdown -->
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-9 rounded-xl sm:shrink-0"
                    data-testid="ai-chat-tool-menu-trigger"
                  >
                    <Sparkles class="mr-2 h-4 w-4" />
                    {{ toolButtonLabel }}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-64">
                  <DropdownMenuItem data-testid="ai-chat-tool-chat" @click="$emit('start-conversation')">
                    <MessageSquare class="mr-2 h-4 w-4" />
                    {{ t('aiAssistant.chatPage.workflow.tools.chat') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="ai-chat-tool-goal-create"
                    @click="$emit('start-conversation', 'goal-create')"
                  >
                    <Sparkles class="mr-2 h-4 w-4" />
                    {{ t('aiAssistant.chatPage.workflow.tools.goalCreate') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="ai-chat-tool-knowledge-qa"
                    @click="$emit('start-conversation', 'knowledge-qa')"
                  >
                    <Search class="mr-2 h-4 w-4" />
                    {{ t('aiAssistant.chatPage.workflow.tools.knowledgeQa') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="ai-chat-tool-knowledge-generate"
                    @click="$emit('start-conversation', 'knowledge-generate')"
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

              <!-- Model selector -->
              <div v-if="modelGroups.length" class="min-w-0 flex-1">
                <Select
                  :model-value="selectedModelKey"
                  @update:model-value="$emit('select-model', String($event))"
                >
                  <SelectTrigger class="h-9 w-full rounded-xl sm:max-w-xs">
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
                class="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground"
              >
                <p class="truncate">{{ t('aiAssistant.chatPage.emptyModels') }}</p>
                <Button variant="outline" size="sm" @click="$emit('open-settings')">
                  {{ t('nav.settings') }}
                </Button>
              </div>
            </div>

            <!-- Send / Stop -->
            <Button
              v-if="loading"
              variant="outline"
              class="rounded-xl lg:shrink-0"
              @click="$emit('stop')"
            >
              <Square class="mr-2 h-4 w-4" />
              {{ t('aiAssistant.dialogs.chat.stopGenerating') }}
            </Button>
            <Button
              v-else
              class="rounded-xl lg:shrink-0"
              :disabled="!modelValue.trim() || !canSend"
              data-testid="ai-chat-send-message"
              @click="$emit('send')"
            >
              <ArrowUp class="mr-2 h-4 w-4" />
              {{ t('aiAssistant.dialogs.chat.sendMessage') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  ArrowUp,
  BarChart3,
  ClipboardCheck,
  MessageSquare,
  NotebookPen,
  Search,
  Sparkles,
  Square,
  WandSparkles,
} from 'lucide-vue-next';
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

const props = defineProps<{
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
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
  stop: [];
  'start-conversation': [mode?: WorkflowMode | string];
  'select-model': [modelKey: string];
  'open-settings': [];
}>();

const { t } = useI18n();

const composerTextarea = ref<HTMLTextAreaElement | null>(null);

defineExpose({ composerTextarea });

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  if (props.loading || !props.modelValue.trim() || !props.canSend) return;
  emit('send');
}
</script>
