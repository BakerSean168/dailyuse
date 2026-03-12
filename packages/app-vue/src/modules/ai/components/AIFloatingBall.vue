<template>
  <div
    v-if="aiEnabled && showFloatingBall"
    class="fixed bottom-6 right-6 z-[11000] flex flex-col items-end gap-3"
  >
    <div
      v-if="open"
      class="w-[24rem] rounded-[1.5rem] border border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <Bot class="h-5 w-5" />
            </div>
            <div>
              <h3 class="text-sm font-semibold">AI Assistant</h3>
              <p class="text-xs text-muted-foreground">Goal, chat and knowledge note tools.</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="open = false">
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div class="mb-4 grid gap-2 sm:grid-cols-2">
        <div class="rounded-2xl border border-border/60 bg-muted/30 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
          <p class="mt-1 text-sm font-medium">{{ activeProviderName }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ providerSummaryText }}</p>
        </div>
        <div class="rounded-2xl border border-border/60 bg-muted/30 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Notes Path</p>
          <p class="mt-1 text-sm font-medium">{{ resolvedNotePath }}</p>
          <p class="mt-1 text-xs text-muted-foreground">New AI notes are saved here by default.</p>
        </div>
      </div>

      <div
        v-if="!hasProviders"
        class="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50/80 p-3 text-sm text-amber-900"
      >
        Configure an OpenAI-compatible provider in Settings before using AI actions.
      </div>

      <div class="space-y-2">
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          @click="openGoalDialog = true"
        >
          <Sparkles class="mr-2 h-4 w-4" />
          Generate Goal
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          @click="handleOpenChatDialog"
        >
          <MessageCircle class="mr-2 h-4 w-4" />
          AI Chat
        </Button>
        <Button
          class="w-full justify-start rounded-xl"
          variant="outline"
          @click="openNoteDialog = true"
        >
          <NotebookPen class="mr-2 h-4 w-4" />
          Create Knowledge Note
        </Button>
      </div>
    </div>

    <Button class="h-14 w-14 rounded-full shadow-xl" size="icon" @click="togglePanel">
      <Bot class="h-6 w-6" />
    </Button>

    <Dialog :open="openGoalDialog" @update:open="openGoalDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate Goal</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div class="space-y-3">
            <Textarea
              v-model="goalIdea"
              class="min-h-44"
              placeholder="Describe the outcome you want to achieve, the context, and what success looks like..."
            />
            <Button
              class="w-full"
              :disabled="goalLoading || goalIdea.trim().length < 10 || !hasProviders"
              @click="handleGenerateGoal"
            >
              {{ goalLoading ? 'Generating...' : 'Generate Goal Draft' }}
            </Button>
          </div>

          <AIGoalDraftEditor
            :goal="editableGoal"
            :key-results="editableKeyResults"
            :is-submitting="creatingGoal"
            @confirm="handleCreateGoalFromDraft"
            @add-key-result="addKeyResult"
            @remove-key-result="removeKeyResult"
            @update-goal="editableGoal = $event"
          />
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openChatDialog" @update:open="openChatDialog = $event">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Chat</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div class="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Recent Conversations
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  :disabled="conversationListLoading"
                  @click="loadConversations"
                >
                  Refresh
                </Button>
              </div>
              <div class="max-h-40 space-y-2 overflow-y-auto">
                <button
                  v-for="item in conversationList"
                  :key="item.id"
                  class="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-left text-sm hover:bg-muted/40"
                  @click="selectConversation(item)"
                >
                  <div class="flex items-center justify-between gap-2">
                    <Input
                      :model-value="
                        conversationDraftNames[item.id] ?? item.name ?? item.title ?? ''
                      "
                      class="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                      @click.stop
                      @update:model-value="updateConversationDraft(item.id, String($event))"
                      @blur="renameConversation(item)"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-7 px-2"
                      @click.stop="deleteConversation(item.id)"
                    >
                      Delete
                    </Button>
                  </div>
                </button>
                <p
                  v-if="!conversationList.length && !conversationListLoading"
                  class="text-sm text-muted-foreground"
                >
                  No saved conversations yet.
                </p>
              </div>
            </div>

            <Input v-model="conversationName" placeholder="Conversation name" />
            <Textarea
              v-model="chatMessage"
              class="min-h-36"
              placeholder="Ask a question, brainstorm, or request a quick draft..."
            />
            <Button
              class="w-full"
              :disabled="chatLoading || !chatMessage.trim() || !hasProviders"
              @click="handleSendChat"
            >
              {{ chatLoading ? 'Sending...' : 'Send Message' }}
            </Button>
            <Button
              v-if="chatConversationId"
              variant="outline"
              class="w-full"
              @click="resetChatSession"
            >
              New Conversation
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="chatTimeline.length" class="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              <div
                v-for="item in chatTimeline"
                :key="item.id"
                :class="[
                  'rounded-2xl p-3 text-sm',
                  item.role === 'user'
                    ? 'ml-10 bg-primary text-primary-foreground'
                    : 'mr-10 border border-border/60 bg-muted/25',
                ]"
              >
                <p class="mb-1 text-[11px] uppercase tracking-[0.18em] opacity-70">
                  {{ item.role === 'user' ? 'You' : 'Assistant' }}
                </p>
                <p class="whitespace-pre-wrap leading-6">{{ item.content }}</p>
              </div>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              Start a conversation and your chat timeline will appear here.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog :open="openNoteDialog" @update:open="openNoteDialog = $event">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Knowledge Note</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="space-y-3">
            <Input v-model="noteTitle" placeholder="Optional title" />
            <Textarea
              v-model="noteTopic"
              class="min-h-44"
              placeholder="Describe the topic, source context, or what should be included in the note..."
            />
            <div
              class="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground"
            >
              Save path: <span class="font-medium text-foreground">{{ resolvedNotePath }}</span>
            </div>
            <Button
              class="w-full"
              :disabled="noteLoading || noteTopic.trim().length < 3 || !hasProviders"
              @click="handleCreateNote"
            >
              {{ noteLoading ? 'Creating...' : 'Create Knowledge Note' }}
            </Button>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div v-if="noteSummary" class="space-y-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saved To</p>
                <p class="mt-1 text-sm font-medium">{{ noteSummary.resolvedPath }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resource</p>
                <p class="mt-1 text-sm font-medium">
                  {{ noteSummary.resource?.name || 'New note created' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {{ notePreview }}
                </p>
              </div>
              <Button class="w-full" variant="outline" @click="openCreatedNote">
                Open Note in Repository
              </Button>
            </div>

            <div
              v-else
              class="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
            >
              AI will save the generated markdown note to your configured notes path and show a
              quick summary here.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bot, MessageCircle, NotebookPen, Sparkles, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@dailyuse/ui-vue-shadcn';
import { useAI } from '../composables/useAI';
import { useUserSetting } from '../../setting/composables/useUserSetting';
import { useGoal } from '../../goal/composables/useGoal';
import { useRepository } from '../../repository/composables/useRepository';
import { GOAL_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import AIGoalDraftEditor from './AIGoalDraftEditor.vue';

type GoalDraft = {
  goal: {
    name?: string;
    title?: string;
    description: string;
    category: string;
    importance: string;
  };
  keyResults?: Array<{
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
  }>;
};

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type NoteSummary = {
  resolvedPath: string;
  resource?: { id?: string; name?: string; content?: string };
};

type ConversationSummary = {
  id: string;
  name?: string;
  title?: string;
};

const { service, providers, hasProviders, loadProviders } = useAI();
const { getCategory } = useUserSetting();
const { createGoal } = useGoal();
const { resources, openResource, fetchResources, initRepository } = useRepository();
const goalService = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');
const router = useRouter();

const open = ref(false);
const openGoalDialog = ref(false);
const openChatDialog = ref(false);
const openNoteDialog = ref(false);

const goalIdea = ref('');
const goalLoading = ref(false);
const goalDraft = ref<GoalDraft | null>(null);
const creatingGoal = ref(false);
const editableGoal = ref({
  name: '',
  description: '',
  category: '',
  importance: ImportanceLevel.Moderate,
});
const editableKeyResults = ref<
  Array<{ title: string; description: string; targetValue: number; unit: string }>
>([]);

const conversationName = ref('Quick Chat');
const chatMessage = ref('');
const chatLoading = ref(false);
const chatConversationId = ref('');
const chatTimeline = ref<ChatItem[]>([]);
const conversationListLoading = ref(false);
const conversationList = ref<ConversationSummary[]>([]);
const lastActiveConversationId = ref('');
const conversationDraftNames = ref<Record<string, string>>({});

const noteTitle = ref('');
const noteTopic = ref('');
const noteLoading = ref(false);
const noteSummary = ref<NoteSummary | null>(null);

const aiSettings = computed(() => getCategory('ai'));
const aiEnabled = computed(() => aiSettings.value?.enabled ?? true);
const showFloatingBall = computed(() => aiSettings.value?.showFloatingBall ?? true);
const knowledgeNoteSubpath = computed(() => aiSettings.value?.knowledgeNoteSubpath ?? '');
const resolvedNotePath = computed(() =>
  knowledgeNoteSubpath.value ? `notes/${knowledgeNoteSubpath.value}/` : 'notes/',
);

const activeProvider = computed(() => {
  return (
    (providers.value as Array<{ name?: string; isDefault?: boolean }>).find(
      (item) => item.isDefault,
    ) ||
    (providers.value as Array<{ name?: string }>)[0] ||
    null
  );
});
const activeProviderName = computed(() => activeProvider.value?.name || 'Not configured');
const providerSummaryText = computed(() => {
  if (!providers.value.length) return 'No provider configured';
  return `${providers.value.length} provider${providers.value.length > 1 ? 's' : ''} available`;
});
const notePreview = computed(() => {
  const content = noteSummary.value?.resource?.content;
  if (!content) return 'The note was created successfully.';
  return content.slice(0, 280);
});

onMounted(() => {
  void loadProviders();
  void initRepository();
  lastActiveConversationId.value = localStorage.getItem('ai:last-conversation-id') || '';
});

function togglePanel() {
  if (!open.value) {
    void loadProviders();
  }
  open.value = !open.value;
}

async function loadConversations() {
  conversationListLoading.value = true;
  try {
    const result = (await service.listConversations({ page: 1, pageSize: 12 })) as {
      data?: ConversationSummary[];
    };
    conversationList.value = result.data ?? [];
    conversationDraftNames.value = Object.fromEntries(
      conversationList.value.map((item) => [item.id, item.name || item.title || '']),
    );
  } finally {
    conversationListLoading.value = false;
  }
}

async function handleOpenChatDialog() {
  openChatDialog.value = true;
  await loadConversations();
  if (lastActiveConversationId.value) {
    const existing = conversationList.value.find(
      (item) => item.id === lastActiveConversationId.value,
    );
    if (existing) {
      await selectConversation(existing);
    }
  }
}

async function handleGenerateGoal() {
  goalLoading.value = true;
  try {
    goalDraft.value = (await service.generateGoal({
      idea: goalIdea.value,
      includeKeyResults: true,
    })) as GoalDraft;
    editableGoal.value = {
      name: goalDraft.value.goal.name ?? goalDraft.value.goal.title ?? '',
      description: goalDraft.value.goal.description,
      category: goalDraft.value.goal.category,
      importance: goalDraft.value.goal.importance as typeof editableGoal.value.importance,
    };
    editableKeyResults.value =
      goalDraft.value.keyResults?.map((item) => ({
        title: item.title,
        description: item.description ?? '',
        targetValue: item.targetValue,
        unit: item.unit,
      })) ?? [];
    toast.success('Goal draft generated');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to generate goal');
  } finally {
    goalLoading.value = false;
  }
}

async function handleCreateGoalFromDraft() {
  if (!goalDraft.value) return;

  creatingGoal.value = true;
  try {
    const created = await createGoal({
      name: editableGoal.value.name,
      description: editableGoal.value.description,
      category: editableGoal.value.category || undefined,
      importance: editableGoal.value.importance,
      motivation: goalDraft.value.goal.description,
    });

    if (!created) {
      toast.error('Failed to create goal');
      return;
    }

    if (editableKeyResults.value.length) {
      for (const item of editableKeyResults.value) {
        await goalService.createKeyResult(created.id, { ...({} as any),
          title: item.title,
          description: item.description || undefined,
          targetValue: item.targetValue,
          unit: item.unit,
        });
      }
    }

    toast.success('Goal created');
    openGoalDialog.value = false;
    await router.push(`/goals/${created.id}`);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create goal');
  } finally {
    creatingGoal.value = false;
  }
}

async function handleSendChat() {
  chatLoading.value = true;
  try {
    if (!chatConversationId.value) {
      const conversation = (await service.createConversation({
        name: conversationName.value.trim() || 'Quick Chat',
      })) as { id: string };
      chatConversationId.value = conversation.id;
      lastActiveConversationId.value = conversation.id;
      localStorage.setItem('ai:last-conversation-id', conversation.id);
    }

    const response = (await service.sendMessage({
      conversationId: chatConversationId.value as never,
      content: chatMessage.value,
    })) as {
      userMessage: { id: string; content: string };
      assistantMessage: { id: string; content: string };
    };

    chatTimeline.value.push(
      { id: response.userMessage.id, role: 'user', content: response.userMessage.content },
      {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
      },
    );
    chatMessage.value = '';
    await loadConversations();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to send message');
  } finally {
    chatLoading.value = false;
  }
}

function resetChatSession() {
  chatConversationId.value = '';
  chatTimeline.value = [];
  chatMessage.value = '';
}

async function selectConversation(item: ConversationSummary) {
  chatConversationId.value = item.id;
  lastActiveConversationId.value = item.id;
  localStorage.setItem('ai:last-conversation-id', item.id);
  conversationName.value = item.name || item.title || 'Quick Chat';
  try {
    const result = (await service.listMessages(item.id, { page: 1, pageSize: 50 })) as {
      data?: ChatItem[];
    };
    chatTimeline.value = result.data ?? [];
    openChatDialog.value = true;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load conversation');
  }
}

async function deleteConversation(id: string) {
  try {
    await service.deleteConversation(id);
    if (chatConversationId.value === id) {
      resetChatSession();
    }
    if (lastActiveConversationId.value === id) {
      lastActiveConversationId.value = '';
      localStorage.removeItem('ai:last-conversation-id');
    }
    await loadConversations();
    toast.success('Conversation deleted');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to delete conversation');
  }
}

function updateConversationDraft(id: string, value: string) {
  conversationDraftNames.value[id] = value;
}

async function renameConversation(item: ConversationSummary) {
  const nextName = (conversationDraftNames.value[item.id] || '').trim();
  const currentName = item.name || item.title || '';
  if (!nextName || nextName === currentName) return;

  try {
    const updated = (await (service as any).updateConversation(item.id, { name: nextName })) as {
      id: string;
      name: string;
    };
    const target = conversationList.value.find((entry) => entry.id === updated.id);
    if (target) {
      target.name = updated.name;
      target.title = updated.name;
    }
    if (chatConversationId.value === updated.id) {
      conversationName.value = updated.name;
    }
  } catch (error) {
    conversationDraftNames.value[item.id] = currentName;
    toast.error(error instanceof Error ? error.message : 'Failed to rename conversation');
  }
}

async function handleCreateNote() {
  noteLoading.value = true;
  try {
    noteSummary.value = (await service.createKnowledgeNote({
      topic: noteTopic.value,
      ...(noteTitle.value.trim() ? { title: noteTitle.value.trim() } : {}),
      ...(knowledgeNoteSubpath.value ? { targetSubpath: knowledgeNoteSubpath.value } : {}),
    })) as NoteSummary;
    await fetchResources();
    toast.success('Knowledge note created');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create note');
  } finally {
    noteLoading.value = false;
  }
}

function openCreatedNote() {
  const resolvedPath = noteSummary.value?.resolvedPath;
  if (!resolvedPath) return;

  const target = resources.value.find(
    (item) => item.path === resolvedPath || item.name === noteSummary.value?.resource?.name,
  );

  if (target) {
    openResource(target);
    open.value = false;
    openNoteDialog.value = false;
  }

  void router.push('/repository');
}

function addKeyResult() {
  editableKeyResults.value.push({
    title: '',
    description: '',
    targetValue: 1,
    unit: 'unit',
  });
}

function removeKeyResult(index: number) {
  editableKeyResults.value.splice(index, 1);
}
</script>
