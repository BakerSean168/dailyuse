import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { useAI } from './useAI';
import { useGoal } from '../../goal/composables/useGoal';
import { useRepository } from '../../repository/composables/useRepository';
import { useUserSetting } from '../../setting/composables/useUserSetting';
import { useEditorWorkspaceActions } from '../../editor/composables';
import { useAIChatSession } from './useAIChatSession';
import { useAIModelSelection } from './useAIModelSelection';
import { useAIGoalWorkflow } from './useAIGoalWorkflow';
import { useAIKnowledgeNoteWorkflow } from './useAIKnowledgeNoteWorkflow';
import { useAIWorkflowPersistence } from './useAIWorkflowPersistence';
import { useAIFormatters } from './useAIFormatters';
import { getToolLocaleKey } from './types';
import { adjustComposerHeight as createAdjustComposerHeight, bindChatViewLifecycle, getWorkflowStatusText, initializeChatView, maybeRenameConversation } from './chatViewHelpers';
import type { ConversationSummary, ProviderListItem, WorkflowMode } from './types';

export interface UseAIChatViewOptions {
  getComposerTextarea: () => HTMLTextAreaElement | null;
}

export function useAIChatView(options: UseAIChatViewOptions) {
  const { t } = useI18n();
  const router = useRouter();
  const { service, providers, loadProviders } = useAI();
  const { createGoal, addKeyResult } = useGoal();
  const { getCategory } = useUserSetting();
  const { initRepository, fetchResources, resources } = useRepository();
  const { requestOpenResource } = useEditorWorkspaceActions();
  const formatters = useAIFormatters();

  // ─── Helpers ───────────────────────────────────────────────────────

  function getDefaultConversationName(mode: WorkflowMode | string): string {
    if (mode === 'goal') return t('aiAssistant.chatPage.workflow.defaultConversationNames.goal');
    if (mode === 'knowledge-note')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeNote');
    return t('aiAssistant.dialogs.chat.defaultConversationName');
  }

  const toolMode = ref<WorkflowMode>('chat');
  const adjustComposerHeight = () => createAdjustComposerHeight(options.getComposerTextarea);

  // ─── Composables ───────────────────────────────────────────────────

  const providerList = computed(() =>
    Array.isArray(providers.value) ? (providers.value as ProviderListItem[]) : [],
  );

  const aiSettings = computed(() => getCategory('ai'));
  const knowledgeNoteSubpath = computed(() => aiSettings.value?.knowledgeNoteSubpath ?? '');

  // Late-binding closures for cross-composable coordination.
  // eslint-disable-next-line prefer-const -- reassigned after options object is constructed
  let _restoreWorkflowState: ((id: string) => void) | undefined;
  // eslint-disable-next-line prefer-const -- reassigned after options object is constructed
  let _persistWorkflowAndModel: ((id: string) => void) | undefined;

  // 1. Chat session
  const chatSession = useAIChatSession({
    service,
    getDefaultConversationName,
    restoreWorkflowState: (id) => _restoreWorkflowState?.(id),
    onConversationCreated: (id) => _persistWorkflowAndModel?.(id),
  });

  // 2. Model selection
  const modelSelection = useAIModelSelection({
    providers: providerList,
    chatConversationId: chatSession.chatConversationId,
  });

  // 3. Goal workflow
  const goalWorkflow = useAIGoalWorkflow({
    service,
    selectedModel: modelSelection.selectedModel,
    chatLoading: chatSession.chatLoading,
    chatTimeline: chatSession.chatTimeline,
    conversationTitle: chatSession.conversationTitle,
    hasWorkflowUserMessages: chatSession.hasWorkflowUserMessages,
    buildConversationTranscript: chatSession.buildConversationTranscript,
    scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
    maybeRenameCurrentConversation,
    createGoal,
    addKeyResult,
  });

  // 4. Note workflow
  const noteWorkflow = useAIKnowledgeNoteWorkflow({
    service,
    selectedModel: modelSelection.selectedModel,
    chatTimeline: chatSession.chatTimeline,
    conversationTitle: chatSession.conversationTitle,
    hasWorkflowMessages: chatSession.hasWorkflowMessages,
    knowledgeNoteSubpath,
    scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
    maybeRenameCurrentConversation,
    fetchResources,
    resources,
    requestOpenResource,
  });

  // 5. Persistence
  function resetWorkflowArtifacts() {
    goalWorkflow.resetGoalArtifacts();
    noteWorkflow.resetNoteArtifacts();
  }

  const persistence = useAIWorkflowPersistence({
    toolMode,
    goalWorkflowStage: goalWorkflow.goalWorkflowStage,
    goalDraft: goalWorkflow.goalDraft,
    goalClarification: goalWorkflow.goalClarification,
    goalAutomationResult: goalWorkflow.goalAutomationResult,
    clarificationAnswers: goalWorkflow.clarificationAnswers,
    editableGoal: goalWorkflow.editableGoal,
    editableKeyResults: goalWorkflow.editableKeyResults,
    noteSummary: noteWorkflow.noteSummary,
    showGoalDraftEditor: goalWorkflow.showGoalDraftEditor,
    resetWorkflowArtifacts,
  });

  // Wire late-binding callbacks
  _restoreWorkflowState = persistence.restoreWorkflowState;
  _persistWorkflowAndModel = (id) => {
    persistence.persistWorkflowState(id);
    modelSelection.persistSelectedModel(modelSelection.selectedModelKey.value, id);
  };

  // Wire persistence watcher
  persistence.bindPersistenceWatcher(chatSession.chatConversationId);

  // ─── Computed wiring ───────────────────────────────────────────────

  const chatConversationId = chatSession.chatConversationId;

  const currentConversationLabel = computed(
    () => chatSession.conversationTitle.value || getDefaultConversationName(toolMode.value),
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

  const notePreview = computed(() => {
    const content = noteWorkflow.noteSummary.value?.resource?.content;
    if (!content) return t('aiAssistant.dialogs.note.previewUnavailable');
    return content.slice(0, 280);
  });

  const workflowStatusText = computed(() =>
    getWorkflowStatusText(
      {
        toolMode: toolMode.value,
        goalDraftLoading: goalWorkflow.goalDraftLoading.value,
        goalWorkflowStage: goalWorkflow.goalWorkflowStage.value,
        automationLoading: goalWorkflow.automationLoading.value,
        automationExecuting: goalWorkflow.automationExecuting.value,
        goalExecutionSummary: goalWorkflow.goalExecutionSummary.value,
        noteCreating: noteWorkflow.noteCreating.value,
        noteSummary: noteWorkflow.noteSummary.value,
      },
      t,
      formatters.formatExecutionOutcome,
    ),
  );

  const canSendMessage = computed(
    () =>
      modelSelection.canSendMessage.value &&
      !chatSession.chatLoading.value &&
      modelSelection.selectedModel.value !== null,
  );

  const canRunWorkflowActions = computed(
    () =>
      modelSelection.selectedModel.value !== null &&
      !chatSession.chatLoading.value &&
      !noteWorkflow.noteCreating.value &&
      (toolMode.value !== 'knowledge-note' || chatSession.hasWorkflowMessages.value),
  );

  // ─── Template wrappers ────────────────────────────────────────────

  async function selectConversation(item: ConversationSummary) {
    persistence.suspendWorkflowPersistence.value = true;
    await chatSession.selectConversation(
      item,
      service,
      modelSelection.syncSelectedModel,
      modelSelection.getPersistedModelKey,
    );
    persistence.restoreWorkflowState(item.id);
    persistence.suspendWorkflowPersistence.value = false;
  }

  async function maybeRenameCurrentConversation(name: string) {
    const nextName = name.trim();
    const currentTitle = chatSession.conversationTitle.value;
    if (!nextName || nextName === currentTitle) return;
    chatSession.conversationTitle.value = nextName;
    await maybeRenameConversation(
      nextName,
      currentTitle,
      chatConversationId.value,
      service,
      () => chatSession.loadConversationList(service),
    );
  }

  function startNewConversation(mode: WorkflowMode | string = 'chat') {
    chatSession.startNewConversation(mode);
    resetWorkflowArtifacts();
    toolMode.value = mode as WorkflowMode;
  }

  function exitToolMode() {
    resetWorkflowArtifacts();
    toolMode.value = 'chat';
    if (!chatConversationId.value && !chatSession.chatTimeline.value.length) {
      chatSession.conversationTitle.value = getDefaultConversationName('chat');
    }
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  bindChatViewLifecycle(
    {
      chatMessage: chatSession.chatMessage,
      chatTimeline: chatSession.chatTimeline,
      scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
      abortActiveStream: chatSession.abortActiveStream,
      adjustComposerHeight,
    },
    { watch, onBeforeUnmount, nextTick: (cb) => void nextTick().then(cb) },
  );

  onMounted(() =>
    initializeChatView({
      initRepository: () => void initRepository(),
      loadProviders,
      loadConversationList: () => chatSession.loadConversationList(service),
      syncSelectedModel: modelSelection.syncSelectedModel,
      getPersistedModelKey: modelSelection.getPersistedModelKey,
      selectConversation,
      resetChatSession: chatSession.resetChatSession,
      getDefaultConversationName,
      lastActiveConversationId: chatSession.lastActiveConversationId,
      conversationList: chatSession.conversationList,
      adjustComposerHeight,
      toastError: (msg: string) => toast.error(msg),
      translate: t,
      nextTick,
    }),
  );

  // ─── Return ────────────────────────────────────────────────────────

  return {
    session: {
      chatMessage: chatSession.chatMessage,
      chatLoading: chatSession.chatLoading,
      chatConversationId,
      chatTimeline: chatSession.chatTimeline,
      conversationTitle: chatSession.conversationTitle,
      conversationList: chatSession.conversationList,
      conversationListLoading: chatSession.conversationListLoading,
      messagesViewport: chatSession.messagesViewport,
      selectConversation,
      deleteConversation: (id: string) =>
        chatSession.deleteConversation(id, service, persistence.clearWorkflowState, modelSelection.clearConversationModelSelection),
      loadConversationList: () => chatSession.loadConversationList(service),
      startNewConversation,
      handleSendChat: () =>
        chatSession.handleSendChat(service, modelSelection.selectedModel.value, currentConversationLabel.value, adjustComposerHeight),
      stopGenerating: () => chatSession.stopGenerating(),
    },
    model: {
      selectedModelKey: modelSelection.selectedModelKey,
      modelGroups: modelSelection.modelGroups,
      canSendMessage,
      selectModel: (key: string) => modelSelection.selectModel(key),
    },
    goalWorkflow,
    noteWorkflow,
    formatters,
    common: {
      toolMode,
      currentConversationLabel,
      currentToolLabel,
      currentToolButtonLabel,
      notePreview,
      workflowStatusText,
      canRunWorkflowActions,
      exitToolMode,
      openSettings: () => void router.push('/settings'),
    },
  };
}
