import { computed, nextTick, ref } from 'vue';
import type {
  AssistantEvent,
} from '@dailyuse/contracts/ai';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import type {
  AIChatService,
  ChatItem,
  ChatModelOption,
  ConversationMessageSummary,
  ConversationSummary,
} from './types';
import { unwrap } from '@dailyuse/contracts/result';
import { getAIErrorMessage } from './error';

const LAST_CONVERSATION_STORAGE_KEY = 'ai:last-conversation-id';
type DeleteConversationId = Parameters<AIChatService['deleteConversation']>[0];

export interface UseAIChatSessionOptions {
  service: AIChatService;
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
  /** Residual 369: Host open-chat engine profile (Facade routes DirectTurn vs ReadonlyAnalysis). */
  const executionProfileId = ref<'direct_turn' | 'pi_readonly'>('direct_turn');

  function selectExecutionProfile(profile: 'direct_turn' | 'pi_readonly') {
    executionProfileId.value = profile === 'pi_readonly' ? 'pi_readonly' : 'direct_turn';
  }

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
    item: Partial<ConversationMessageSummary>,
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
    const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
    if (candidate.name === 'AbortError' || candidate.code === 'ABORTED') return true;
    if (typeof candidate.message === 'string') {
      const message = candidate.message.toLowerCase();
      return message.includes('abort') || message.includes('cancel');
    }
    return false;
  }

  function abortActiveStream() {
    if (!activeStreamAbortController.value) return;
    activeStreamAbortController.value.abort();
    activeStreamAbortController.value = null;
  }

  function stopGenerating() {
    if (!chatLoading.value) return;
    abortActiveStream();
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
        if (!currentConversation) {
          startNewConversation();
        }
      }
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.chat.loadFailed'));
    } finally {
      conversationListLoading.value = false;
    }
  }

  async function selectConversation(
    item: ConversationSummary,
    loadService: AIChatService,
    syncModel: (key?: string) => void,
    getConversationModelKey: (id?: string) => string,
  ) {
    abortActiveStream();
    chatConversationId.value = item.id;
    conversationTitle.value =
      item.name || t('aiAssistant.dialogs.chat.defaultConversationName');
    updateLastActiveConversation(String(item.id));
    syncModel(getConversationModelKey(String(item.id)));

    try {
      const result = unwrap(await loadService.listMessages(item.id, { page: 1, pageSize: 80 }));
      chatTimeline.value = (result.data ?? []).map((message, index) =>
        normalizeChatItem(message, index),
      );
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
      unwrap(await loadService.deleteConversation(id as DeleteConversationId));
      onClearWorkflow(id);
      onClearModel(id);
      if (chatConversationId.value === id) {
        startNewConversation();
      }
      if (lastActiveConversationId.value === id) {
        clearLastActiveConversation();
      }
      await loadConversationList(loadService);
      toast.success(t('aiAssistant.dialogs.chat.deleted'));
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.chat.deleteFailed'));
    }
  }

  async function ensureConversationCreated(
    loadService: AIChatService,
    conversationName: string,
  ) {
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
  }

  function startNewConversation(mode: string = 'chat') {
    abortActiveStream();
    resetChatSession(mode, options.getDefaultConversationName);
    clearLastActiveConversation();
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

    try {
      const pendingUserMessage = chatMessage.value.trim();
      if (!pendingUserMessage) return;

      chatLoading.value = true;
      const conversationId = await ensureConversationCreated(loadService, conversationName);
      streamController = new AbortController();
      activeStreamAbortController.value = streamController;

      userDraftId = `user-draft-${Date.now()}`;
      assistantDraftId = `assistant-draft-${Date.now()}`;
      chatTimeline.value.push(
        { id: userDraftId, role: 'user', content: pendingUserMessage, status: 'success' },
        { id: assistantDraftId, role: 'assistant', content: '', status: 'generating' },
      );
      chatMessage.value = '';
      await nextTick();
      adjustComposerHeight();

      // Residual 351: open chat default path via AssistantFacade Host dispatch.
      let sawCompleted = false;
      await loadService.dispatchAssistant(
        {
          type: 'message',
          conversationId,
          content: pendingUserMessage,
          surface: 'web',
          // Residual 369: multi-engine Host profile selection for open chat.
          executionProfileId: executionProfileId.value,
          providerId: selectedModel.providerId,
          model: selectedModel.modelId,
        },
        {
          onEvent: (event: AssistantEvent) => {
            if (event.type === 'message.delta') {
              const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
              if (target) {
                target.content += event.content;
                target.status = 'generating';
                target.errorMessage = undefined;
              }
              return;
            }

            if (event.type === 'message.completed') {
              sawCompleted = true;
              const assistantIndex = chatTimeline.value.findIndex(
                (item) => item.id === assistantDraftId,
              );
              if (assistantIndex >= 0) {
                chatTimeline.value[assistantIndex] = {
                  id: event.assistantMessage?.id
                    ? String(event.assistantMessage.id)
                    : assistantDraftId,
                  role: 'assistant',
                  content:
                    event.assistantMessage?.content ??
                    event.content ??
                    chatTimeline.value[assistantIndex]?.content ??
                    '',
                  status: event.status === 'aborted' ? 'aborted' : event.status === 'failed' ? 'error' : 'success',
                  errorMessage: event.error,
                };
              }
              const userIndex = chatTimeline.value.findIndex((item) => item.id === userDraftId);
              if (userIndex >= 0 && event.userMessage) {
                chatTimeline.value[userIndex] = {
                  id: String(event.userMessage.id),
                  role: 'user',
                  content: event.userMessage.content,
                  status: 'success',
                };
              }
              return;
            }

            if (event.type === 'error') {
              const assistantDraft = chatTimeline.value.find((item) => item.id === assistantDraftId);
              if (assistantDraft) {
                assistantDraft.status = 'error';
                assistantDraft.errorMessage = event.message;
              }
            }
          },
        },
        streamController.signal,
      );
      if (sawCompleted) {
        await loadConversationList(loadService);
      }
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
    executionProfileId,
    selectExecutionProfile,
    chatConversationId,
    chatTimeline,
    conversationTitle,
    conversationListLoading,
    conversationList,
    lastActiveConversationId,
    messagesViewport,
    composerTextarea,
    activeStreamAbortController,
    hasWorkflowMessages,
    hasWorkflowUserMessages,
    abortActiveStream,
    stopGenerating,
    updateLastActiveConversation,
    clearLastActiveConversation,
    buildConversationTranscript,
    loadConversationList,
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
