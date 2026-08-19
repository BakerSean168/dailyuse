import { computed, nextTick, ref } from 'vue';
import type { AssistantEvent, AssistantSurface } from '@memoflow/contracts/ai';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import type {
  AIChatService,
  ChatItem,
  ChatModelOption,
  ConversationMessageSummary,
  ConversationSummary,
} from './types';
import { unwrap } from '@memoflow/contracts/result';
import { getAIErrorMessage } from './error';
import { useAssistantDispatch } from './useAssistantDispatch';
import {
  buildHostOpenChatStopCancelCommand,
  createHostOpenChatRunId,
  isHostOpenChatCancelledEvent,
} from './hostOpenChatCancel';
import type { HostOpenChatTurnSnapshot } from './hostProposalLifecycle';
import type { OpenChatHostTurnMemory } from './hostOpenChatTurnMemory';
import {
  forgetOpenChatHostTurnsForConversation,
  rememberOpenChatHostTurnsForConversation,
  restoreOpenChatHostTurnsForConversation,
  upsertOpenChatHostTurnList,
} from './hostOpenChatTurnMemory';

const LAST_CONVERSATION_STORAGE_KEY = 'ai:last-conversation-id';
type DeleteConversationId = Parameters<AIChatService['deleteConversation']>[0];

export interface UseAIChatSessionOptions {
  service: AIChatService;
  /** Host-provided Assistant surface tag (web / desktop / server). */
  surface: AssistantSurface;
  getDefaultConversationName: (mode: string) => string;
  onConversationCreated?: (id: string) => void;
  restoreWorkflowState?: (id: string) => void;
}

export function useAIChatSession(options: UseAIChatSessionOptions) {
  const { t } = useI18n();

  // Residual 349/351: open chat sends exclusively through the thin entry, never
  // through streamMessage / sendMessage. surface is host-provided (DI), never
  // guessed from window.
  const assistantDispatch = useAssistantDispatch({ service: options.service });

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
  /** Residual 393: client-owned Host run id for open-chat cancel_run on stop. */
  const activeHostRunId = ref<string | null>(null);
  /** Residual 401: recent open-chat Host turns for timeline multi-engine badges. */
  const openChatHostTurns = ref<HostOpenChatTurnSnapshot[]>([]);
  /** Residual 403: per-conversation session memory for open-chat Host turn badges. */
  let openChatHostTurnMemory: OpenChatHostTurnMemory = {};
  /** Residual 369: Host open-chat engine profile (Facade routes DirectTurn vs ReadonlyAnalysis). */
  const executionProfileId = ref<'direct_turn' | 'pi_readonly'>('direct_turn');

  function selectExecutionProfile(profile: 'direct_turn' | 'pi_readonly') {
    executionProfileId.value = profile === 'pi_readonly' ? 'pi_readonly' : 'direct_turn';
  }

  /** Residual 401/403: keep a short ring of open-chat Host turns + remember by conversation. */
  function upsertOpenChatHostTurn(next: HostOpenChatTurnSnapshot) {
    openChatHostTurns.value = upsertOpenChatHostTurnList(openChatHostTurns.value, next);
    if (chatConversationId.value) {
      openChatHostTurnMemory = rememberOpenChatHostTurnsForConversation(
        openChatHostTurnMemory,
        chatConversationId.value,
        openChatHostTurns.value,
      );
    }
  }

  /** Residual 403: stash current conversation turns before switching away. */
  function stashOpenChatHostTurnsForCurrentConversation() {
    if (!chatConversationId.value) return;
    openChatHostTurnMemory = rememberOpenChatHostTurnsForConversation(
      openChatHostTurnMemory,
      chatConversationId.value,
      openChatHostTurns.value,
    );
  }

  /** Residual 403: restore remembered turns for a conversation (empty when unknown). */
  function restoreOpenChatHostTurns(conversationId: string) {
    openChatHostTurns.value = restoreOpenChatHostTurnsForConversation(
      openChatHostTurnMemory,
      conversationId,
    );
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

  function normalizeChatItem(item: Partial<ConversationMessageSummary>, index: number): ChatItem {
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

  /**
   * Residual 393: stop open chat — abort client stream AND Host cancel_run so
   * DirectTurn/ReadonlyAnalysis engines abort (client abort alone is insufficient).
   */
  function stopGenerating() {
    if (!chatLoading.value) return;
    const cancelCommand = buildHostOpenChatStopCancelCommand(activeHostRunId.value);
    abortActiveStream();
    if (!cancelCommand) return;
    void options.service
      .dispatchAssistant(cancelCommand, {
        onEvent: (event: AssistantEvent) => {
          if (!isHostOpenChatCancelledEvent(event)) return;
          for (const item of chatTimeline.value) {
            if (item.status === 'generating') {
              item.status = 'aborted';
              item.errorMessage = undefined;
            }
          }
        },
      })
      .catch(() => {
        // Best-effort Host cancel; local abort already applied.
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
    // Residual 403: keep open-chat multi-engine badges across conversation switches.
    stashOpenChatHostTurnsForCurrentConversation();
    chatConversationId.value = item.id;
    conversationTitle.value = item.name || t('aiAssistant.dialogs.chat.defaultConversationName');
    updateLastActiveConversation(String(item.id));
    syncModel(getConversationModelKey(String(item.id)));
    restoreOpenChatHostTurns(String(item.id));

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
      // Residual 403: drop session open-chat turn memory for deleted conversation.
      openChatHostTurnMemory = forgetOpenChatHostTurnsForConversation(openChatHostTurnMemory, id);
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
    // Residual 403: stash current conversation badges before leaving the thread.
    stashOpenChatHostTurnsForCurrentConversation();
    chatConversationId.value = '';
    chatTimeline.value = [];
    chatMessage.value = '';
    conversationTitle.value = getDefaultName(mode);
    openChatHostTurns.value = [];
    activeHostRunId.value = null;
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
      // Residual 393: client-owned runId so stop can cancel_run before/without run.started.
      const hostRunId = createHostOpenChatRunId();
      activeHostRunId.value = hostRunId;
      const profileForTurn =
        executionProfileId.value === 'pi_readonly' ? 'pi_readonly' : 'direct_turn';
      upsertOpenChatHostTurn({
        runId: hostRunId,
        executionProfileId: profileForTurn,
        status: 'generating',
        title: pendingUserMessage,
        summary: '',
      });

      userDraftId = `user-draft-${Date.now()}`;
      assistantDraftId = `assistant-draft-${Date.now()}`;
      chatTimeline.value.push(
        { id: userDraftId, role: 'user', content: pendingUserMessage, status: 'success' },
        { id: assistantDraftId, role: 'assistant', content: '', status: 'generating' },
      );
      chatMessage.value = '';
      await nextTick();
      adjustComposerHeight();

      // Residual 351: open chat default path via AssistantFacade Host dispatch,
      // routed through the thin entry (residual 349). Never streamMessage.
      let sawCompleted = false;
      await assistantDispatch.dispatchMessage({
        conversationId,
        content: pendingUserMessage,
        surface: options.surface,
        runId: hostRunId,
        // Residual 369: multi-engine Host profile selection for open chat.
        executionProfileId: executionProfileId.value,
        providerId: selectedModel.providerId,
        model: selectedModel.modelId,
        signal: streamController.signal,
        onEvent: (event: AssistantEvent) => {
          if (event.type === 'run.started' && event.runId) {
            activeHostRunId.value = event.runId;
            const existing = openChatHostTurns.value.find((turn) => turn.runId === hostRunId);
            upsertOpenChatHostTurn({
              runId: event.runId,
              executionProfileId:
                event.profile === 'pi_readonly'
                  ? 'pi_readonly'
                  : (existing?.executionProfileId ?? profileForTurn),
              status: 'generating',
              title: existing?.title ?? pendingUserMessage,
              summary: existing?.summary ?? '',
              engineId: event.engineId,
            });
            // If server rewrote runId, drop the pre-start client id row.
            if (event.runId !== hostRunId) {
              openChatHostTurns.value = openChatHostTurns.value.filter(
                (turn) => turn.runId !== hostRunId,
              );
            }
          }
          if (isHostOpenChatCancelledEvent(event)) {
            const target = chatTimeline.value.find((item) => item.id === assistantDraftId);
            if (target && target.status === 'generating') {
              target.status = 'aborted';
              target.errorMessage = undefined;
            }
            const runKey = activeHostRunId.value ?? hostRunId;
            const existing = openChatHostTurns.value.find((turn) => turn.runId === runKey);
            if (existing) {
              upsertOpenChatHostTurn({ ...existing, status: 'aborted' });
            }
          }
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
            const completedRunId = event.runId || activeHostRunId.value || hostRunId;
            const existingTurn = openChatHostTurns.value.find(
              (turn) => turn.runId === completedRunId || turn.runId === hostRunId,
            );
            if (existingTurn || completedRunId) {
              const nextStatus =
                event.status === 'aborted'
                  ? 'aborted'
                  : event.status === 'failed'
                    ? 'failed'
                    : 'completed';
              upsertOpenChatHostTurn({
                runId: completedRunId,
                executionProfileId: existingTurn?.executionProfileId ?? profileForTurn,
                status: nextStatus,
                title: existingTurn?.title ?? pendingUserMessage,
                summary: (event.content ?? '').trim().slice(0, 240) || existingTurn?.summary || '',
                engineId: existingTurn?.engineId,
              });
            }
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
                status:
                  event.status === 'aborted'
                    ? 'aborted'
                    : event.status === 'failed'
                      ? 'error'
                      : 'success',
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
      });
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
      // Residual 393: clear Host run tracking after open-chat turn ends.
      activeHostRunId.value = null;
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
    openChatHostTurns,
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
