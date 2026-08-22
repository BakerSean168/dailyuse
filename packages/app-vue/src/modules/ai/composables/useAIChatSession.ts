import { computed, nextTick, ref } from 'vue';
import type {
  AIRuntimeUsage,
  AssistantRuntimeEvent,
  AIRuntimeSurface,
} from '@memoflow/contracts/ai';
import type { AssistantRuntimeClient, RuntimeUsageClient } from '@memoflow/ai/client';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import type { AIChatService, ChatItem, ChatModelOption, ConversationSummary } from './types';
import { unwrap } from '@memoflow/contracts/result';
import { getAIErrorMessage } from './error';

const LAST_CONVERSATION_STORAGE_KEY = 'ai:last-conversation-id';
type DeleteConversationId = Parameters<AIChatService['deleteConversation']>[0];

export interface UseAIChatSessionOptions {
  /** Transitional shell/workflow client. Open-chat transcript execution never uses it. */
  service: AIChatService;
  /** Mastra-native authoritative history/stream/cancel client. */
  runtime: AssistantRuntimeClient;
  /** Durable conversation/run usage projection. */
  usageRuntime: RuntimeUsageClient;
  /** Host-provided Assistant surface tag (web / desktop / server). */
  surface: AIRuntimeSurface;
  getDefaultConversationName: (mode: string) => string;
  onConversationCreated?: (id: string) => void;
  restoreWorkflowState?: (id: string) => void;
}

export function useAIChatSession(options: UseAIChatSessionOptions) {
  const { t } = useI18n();

  const chatMessage = ref('');
  const chatLoading = ref(false);
  const chatConversationId = ref('');
  const chatTimeline = ref<ChatItem[]>([]);
  const conversationTitle = ref('');
  const conversationListLoading = ref(false);
  const conversationList = ref<ConversationSummary[]>([]);
  const lastActiveConversationId = ref('');
  const messagesViewport = ref<HTMLElement | null>(null);
  const composerTextarea = ref<HTMLTextAreaElement | null>(null);
  const activeStreamAbortController = ref<AbortController | null>(null);
  const activeRuntimeRunId = ref<string | null>(null);
  const lastRuntimeUsage = ref<AIRuntimeUsage | null>(null);

  const hasWorkflowMessages = computed(() =>
    chatTimeline.value.some((item) => item.content.trim().length > 0),
  );
  const hasWorkflowUserMessages = computed(() =>
    chatTimeline.value.some((item) => item.role === 'user' && item.content.trim().length > 0),
  );

  function normalizeChatRole(role: unknown): ChatItem['role'] {
    if (role === 'user' || role === 'User') return 'user';
    return 'assistant';
  }

  function normalizeChatItem(
    item: { id?: unknown; role?: unknown; content?: unknown },
    index: number,
  ): ChatItem {
    return {
      id: item.id ? String(item.id) : `message-${index}`,
      role: normalizeChatRole(item.role),
      content: typeof item.content === 'string' ? item.content : '',
      status: 'success',
    };
  }

  function isAbortLikeError(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (!error || typeof error !== 'object') return false;
    const candidate = error as { name?: unknown; code?: unknown; category?: unknown };
    return (
      candidate.name === 'AbortError' ||
      candidate.code === 'ABORTED' ||
      candidate.code === 'CANCELED' ||
      candidate.category === 'aborted'
    );
  }

  function abortActiveStream() {
    if (!activeStreamAbortController.value) return;
    activeStreamAbortController.value.abort();
    activeStreamAbortController.value = null;
  }

  function markGeneratingAssistantAborted() {
    for (const item of chatTimeline.value) {
      if (item.role === 'assistant' && item.status === 'generating') {
        item.status = 'aborted';
        item.errorMessage = undefined;
      }
    }
  }

  /** Stop the local stream and best-effort cancel the authenticated Mastra run. */
  function stopGenerating() {
    if (!chatLoading.value) return;
    const runId = activeRuntimeRunId.value;
    abortActiveStream();
    markGeneratingAssistantAborted();
    if (!runId) return;
    void options.runtime.cancelRun(runId).catch(() => {
      // Transport abort is already applied locally; owner-scoped cancel is best effort.
    });
  }

  function updateLastActiveConversation(id: string) {
    lastActiveConversationId.value = id;
    localStorage.setItem(LAST_CONVERSATION_STORAGE_KEY, id);
  }

  function clearLastActiveConversation() {
    lastActiveConversationId.value = '';
    localStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
  }

  function buildConversationTranscript() {
    return chatTimeline.value
      .filter((item) => item.content.trim().length > 0)
      .map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content.trim()}`)
      .join('\n\n');
  }

  async function loadConversationList(
    loadService: AIChatService,
    listOptions?: { preserveSelection?: boolean },
  ) {
    conversationListLoading.value = true;
    try {
      const result = unwrap(await loadService.listConversations({ page: 1, pageSize: 24 }));
      conversationList.value = result.data ?? [];

      if (listOptions?.preserveSelection !== false && chatConversationId.value) {
        const currentConversation = conversationList.value.find(
          (item) => item.id === chatConversationId.value,
        );
        if (!currentConversation) startNewConversation();
      }
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.chat.loadFailed'));
    } finally {
      conversationListLoading.value = false;
    }
  }

  async function refreshRuntimeHistory(conversationId: string): Promise<void> {
    const history = await options.runtime.listMessages(conversationId);
    if (chatConversationId.value !== conversationId) return;
    chatTimeline.value = history.messages.map((message, index) =>
      normalizeChatItem(message, index),
    );
  }

  async function refreshRuntimeUsage(conversationId: string): Promise<void> {
    try {
      const usage = await options.usageRuntime.get({ conversationId });
      if (chatConversationId.value !== conversationId) return;
      lastRuntimeUsage.value = {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        ...(usage.estimatedCost !== undefined ? { estimatedCost: usage.estimatedCost } : {}),
      };
    } catch {
      // Usage is observability-only: failure must never block chat/history recovery.
      if (chatConversationId.value === conversationId) lastRuntimeUsage.value = null;
    }
  }

  async function selectConversation(
    item: ConversationSummary,
    _loadService: AIChatService,
    syncModel: (key?: string) => void,
    getConversationModelKey: (id?: string) => string,
  ) {
    abortActiveStream();
    chatConversationId.value = item.id;
    conversationTitle.value = item.name || t('aiAssistant.dialogs.chat.defaultConversationName');
    updateLastActiveConversation(String(item.id));
    syncModel(getConversationModelKey(String(item.id)));

    try {
      await Promise.all([
        refreshRuntimeHistory(String(item.id)),
        refreshRuntimeUsage(String(item.id)),
      ]);
      options.restoreWorkflowState?.(String(item.id));
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.chat.loadFailed'));
    }
  }

  async function deleteConversation(
    id: string,
    loadService: AIChatService,
    onClearWorkflow: (id: string) => void,
    onClearModel: (id: string) => void,
  ) {
    try {
      // Delete authoritative Mastra memory first. If the legacy shell delete
      // subsequently fails, the still-existing shell/transcript can bootstrap
      // the thread again; the reverse order could leave an invisible orphan.
      await options.runtime.deleteConversation(id);
      unwrap(await loadService.deleteConversation(id as DeleteConversationId));
      onClearWorkflow(id);
      onClearModel(id);
      if (chatConversationId.value === id) startNewConversation();
      if (lastActiveConversationId.value === id) clearLastActiveConversation();
      await loadConversationList(loadService);
      toast.success(t('aiAssistant.dialogs.chat.deleted'));
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.chat.deleteFailed'));
    }
  }

  async function ensureConversationCreated(loadService: AIChatService, conversationName: string) {
    if (chatConversationId.value) return chatConversationId.value;
    const conversation = unwrap(
      await loadService.createConversation({
        name: conversationName,
      }),
    );
    chatConversationId.value = String(conversation.id);
    updateLastActiveConversation(String(conversation.id));
    options.onConversationCreated?.(String(conversation.id));
    return String(conversation.id);
  }

  function resetChatSession(mode: string = 'chat', getDefaultName: (m: string) => string) {
    chatConversationId.value = '';
    chatTimeline.value = [];
    chatMessage.value = '';
    conversationTitle.value = getDefaultName(mode);
    activeRuntimeRunId.value = null;
    lastRuntimeUsage.value = null;
  }

  function startNewConversation(mode: string = 'chat') {
    abortActiveStream();
    resetChatSession(mode, options.getDefaultConversationName);
    clearLastActiveConversation();
  }

  function applyRuntimeEvent(event: AssistantRuntimeEvent, assistantDraftId: string) {
    if (event.type === 'assistant.run.started') {
      activeRuntimeRunId.value = event.runId;
      return;
    }
    if (event.type === 'assistant.message.delta') {
      const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
      if (target) {
        target.content += event.data.content;
        target.status = 'generating';
        target.errorMessage = undefined;
      }
      return;
    }
    if (event.type === 'assistant.usage.updated') {
      lastRuntimeUsage.value = event.data;
      return;
    }
    if (event.type === 'assistant.run.completed') {
      const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
      if (target) {
        target.id = event.data.assistantMessageId || target.id;
        target.content = event.data.content || target.content;
        target.status = 'success';
        target.errorMessage = undefined;
      }
      return;
    }
    if (event.type === 'assistant.run.cancelled') {
      markGeneratingAssistantAborted();
      return;
    }
    if (event.type === 'assistant.run.failed') {
      const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
      if (target) {
        target.status = 'error';
        target.errorMessage = event.data.message;
      }
    }
  }

  async function handleSendChat(
    loadService: AIChatService,
    selectedModel: ChatModelOption | null,
    conversationName: string,
    adjustComposerHeight: () => void,
  ) {
    if (!selectedModel || chatLoading.value) return;

    let userDraftId = '';
    let assistantDraftId = '';
    let streamController: AbortController | null = null;
    let conversationId = '';

    try {
      const pendingUserMessage = chatMessage.value.trim();
      if (!pendingUserMessage) return;

      chatLoading.value = true;
      conversationId = await ensureConversationCreated(loadService, conversationName);
      streamController = new AbortController();
      activeStreamAbortController.value = streamController;
      activeRuntimeRunId.value = null;
      lastRuntimeUsage.value = null;

      userDraftId = `user-draft-${Date.now()}`;
      assistantDraftId = `assistant-draft-${Date.now()}`;
      chatTimeline.value.push(
        { id: userDraftId, role: 'user', content: pendingUserMessage, status: 'success' },
        { id: assistantDraftId, role: 'assistant', content: '', status: 'generating' },
      );
      chatMessage.value = '';
      await nextTick();
      adjustComposerHeight();

      await options.runtime.streamMessage(
        {
          type: 'message',
          conversationId,
          content: pendingUserMessage,
          surface: options.surface,
          providerId: selectedModel.providerId,
          modelId: selectedModel.modelId,
        },
        {
          onEvent: (event) => applyRuntimeEvent(event, assistantDraftId),
        },
        streamController.signal,
      );

      // Mastra memory is the authority after cutover. Refresh from persisted
      // history instead of accepting draft ids/content as durable truth.
      await Promise.all([
        refreshRuntimeHistory(conversationId),
        refreshRuntimeUsage(conversationId),
      ]);
    } catch (error) {
      const assistantDraft = chatTimeline.value.find((item) => item.id === assistantDraftId);
      const userDraft = chatTimeline.value.find((item) => item.id === userDraftId);
      if (isAbortLikeError(error)) {
        if (assistantDraft) {
          assistantDraft.status = 'aborted';
          assistantDraft.errorMessage = undefined;
        }
        if (userDraft) userDraft.status = 'success';
      } else {
        const errorMessage = getAIErrorMessage(error, t, 'aiAssistant.dialogs.chat.sendFailed');
        if (assistantDraft) {
          assistantDraft.status = 'error';
          assistantDraft.errorMessage = errorMessage;
        }
        if (userDraft) userDraft.status = 'success';
        toast.error(errorMessage);
      }
    } finally {
      if (activeStreamAbortController.value === streamController) {
        activeStreamAbortController.value = null;
      }
      activeRuntimeRunId.value = null;
      chatLoading.value = false;
    }
  }

  function scrollMessagesToBottom() {
    nextTick(() => {
      const viewport = messagesViewport.value;
      if (!viewport) return;
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    });
  }

  return {
    chatMessage,
    chatLoading,
    chatConversationId,
    chatTimeline,
    conversationTitle,
    conversationListLoading,
    conversationList,
    lastActiveConversationId,
    messagesViewport,
    composerTextarea,
    activeStreamAbortController,
    activeRuntimeRunId,
    lastRuntimeUsage,
    hasWorkflowMessages,
    hasWorkflowUserMessages,
    abortActiveStream,
    stopGenerating,
    updateLastActiveConversation,
    clearLastActiveConversation,
    buildConversationTranscript,
    loadConversationList,
    refreshRuntimeUsage,
    selectConversation,
    deleteConversation,
    ensureConversationCreated,
    resetChatSession,
    startNewConversation,
    handleSendChat,
    scrollMessagesToBottom,
    normalizeChatItem,
  };
}
