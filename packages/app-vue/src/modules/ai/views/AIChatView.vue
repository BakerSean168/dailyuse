<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-background">
    <aside class="hidden min-h-0 w-72 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div class="flex h-14 items-center border-b px-4">
        <div class="flex items-center gap-2 font-semibold">
          <Bot class="h-5 w-5 text-primary" />
          <span>{{ t('nav.aiChat') }}</span>
        </div>

        <div class="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('aiAssistant.dialogs.chat.newConversation')"
            @click="startNewConversation()"
          >
            <Plus class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('aiAssistant.dialogs.chat.refresh')"
            :disabled="conversationListLoading"
            @click="loadConversationList"
          >
            <RefreshCcw class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :title="t('nav.settings')"
            @click="openSettings"
          >
            <Settings2 class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-2">
        <div
          v-for="item in conversationList"
          :key="item.id"
          role="button"
          tabindex="0"
          class="group mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="
            chatConversationId === item.id
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          "
          @click="selectConversation(item)"
          @keydown.enter.prevent="selectConversation(item)"
          @keydown.space.prevent="selectConversation(item)"
        >
          <MessageSquare class="h-4 w-4 shrink-0" />
          <span class="min-w-0 flex-1 truncate">
            {{ item.name || item.title || t('common.untitled') }}
          </span>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            @click.stop="deleteConversation(item.id)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>

        <div
          v-if="!conversationList.length && !conversationListLoading"
          class="rounded-lg px-3 py-4 text-sm text-muted-foreground"
        >
          {{ t('aiAssistant.dialogs.chat.noSavedConversations') }}
        </div>
      </div>
    </aside>

    <section class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="border-b bg-background px-4 py-3 sm:px-6">
        <div class="flex items-center justify-between gap-3">
          <h1 class="truncate text-lg font-medium text-foreground">
            {{ currentConversationLabel }}
          </h1>

          <div class="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.newConversation')"
              @click="startNewConversation()"
            >
              <Plus class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :title="t('aiAssistant.dialogs.chat.refresh')"
              :disabled="conversationListLoading"
              @click="loadConversationList"
            >
              <RefreshCcw class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :title="t('nav.settings')"
              @click="openSettings"
            >
              <Settings2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div v-if="conversationList.length" class="mt-3 flex gap-2 overflow-x-auto md:hidden">
          <button
            v-for="item in conversationList"
            :key="item.id"
            class="rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors"
            :class="
              chatConversationId === item.id
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground'
            "
            @click="selectConversation(item)"
          >
            {{ item.name || item.title || t('common.untitled') }}
          </button>
        </div>
      </header>

      <div ref="messagesViewport" class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <template v-if="chatTimeline.length">
            <article
              v-for="item in chatTimeline"
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
              </div>
            </article>
          </template>

          <div v-else class="flex min-h-[20rem] items-center justify-center">
            <div class="max-w-xl rounded-3xl border bg-card p-6 text-left">
              <div
                class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <component
                  :is="
                    toolMode === 'knowledge-note'
                      ? NotebookPen
                      : toolMode === 'goal'
                        ? Sparkles
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
          </div>

          <section v-if="toolMode === 'goal' && goalDraft" class="rounded-3xl border bg-card p-5">
            <div class="flex flex-col gap-4">
              <div class="space-y-2">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.goalDraftTitle') }}
                </p>
                <h2 class="text-lg font-semibold text-foreground">
                  {{ editableGoal.name || t('common.untitled') }}
                </h2>
                <p class="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {{ editableGoal.description }}
                </p>
              </div>

              <div v-if="editableKeyResults.length" class="flex flex-wrap gap-2">
                <span
                  v-for="(item, index) in editableKeyResults"
                  :key="`${item.title}-${index}`"
                  class="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {{ item.title || t('aiAssistant.goalDraft.keyResults') }}
                </span>
              </div>

              <AIGoalDraftEditor
                v-if="showGoalDraftEditor"
                :goal="editableGoal"
                :key-results="editableKeyResults"
                :is-submitting="creatingGoal"
                @confirm="handleCreateGoalFromDraft"
                @add-key-result="addKeyResultDraft"
                @remove-key-result="removeKeyResultDraft"
                @update-goal="editableGoal = $event"
                @update-key-result="updateKeyResultDraft"
              />
            </div>
          </section>

          <section
            v-if="toolMode === 'knowledge-note' && noteSummary"
            class="rounded-3xl border bg-card p-5"
          >
            <div class="space-y-4">
              <div>
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.noteCreatedTitle') }}
                </p>
                <h2 class="mt-2 text-lg font-semibold text-foreground">
                  {{ noteSummary.resource?.name || t('aiAssistant.dialogs.note.newNoteCreated') }}
                </h2>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border bg-muted/30 p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.note.savedTo') }}
                  </p>
                  <p class="mt-2 text-sm font-medium text-foreground">
                    {{ noteSummary.resolvedPath }}
                  </p>
                </div>
                <div class="rounded-2xl border bg-muted/30 p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.note.preview') }}
                  </p>
                  <p class="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {{ notePreview }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button variant="outline" @click="openCreatedNote">
                  {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
                </Button>
                <Button variant="ghost" @click="startNewConversation('knowledge-note')">
                  {{ t('aiAssistant.chatPage.workflow.startAnotherNote') }}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer class="border-t bg-background px-4 py-4 sm:px-6">
        <div class="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div v-if="toolMode !== 'chat'" class="rounded-2xl border bg-muted/30 px-4 py-3">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.chatPage.workflow.activeMode') }}
                </p>
                <h2 class="mt-1 text-sm font-semibold text-foreground">
                  {{ currentToolLabel }}
                </h2>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                  {{ workflowStatusText }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <template v-if="toolMode === 'goal'">
                  <Button
                    v-if="!goalDraft"
                    variant="outline"
                    :disabled="goalDraftLoading || !canRunWorkflowActions"
                    @click="generateGoalDraftFromConversation"
                  >
                    {{
                      goalDraftLoading
                        ? t('aiAssistant.dialogs.generateGoal.generating')
                        : t('aiAssistant.chatPage.workflow.generateGoalDraft')
                    }}
                  </Button>

                  <template v-else>
                    <Button :disabled="creatingGoal" @click="handleCreateGoalFromDraft">
                      {{
                        creatingGoal
                          ? t('aiAssistant.goalDraft.creatingGoal')
                          : t('aiAssistant.chatPage.workflow.createGoalDirectly')
                      }}
                    </Button>
                    <Button variant="outline" @click="toggleGoalDraftEditor">
                      {{
                        showGoalDraftEditor
                          ? t('aiAssistant.chatPage.workflow.hideGoalEditor')
                          : t('aiAssistant.chatPage.workflow.editGoalBeforeCreate')
                      }}
                    </Button>
                    <Button
                      variant="ghost"
                      :disabled="goalDraftLoading || !canRunWorkflowActions"
                      @click="generateGoalDraftFromConversation"
                    >
                      {{ t('aiAssistant.chatPage.workflow.regenerateGoalDraft') }}
                    </Button>
                  </template>
                </template>

                <template v-else-if="toolMode === 'knowledge-note'">
                  <Button
                    v-if="!noteSummary"
                    :disabled="noteCreating || !canRunWorkflowActions"
                    @click="createKnowledgeNoteFromConversation"
                  >
                    {{
                      noteCreating
                        ? t('aiAssistant.dialogs.note.creating')
                        : t('aiAssistant.chatPage.workflow.createKnowledgeNote')
                    }}
                  </Button>
                  <Button v-else variant="outline" @click="openCreatedNote">
                    {{ t('aiAssistant.chatPage.workflow.openCreatedNote') }}
                  </Button>
                </template>

                <Button variant="ghost" @click="exitToolMode">
                  {{ t('aiAssistant.chatPage.workflow.exitTool') }}
                </Button>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border bg-card p-3">
            <textarea
              ref="composerTextarea"
              v-model="chatMessage"
              rows="2"
              class="block w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
              :disabled="chatLoading || !canSendMessage"
              :placeholder="t('aiAssistant.dialogs.chat.messagePlaceholder')"
              @input="handleComposerInput"
              @keydown="handleComposerKeydown"
            />

            <div class="mt-3 flex flex-col gap-3 border-t pt-3">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="outline" class="h-9 rounded-xl sm:shrink-0">
                        <Sparkles class="mr-2 h-4 w-4" />
                        {{ currentToolButtonLabel }}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" class="w-64">
                      <DropdownMenuItem @click="startNewConversation()">
                        <MessageSquare class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.chatPage.workflow.tools.chat') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="startNewConversation('goal')">
                        <Sparkles class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.chatPage.workflow.tools.goal') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="startNewConversation('knowledge-note')">
                        <NotebookPen class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.chatPage.workflow.tools.knowledgeNote') }}
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
                        <Search class="mr-2 h-4 w-4" />
                        {{ t('aiAssistant.actions.askKnowledge') }}
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

                  <div v-if="modelGroups.length" class="min-w-0 flex-1">
                    <Select
                      :model-value="selectedModelKey"
                      @update:model-value="selectModel(String($event))"
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
                    <Button variant="outline" size="sm" @click="openSettings">
                      {{ t('nav.settings') }}
                    </Button>
                  </div>
                </div>

                <Button
                  class="rounded-xl lg:shrink-0"
                  :disabled="chatLoading || !chatMessage.trim() || !canSendMessage"
                  @click="handleSendChat"
                >
                  <ArrowUp class="mr-2 h-4 w-4" />
                  {{
                    chatLoading
                      ? t('aiAssistant.dialogs.chat.sending')
                      : t('aiAssistant.dialogs.chat.sendMessage')
                  }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  ArrowUp,
  BarChart3,
  Bot,
  ClipboardCheck,
  MessageSquare,
  NotebookPen,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { translateResultError } from '../../../shared/utils/translateResultError';
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
import {
  KeyResultCalculationMethod,
  KeyResultValueType,
  type AddKeyResultReq,
  type CreateGoalReq,
} from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { useAI } from '../composables/useAI';
import { useGoal } from '../../goal/composables/useGoal';
import { useRepository } from '../../repository/composables/useRepository';
import { useUserSetting } from '../../setting/composables/useUserSetting';
import { useEditorWorkspaceActions } from '../../editor/composables';
import AIGoalDraftEditor from '../components/AIGoalDraftEditor.vue';

type WorkflowMode = 'chat' | 'goal' | 'knowledge-note';

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ConversationSummary = {
  id: string;
  name?: string;
  title?: string;
};

type ProviderListItem = {
  id: string;
  name?: string;
  defaultModel?: string | null;
  availableModels?: Array<{
    id: string;
    name?: string;
  }>;
  isDefault?: boolean;
};

type ChatModelOption = {
  key: string;
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
};

type StreamDoneResult = {
  userMessage?: { id: string; content: string };
  assistantMessage?: { id: string; content: string };
};

type GoalDraft = {
  goal: {
    name?: string;
    title?: string;
    description: string;
    category: string;
    importance: CreateGoalReq['importance'];
    motivation?: string;
    feasibilityAnalysis?: string;
    tags?: string[];
    suggestedStartDate: number;
    suggestedEndDate: number;
  };
  keyResults?: Array<{
    title: string;
    description?: string;
    valueType: AddKeyResultReq['valueType'];
    calculationMethod: AddKeyResultReq['calculationMethod'];
    startValue: number;
    currentValue: number;
    targetValue: number;
    unit: string;
    weight: number;
  }>;
};

type NoteSummary = {
  resolvedPath: string;
  resource?: { id?: string; name?: string; content?: string };
};

const LAST_CONVERSATION_STORAGE_KEY = 'ai:last-conversation-id';
const WORKFLOW_STORAGE_KEY = 'ai:conversation-workflow-map';
const LAST_MODEL_STORAGE_KEY = 'ai:last-model-key';
const CONVERSATION_MODEL_STORAGE_KEY = 'ai:conversation-model-map';

type PersistedWorkflowEntry = {
  mode: WorkflowMode;
  goalDraft: GoalDraft | null;
  editableGoal: {
    name: string;
    description: string;
    category: string;
    importance: CreateGoalReq['importance'];
    motivation: string;
    feasibilityAnalysis: string;
    tags: string[];
    startDate: number | null;
    targetDate: number | null;
  };
  editableKeyResults: Array<{
    title: string;
    description: string;
    valueType: AddKeyResultReq['valueType'];
    calculationMethod: AddKeyResultReq['calculationMethod'];
    startValue: number;
    currentValue: number;
    targetValue: number;
    unit: string;
    weight: number;
  }>;
  noteSummary: NoteSummary | null;
  showGoalDraftEditor: boolean;
};

type PersistedConversationModelMap = Record<string, string>;

const { t } = useI18n();
const router = useRouter();
const { service, providers, loadProviders } = useAI();
const { createGoal, addKeyResult } = useGoal();
const { getCategory } = useUserSetting();
const { initRepository, fetchResources, resources } = useRepository();
const { requestOpenResource } = useEditorWorkspaceActions();

const conversationTitle = ref('');
const chatMessage = ref('');
const chatLoading = ref(false);
const chatConversationId = ref('');
const chatTimeline = ref<ChatItem[]>([]);
const conversationListLoading = ref(false);
const conversationList = ref<ConversationSummary[]>([]);
const lastActiveConversationId = ref('');
const selectedModelKey = ref('');
const messagesViewport = ref<HTMLElement | null>(null);
const composerTextarea = ref<HTMLTextAreaElement | null>(null);
const toolMode = ref<WorkflowMode>('chat');
const goalDraftLoading = ref(false);
const goalDraft = ref<GoalDraft | null>(null);
const showGoalDraftEditor = ref(false);
const creatingGoal = ref(false);
const editableGoal = ref<{
  name: string;
  description: string;
  category: string;
  importance: CreateGoalReq['importance'];
  motivation: string;
  feasibilityAnalysis: string;
  tags: string[];
  startDate: number | null;
  targetDate: number | null;
}>(createEmptyGoalDraft());
const editableKeyResults = ref<
  Array<{
    title: string;
    description: string;
    valueType: AddKeyResultReq['valueType'];
    calculationMethod: AddKeyResultReq['calculationMethod'];
    startValue: number;
    currentValue: number;
    targetValue: number;
    unit: string;
    weight: number;
  }>
>([]);
const noteCreating = ref(false);
const noteSummary = ref<NoteSummary | null>(null);
const suspendWorkflowPersistence = ref(false);

const aiSettings = computed(() => getCategory('ai'));
const knowledgeNoteSubpath = computed(() => aiSettings.value?.knowledgeNoteSubpath ?? '');
const providerList = computed(() =>
  Array.isArray(providers.value) ? (providers.value as ProviderListItem[]) : [],
);
const modelGroups = computed(() =>
  providerList.value
    .map((provider) => {
      const fallbackModels =
        provider.defaultModel && !provider.availableModels?.length
          ? [{ id: provider.defaultModel, name: provider.defaultModel }]
          : [];
      const models = [...(provider.availableModels ?? []), ...fallbackModels];

      return {
        providerId: provider.id,
        providerName: provider.name || t('common.unknown'),
        models: models.map((model) => ({
          key: `${provider.id}::${model.id}`,
          providerId: provider.id,
          providerName: provider.name || t('common.unknown'),
          modelId: model.id,
          modelName: model.name || model.id,
        })),
      };
    })
    .filter((group) => group.models.length > 0),
);
const allModelOptions = computed(() => modelGroups.value.flatMap((group) => group.models));
const selectedModel = computed<ChatModelOption | null>(
  () => allModelOptions.value.find((item) => item.key === selectedModelKey.value) || null,
);
const canSendMessage = computed(() => allModelOptions.value.length > 0);
const hasWorkflowMessages = computed(() =>
  chatTimeline.value.some((item) => item.content.trim().length > 0),
);
const hasWorkflowUserMessages = computed(() =>
  chatTimeline.value.some((item) => item.role === 'user' && item.content.trim().length > 0),
);
const canRunWorkflowActions = computed(
  () => Boolean(selectedModel.value) && !chatLoading.value && hasWorkflowMessages.value,
);
const currentConversationLabel = computed(
  () => conversationTitle.value || getDefaultConversationName(toolMode.value),
);
const currentToolLabel = computed(() =>
  toolMode.value === 'chat'
    ? t('aiAssistant.chatPage.workflow.tools.chat')
    : t(`aiAssistant.chatPage.workflow.tools.${getToolLocaleKey(toolMode.value)}`),
);
const currentToolButtonLabel = computed(() =>
  toolMode.value === 'chat'
    ? t('aiAssistant.chatPage.workflow.toolButton')
    : currentToolLabel.value,
);
const workflowStatusText = computed(() => {
  if (toolMode.value === 'goal') {
    if (goalDraftLoading.value) {
      return t('aiAssistant.dialogs.generateGoal.generating');
    }

    if (!hasWorkflowUserMessages.value) {
      return t('aiAssistant.chatPage.workflow.goalCollectingHint');
    }

    if (goalDraft.value) {
      return t('aiAssistant.chatPage.workflow.goalDraftReadyHint');
    }

    return t('aiAssistant.chatPage.workflow.goalCollectingHint');
  }

  if (toolMode.value === 'knowledge-note') {
    if (noteCreating.value) {
      return t('aiAssistant.dialogs.note.creating');
    }

    if (noteSummary.value) {
      return t('aiAssistant.chatPage.workflow.noteCreatedHint', {
        path: noteSummary.value.resolvedPath,
      });
    }

    return t('aiAssistant.chatPage.workflow.noteCollectingHint');
  }

  return '';
});
const notePreview = computed(() => {
  const content = noteSummary.value?.resource?.content;
  if (!content) {
    return t('aiAssistant.dialogs.note.previewUnavailable');
  }

  return content.slice(0, 280);
});

function createEmptyGoalDraft(): {
  name: string;
  description: string;
  category: string;
  importance: CreateGoalReq['importance'];
  motivation: string;
  feasibilityAnalysis: string;
  tags: string[];
  startDate: number | null;
  targetDate: number | null;
} {
  return {
    name: '',
    description: '',
    category: '',
    importance: ImportanceLevel.Moderate,
    motivation: '',
    feasibilityAnalysis: '',
    tags: [],
    startDate: null,
    targetDate: null,
  };
}

function getToolLocaleKey(mode: WorkflowMode) {
  if (mode === 'knowledge-note') {
    return 'knowledgeNote';
  }

  return mode;
}

function getDefaultConversationName(mode: WorkflowMode) {
  if (mode === 'goal') {
    return t('aiAssistant.chatPage.workflow.defaultConversationNames.goal');
  }

  if (mode === 'knowledge-note') {
    return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeNote');
  }

  return t('aiAssistant.dialogs.chat.defaultConversationName');
}

function readLastSelectedModelKey(): string {
  return localStorage.getItem(LAST_MODEL_STORAGE_KEY) || '';
}

function writeLastSelectedModelKey(modelKey: string) {
  if (!modelKey) {
    localStorage.removeItem(LAST_MODEL_STORAGE_KEY);
    return;
  }

  localStorage.setItem(LAST_MODEL_STORAGE_KEY, modelKey);
}

function readConversationModelStorage(): PersistedConversationModelMap {
  try {
    const raw = localStorage.getItem(CONVERSATION_MODEL_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object'
      ? (parsed as PersistedConversationModelMap)
      : {};
  } catch {
    return {};
  }
}

function writeConversationModelStorage(next: PersistedConversationModelMap) {
  localStorage.setItem(CONVERSATION_MODEL_STORAGE_KEY, JSON.stringify(next));
}

function persistSelectedModel(modelKey: string, conversationId?: string) {
  writeLastSelectedModelKey(modelKey);

  if (!conversationId) {
    return;
  }

  const stored = readConversationModelStorage();
  if (!modelKey) {
    delete stored[conversationId];
  } else {
    stored[conversationId] = modelKey;
  }
  writeConversationModelStorage(stored);
}

function clearConversationModelSelection(conversationId: string) {
  if (!conversationId) {
    return;
  }

  const stored = readConversationModelStorage();
  if (!(conversationId in stored)) {
    return;
  }

  delete stored[conversationId];
  writeConversationModelStorage(stored);
}

function getPersistedModelKey(conversationId?: string): string {
  if (conversationId) {
    const conversationModelKey = readConversationModelStorage()[conversationId];
    if (conversationModelKey) {
      return conversationModelKey;
    }
  }

  return readLastSelectedModelKey();
}

function syncSelectedModel(preferredModelKey?: string) {
  if (!allModelOptions.value.length) {
    selectedModelKey.value = '';
    return;
  }

  const preferredCandidates = [preferredModelKey, selectedModelKey.value].filter(
    (item): item is string => Boolean(item),
  );

  for (const candidate of preferredCandidates) {
    if (allModelOptions.value.some((item) => item.key === candidate)) {
      selectedModelKey.value = candidate;
      persistSelectedModel(candidate, chatConversationId.value || undefined);
      return;
    }
  }

  const defaultProvider =
    providerList.value.find((item) => item.isDefault) ||
    providerList.value[0] ||
    null;

  const defaultOption =
    (defaultProvider?.defaultModel
      ? allModelOptions.value.find(
          (item) =>
            item.providerId === defaultProvider.id && item.modelId === defaultProvider.defaultModel,
        )
      : null) ||
    allModelOptions.value.find((item) => item.providerId === defaultProvider?.id) ||
    allModelOptions.value[0];

  selectedModelKey.value = defaultOption?.key || '';
  persistSelectedModel(selectedModelKey.value, chatConversationId.value || undefined);
}

function updateLastActiveConversation(id: string) {
  lastActiveConversationId.value = id;
  localStorage.setItem(LAST_CONVERSATION_STORAGE_KEY, id);
}

function clearLastActiveConversation() {
  lastActiveConversationId.value = '';
  localStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
}

function readWorkflowStorage(): Record<string, PersistedWorkflowEntry> {
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, PersistedWorkflowEntry>) : {};
  } catch {
    return {};
  }
}

function writeWorkflowStorage(next: Record<string, PersistedWorkflowEntry>) {
  localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(next));
}

function createStoredNoteSummary(summary: NoteSummary | null): NoteSummary | null {
  if (!summary) {
    return null;
  }

  return {
    resolvedPath: summary.resolvedPath,
    resource: summary.resource
      ? {
          id: summary.resource.id,
          name: summary.resource.name,
          content: summary.resource.content?.slice(0, 280),
        }
      : undefined,
  };
}

function snapshotWorkflowEntry(): PersistedWorkflowEntry | null {
  if (toolMode.value === 'chat') {
    return null;
  }

  return {
    mode: toolMode.value,
    goalDraft: goalDraft.value,
    editableGoal: {
      ...editableGoal.value,
      tags: [...editableGoal.value.tags],
    },
    editableKeyResults: editableKeyResults.value.map((item) => ({ ...item })),
    noteSummary: createStoredNoteSummary(noteSummary.value),
    showGoalDraftEditor: showGoalDraftEditor.value,
  };
}

function persistWorkflowState(conversationId: string) {
  if (!conversationId) {
    return;
  }

  const stored = readWorkflowStorage();
  const snapshot = snapshotWorkflowEntry();

  if (!snapshot) {
    delete stored[conversationId];
  } else {
    stored[conversationId] = snapshot;
  }

  writeWorkflowStorage(stored);
}

function clearWorkflowState(conversationId: string) {
  if (!conversationId) {
    return;
  }

  const stored = readWorkflowStorage();
  if (!(conversationId in stored)) {
    return;
  }

  delete stored[conversationId];
  writeWorkflowStorage(stored);
}

function restoreWorkflowState(conversationId: string) {
  const entry = readWorkflowStorage()[conversationId];
  resetWorkflowArtifacts();

  if (!entry) {
    toolMode.value = 'chat';
    return;
  }

  toolMode.value = entry.mode;
  goalDraft.value = entry.goalDraft;
  editableGoal.value = {
    ...createEmptyGoalDraft(),
    ...entry.editableGoal,
    tags: [...(entry.editableGoal?.tags ?? [])],
  };
  editableKeyResults.value = (entry.editableKeyResults ?? []).map((item) => ({ ...item }));
  noteSummary.value = entry.noteSummary ? createStoredNoteSummary(entry.noteSummary) : null;
  showGoalDraftEditor.value = Boolean(entry.showGoalDraftEditor);
}

function normalizeChatRole(role: unknown): ChatItem['role'] {
  if (role === 'user' || role === 'User') {
    return 'user';
  }

  return 'assistant';
}

function normalizeChatItem(item: Partial<{ id: string; role: string; content: string }>, index: number): ChatItem {
  return {
    id: item.id || `message-${index}`,
    role: normalizeChatRole(item.role),
    content: item.content || '',
  };
}

function resetWorkflowArtifacts() {
  goalDraft.value = null;
  showGoalDraftEditor.value = false;
  editableGoal.value = createEmptyGoalDraft();
  editableKeyResults.value = [];
  noteSummary.value = null;
}

function resetChatSession(mode: WorkflowMode = 'chat') {
  toolMode.value = mode;
  chatConversationId.value = '';
  chatTimeline.value = [];
  chatMessage.value = '';
  conversationTitle.value = getDefaultConversationName(mode);
  resetWorkflowArtifacts();
}

function startNewConversation(mode: WorkflowMode = 'chat') {
  resetChatSession(mode);
  clearLastActiveConversation();
}

function exitToolMode() {
  toolMode.value = 'chat';
  resetWorkflowArtifacts();
  if (!chatConversationId.value && !chatTimeline.value.length) {
    conversationTitle.value = getDefaultConversationName('chat');
  }
}

function openSettings() {
  void router.push('/settings');
}

function selectModel(modelKey: string) {
  selectedModelKey.value = modelKey;
  persistSelectedModel(modelKey, chatConversationId.value || undefined);
}

function adjustComposerHeight() {
  const textarea = composerTextarea.value;
  if (!textarea) {
    return;
  }

  const styles = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
  const verticalPadding =
    Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
  const borderWidth =
    Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);
  const minHeight = lineHeight * 2 + verticalPadding + borderWidth;
  const maxHeight = lineHeight * 5 + verticalPadding + borderWidth;

  textarea.style.height = 'auto';
  const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function handleComposerInput() {
  adjustComposerHeight();
}

function typingPlaceholder(item: ChatItem) {
  return item.role === 'assistant' && chatLoading.value ? '...' : '';
}

function getAIErrorMessage(error: unknown, fallbackKey: string) {
  return translateResultError(error, t, { fallbackKey });
}

async function loadConversationList(options?: { preserveSelection?: boolean }) {
  conversationListLoading.value = true;
  try {
    const result = (await service.listConversations({ page: 1, pageSize: 24 })) as {
      data?: ConversationSummary[];
    };
    conversationList.value = result.data ?? [];

    if (options?.preserveSelection !== false && chatConversationId.value) {
      const currentConversation = conversationList.value.find(
        (item) => item.id === chatConversationId.value,
      );
      if (!currentConversation) {
        startNewConversation();
      }
    }
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.chat.loadFailed'));
  } finally {
    conversationListLoading.value = false;
  }
}

async function selectConversation(item: ConversationSummary) {
  suspendWorkflowPersistence.value = true;
  chatConversationId.value = item.id;
  conversationTitle.value =
    item.name || item.title || t('aiAssistant.dialogs.chat.defaultConversationName');
  updateLastActiveConversation(item.id);
  syncSelectedModel(getPersistedModelKey(item.id));

  try {
    const result = (await service.listMessages(item.id, { page: 1, pageSize: 80 })) as {
      data?: Array<{ id?: string; role?: string; content?: string }>;
    };
    chatTimeline.value = (result.data ?? []).map((message, index) => normalizeChatItem(message, index));
    restoreWorkflowState(item.id);
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.chat.loadFailed'));
  } finally {
    suspendWorkflowPersistence.value = false;
  }
}

async function deleteConversation(id: string) {
  try {
    await service.deleteConversation(id);
    clearWorkflowState(id);
    clearConversationModelSelection(id);
    if (chatConversationId.value === id) {
      startNewConversation();
    }
    if (lastActiveConversationId.value === id) {
      clearLastActiveConversation();
    }
    await loadConversationList();
    toast.success(t('aiAssistant.dialogs.chat.deleted'));
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.chat.deleteFailed'));
  }
}

async function ensureConversationCreated() {
  if (chatConversationId.value) {
    return chatConversationId.value;
  }

  const conversation = (await service.createConversation({
    name: currentConversationLabel.value,
  })) as { id: string };

  chatConversationId.value = conversation.id;
  updateLastActiveConversation(conversation.id);
  persistWorkflowState(conversation.id);
  persistSelectedModel(selectedModelKey.value, conversation.id);
  return conversation.id;
}

async function maybeRenameCurrentConversation(name: string) {
  const nextName = name.trim();
  if (!nextName || nextName === conversationTitle.value) {
    return;
  }

  conversationTitle.value = nextName;
  if (!chatConversationId.value) {
    return;
  }

  try {
    await service.updateConversation(chatConversationId.value, { name: nextName });
    await loadConversationList();
  } catch (error) {
    console.warn('[AIChatView] failed to update conversation title', error);
  }
}

function buildConversationTranscript() {
  return chatTimeline.value
    .filter((item) => item.content.trim().length > 0)
    .map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content.trim()}`)
    .join('\n\n');
}

function buildKnowledgeNoteTitle() {
  const defaultName = getDefaultConversationName(toolMode.value);
  const trimmed = conversationTitle.value.trim();

  if (trimmed && trimmed !== defaultName) {
    return trimmed;
  }

  const latestUserMessage = [...chatTimeline.value]
    .reverse()
    .find((item) => item.role === 'user' && item.content.trim().length > 0);

  if (!latestUserMessage) {
    return '';
  }

  return latestUserMessage.content.trim().slice(0, 80);
}

function buildKnowledgeNoteTopic() {
  const recentMessages = chatTimeline.value
    .filter((item) => item.content.trim().length > 0)
    .slice(-4)
    .map((item) => item.content.trim());
  const combined = recentMessages.join('；').replace(/\s+/g, ' ').trim();

  if (!combined) {
    return t('aiAssistant.chatPage.workflow.noteTopicFallback');
  }

  return combined.slice(0, 200);
}

function applyGoalDraft(nextDraft: GoalDraft) {
  goalDraft.value = nextDraft;
  editableGoal.value = {
    name: nextDraft.goal.name ?? nextDraft.goal.title ?? '',
    description: nextDraft.goal.description,
    category: nextDraft.goal.category,
    importance: nextDraft.goal.importance || ImportanceLevel.Moderate,
    motivation: nextDraft.goal.motivation ?? '',
    feasibilityAnalysis: nextDraft.goal.feasibilityAnalysis ?? '',
    tags: [...(nextDraft.goal.tags ?? [])],
    startDate: nextDraft.goal.suggestedStartDate ?? null,
    targetDate: nextDraft.goal.suggestedEndDate ?? null,
  };
  editableKeyResults.value =
    nextDraft.keyResults?.map((item) => ({
      title: item.title,
      description: item.description ?? '',
      valueType: item.valueType || KeyResultValueType.Incremental,
      calculationMethod:
        item.calculationMethod ||
        (item.valueType === KeyResultValueType.Incremental
          ? KeyResultCalculationMethod.Sum
          : KeyResultCalculationMethod.Last),
      startValue: item.startValue ?? 0,
      currentValue: item.currentValue ?? item.startValue ?? 0,
      targetValue: item.targetValue,
      unit: item.unit,
      weight: item.weight ?? 1,
    })) ?? [];
}

async function generateGoalDraftFromConversation() {
  if (!selectedModel.value || !hasWorkflowUserMessages.value) {
    return;
  }

  goalDraftLoading.value = true;
  try {
    const draft = (await service.generateGoal({
      idea: buildConversationTranscript(),
      includeKeyResults: true,
      providerId: selectedModel.value.providerId,
      model: selectedModel.value.modelId,
    })) as GoalDraft;

    applyGoalDraft(draft);
    showGoalDraftEditor.value = false;
    await maybeRenameCurrentConversation(editableGoal.value.name || conversationTitle.value);
    toast.success(t('aiAssistant.dialogs.generateGoal.draftGenerated'));
    scrollMessagesToBottom();
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.generateGoal.generateFailed'));
  } finally {
    goalDraftLoading.value = false;
  }
}

async function handleCreateGoalFromDraft() {
  if (!goalDraft.value) {
    return;
  }

  creatingGoal.value = true;
  try {
    const created = await createGoal({
      name: editableGoal.value.name,
      description: editableGoal.value.description,
      category: editableGoal.value.category || undefined,
      importance: editableGoal.value.importance,
      motivation: editableGoal.value.motivation || undefined,
      feasibilityAnalysis: editableGoal.value.feasibilityAnalysis || undefined,
      tags: editableGoal.value.tags.length ? editableGoal.value.tags : undefined,
      startDate: editableGoal.value.startDate ?? undefined,
      targetDate: editableGoal.value.targetDate ?? undefined,
    });

    if (!created) {
      toast.error(t('aiAssistant.dialogs.generateGoal.createFailed'));
      return;
    }

    for (const item of editableKeyResults.value) {
      await addKeyResult(created.id, {
        goalId: created.id as never,
        title: item.title,
        description: item.description || undefined,
        valueType: item.valueType,
        calculationMethod: item.calculationMethod,
        startValue: item.startValue,
        targetValue: item.targetValue,
        currentValue: item.currentValue,
        unit: item.unit || undefined,
        weight: item.weight,
      });
    }

    toast.success(t('aiAssistant.dialogs.generateGoal.created'));
    await router.push(`/goals/${created.id}`);
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.generateGoal.createFailed'));
  } finally {
    creatingGoal.value = false;
  }
}

async function createKnowledgeNoteFromConversation() {
  if (!selectedModel.value || !hasWorkflowMessages.value) {
    return;
  }

  noteCreating.value = true;
  try {
    const noteTitle = buildKnowledgeNoteTitle();
    const summary = (await service.createKnowledgeNote({
      topic: buildKnowledgeNoteTopic(),
      ...(noteTitle ? { title: noteTitle } : {}),
      ...(knowledgeNoteSubpath.value ? { targetSubpath: knowledgeNoteSubpath.value } : {}),
      providerId: selectedModel.value.providerId,
      model: selectedModel.value.modelId,
    })) as NoteSummary;

    noteSummary.value = summary;
    await fetchResources();
    await maybeRenameCurrentConversation(
      summary.resource?.name?.replace(/\.md$/i, '') || noteTitle,
    );
    toast.success(t('aiAssistant.dialogs.note.created'));
    scrollMessagesToBottom();
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.note.createFailed'));
  } finally {
    noteCreating.value = false;
  }
}

async function openCreatedNote() {
  const resolvedPath = noteSummary.value?.resolvedPath;
  if (!resolvedPath) {
    return;
  }

  if (!resources.value.length) {
    await fetchResources();
  }

  const target = resources.value.find(
    (item) => item.path === resolvedPath || item.name === noteSummary.value?.resource?.name,
  );

  if (target) {
    await requestOpenResource(target.id);
  }

  await router.push('/repository');
}

function addKeyResultDraft() {
  editableKeyResults.value.push({
    title: '',
    description: '',
    valueType: KeyResultValueType.Incremental,
    calculationMethod: KeyResultCalculationMethod.Sum,
    startValue: 0,
    currentValue: 0,
    targetValue: 1,
    unit: t('aiAssistant.goalDraft.unit'),
    weight: 1,
  });
}

function removeKeyResultDraft(index: number) {
  editableKeyResults.value.splice(index, 1);
}

function updateKeyResultDraft(payload: {
  index: number;
  value: {
    title: string;
    description: string;
    valueType: AddKeyResultReq['valueType'];
    calculationMethod: AddKeyResultReq['calculationMethod'];
    startValue: number;
    currentValue: number;
    targetValue: number;
    unit: string;
    weight: number;
  };
}) {
  editableKeyResults.value.splice(payload.index, 1, payload.value);
}

function toggleGoalDraftEditor() {
  showGoalDraftEditor.value = !showGoalDraftEditor.value;
  nextTick(() => {
    scrollMessagesToBottom();
  });
}

async function handleSendChat() {
  if (!selectedModel.value) {
    return;
  }

  chatLoading.value = true;
  let userDraftId = '';
  let assistantDraftId = '';

  try {
    const pendingUserMessage = chatMessage.value.trim();
    if (!pendingUserMessage) {
      return;
    }
    const conversationId = await ensureConversationCreated();

    userDraftId = `user-draft-${Date.now()}`;
    assistantDraftId = `assistant-draft-${Date.now()}`;
    chatTimeline.value.push(
      { id: userDraftId, role: 'user', content: pendingUserMessage },
      { id: assistantDraftId, role: 'assistant', content: '' },
    );
    chatMessage.value = '';
    await nextTick();
    adjustComposerHeight();

    await service.streamMessage(
      {
        conversationId: conversationId as never,
        content: pendingUserMessage,
        providerId: selectedModel.value.providerId,
        model: selectedModel.value.modelId,
      },
      {
        onChunk: (chunk: { role: 'assistant'; content: string }) => {
          const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
          if (target) {
            target.content += chunk.content;
          }
        },
        onDone: async (result: unknown) => {
          const resolved = (result ?? {}) as StreamDoneResult;
          const assistantIndex = chatTimeline.value.findIndex((item) => item.id === assistantDraftId);
          if (assistantIndex >= 0 && resolved.assistantMessage) {
            chatTimeline.value[assistantIndex] = {
              id: resolved.assistantMessage.id,
              role: 'assistant',
              content: resolved.assistantMessage.content,
            };
          }
          const userIndex = chatTimeline.value.findIndex((item) => item.id === userDraftId);
          if (userIndex >= 0 && resolved.userMessage) {
            chatTimeline.value[userIndex] = {
              id: resolved.userMessage.id,
              role: 'user',
              content: resolved.userMessage.content,
            };
          }
          await loadConversationList();
        },
      },
    );
  } catch (error) {
    chatTimeline.value = chatTimeline.value.filter(
      (item) => item.id !== userDraftId && item.id !== assistantDraftId,
    );
    toast.error(getAIErrorMessage(error, 'aiAssistant.dialogs.chat.sendFailed'));
  } finally {
    chatLoading.value = false;
  }
}

function handleComposerKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) {
    return;
  }

  event.preventDefault();
  if (chatLoading.value || !chatMessage.value.trim() || !canSendMessage.value) {
    return;
  }

  void handleSendChat();
}

function scrollMessagesToBottom() {
  nextTick(() => {
    const viewport = messagesViewport.value;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth',
    });
  });
}

watch(
  () => chatMessage.value,
  () => {
    nextTick(() => {
      adjustComposerHeight();
    });
  },
);

watch(
  () => allModelOptions.value.map((item) => item.key).join('|'),
  () => {
    syncSelectedModel(getPersistedModelKey(chatConversationId.value || undefined));
  },
  { immediate: true },
);

watch(
  () =>
    [
      chatConversationId.value,
      toolMode.value,
      showGoalDraftEditor.value ? '1' : '0',
      JSON.stringify(goalDraft.value),
      JSON.stringify(editableGoal.value),
      JSON.stringify(editableKeyResults.value),
      JSON.stringify(createStoredNoteSummary(noteSummary.value)),
    ].join('|'),
  () => {
    if (!chatConversationId.value || suspendWorkflowPersistence.value) {
      return;
    }

    persistWorkflowState(chatConversationId.value);
  },
);

watch(
  () => chatTimeline.value.map((item) => `${item.id}:${item.content.length}`).join('|'),
  () => {
    scrollMessagesToBottom();
  },
);

onMounted(async () => {
  resetChatSession();
  lastActiveConversationId.value = localStorage.getItem(LAST_CONVERSATION_STORAGE_KEY) || '';

  try {
    void initRepository();
    await loadProviders();
    syncSelectedModel(getPersistedModelKey());
    await loadConversationList({ preserveSelection: false });

    const preferredConversation =
      conversationList.value.find((item) => item.id === lastActiveConversationId.value) ||
      conversationList.value[0] ||
      null;

    if (preferredConversation) {
      await selectConversation(preferredConversation);
    }
  } catch (error) {
    toast.error(getAIErrorMessage(error, 'common.operationFailed'));
  }

  await nextTick();
  adjustComposerHeight();
});
</script>
