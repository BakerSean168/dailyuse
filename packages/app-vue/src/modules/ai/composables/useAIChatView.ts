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

  function adjustComposerHeight() {
    const textarea = options.getComposerTextarea();
    if (!textarea) return;
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

  const workflowStatusText = computed(() => {
    if (toolMode.value === 'goal') {
      if (goalWorkflow.goalDraftLoading.value)
        return t('aiAssistant.dialogs.generateGoal.generating');
      if (goalWorkflow.goalWorkflowStage.value === 'plan' || goalWorkflow.automationLoading.value)
        return t('aiAssistant.dialogs.automation.planning');
      if (goalWorkflow.goalWorkflowStage.value === 'execute' || goalWorkflow.automationExecuting.value)
        return t('aiAssistant.dialogs.automation.executing');
      if (goalWorkflow.goalWorkflowStage.value === 'confirm')
        return t('aiAssistant.dialogs.automation.awaitingConfirmation');
      if (goalWorkflow.goalWorkflowStage.value === 'result') {
        if (goalWorkflow.goalExecutionSummary.value?.status === 'partial')
          return formatters.formatExecutionOutcome('partial');
        if (goalWorkflow.goalExecutionSummary.value?.status === 'failed')
          return formatters.formatExecutionOutcome('failed');
        return t('aiAssistant.dialogs.automation.executionRecorded');
      }
      if (goalWorkflow.goalWorkflowStage.value === 'clarification')
        return t('aiAssistant.chatPage.workflow.goalClarificationHint');
      if (goalWorkflow.goalWorkflowStage.value === 'draft')
        return t('aiAssistant.chatPage.workflow.goalDraftReadyHint');
      return t('aiAssistant.chatPage.workflow.goalCollectingHint');
    }
    if (toolMode.value === 'knowledge-note') {
      if (noteWorkflow.noteCreating.value) return t('aiAssistant.dialogs.note.creating');
      if (noteWorkflow.noteSummary.value)
        return t('aiAssistant.chatPage.workflow.noteCreatedHint', {
          path: noteWorkflow.noteSummary.value.resolvedPath,
        });
      return t('aiAssistant.chatPage.workflow.noteCollectingHint');
    }
    return '';
  });

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

  async function deleteConversation(id: string) {
    await chatSession.deleteConversation(
      id,
      service,
      persistence.clearWorkflowState,
      modelSelection.clearConversationModelSelection,
    );
  }

  async function loadConversationList() {
    await chatSession.loadConversationList(service);
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

  async function handleSendChat() {
    await chatSession.handleSendChat(
      service,
      modelSelection.selectedModel.value,
      currentConversationLabel.value,
      adjustComposerHeight,
    );
  }

  async function maybeRenameCurrentConversation(name: string) {
    const nextName = name.trim();
    if (!nextName || nextName === chatSession.conversationTitle.value) return;
    chatSession.conversationTitle.value = nextName;
    if (!chatConversationId.value) return;
    try {
      await service.updateConversation(
        chatConversationId.value as Parameters<typeof service.updateConversation>[0],
        { name: nextName },
      );
      await loadConversationList();
    } catch (error) {
      console.warn('[AIChatView] failed to update conversation title', error);
    }
  }

  function openSettings() {
    void router.push('/settings');
  }

  function selectModel(modelKey: string) {
    modelSelection.selectModel(modelKey);
  }

  function stopGenerating() {
    chatSession.stopGenerating();
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  watch(
    () => chatSession.chatMessage.value,
    () => {
      nextTick(() => {
        adjustComposerHeight();
      });
    },
  );

  watch(
    () => chatSession.chatTimeline.value.map((item) => `${item.id}:${item.content.length}`).join('|'),
    () => {
      chatSession.scrollMessagesToBottom();
    },
  );

  onBeforeUnmount(() => {
    chatSession.abortActiveStream();
  });

  onMounted(async () => {
    chatSession.resetChatSession('chat', getDefaultConversationName);
    chatSession.lastActiveConversationId.value =
      localStorage.getItem('ai:last-conversation-id') || '';

    try {
      void initRepository();
      await loadProviders();
      modelSelection.syncSelectedModel(modelSelection.getPersistedModelKey());
      await loadConversationList();

      const preferredConversation =
        chatSession.conversationList.value.find(
          (item) => item.id === chatSession.lastActiveConversationId.value,
        ) ||
        chatSession.conversationList.value[0] ||
        null;

      if (preferredConversation) {
        await selectConversation(preferredConversation);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      toast.error(
        message && message.length > 0 ? message : t('common.operationFailed'),
      );
    }

    await nextTick();
    adjustComposerHeight();
  });

  // ─── Return ────────────────────────────────────────────────────────

  return {
    // Chat session state
    chatMessage: chatSession.chatMessage,
    chatLoading: chatSession.chatLoading,
    chatConversationId,
    chatTimeline: chatSession.chatTimeline,
    conversationTitle: chatSession.conversationTitle,
    conversationList: chatSession.conversationList,
    conversationListLoading: chatSession.conversationListLoading,
    messagesViewport: chatSession.messagesViewport,

    // Model selection
    selectedModelKey: modelSelection.selectedModelKey,
    modelGroups: modelSelection.modelGroups,

    // Goal workflow
    goalDraftLoading: goalWorkflow.goalDraftLoading,
    goalWorkflowStage: goalWorkflow.goalWorkflowStage,
    goalDraft: goalWorkflow.goalDraft,
    goalClarification: goalWorkflow.goalClarification,
    goalAutomationResult: goalWorkflow.goalAutomationResult,
    clarificationAnswers: goalWorkflow.clarificationAnswers,
    showGoalDraftEditor: goalWorkflow.showGoalDraftEditor,
    creatingGoal: goalWorkflow.creatingGoal,
    automationLoading: goalWorkflow.automationLoading,
    automationExecuting: goalWorkflow.automationExecuting,
    editableGoal: goalWorkflow.editableGoal,
    editableKeyResults: goalWorkflow.editableKeyResults,
    canRunGoalWorkflow: goalWorkflow.canRunGoalWorkflow,
    canPlanGoalAutomation: goalWorkflow.canPlanGoalAutomation,
    goalExecutedActions: goalWorkflow.goalExecutedActions,
    goalExecutionSummary: goalWorkflow.goalExecutionSummary,
    goalExecutionRecovery: goalWorkflow.goalExecutionRecovery,
    automatedGoalId: goalWorkflow.automatedGoalId,
    generateGoalDraftFromConversation: goalWorkflow.generateGoalDraftFromConversation,
    handlePlanGoalAutomation: goalWorkflow.handlePlanGoalAutomation,
    handleExecuteGoalAutomation: goalWorkflow.handleExecuteGoalAutomation,
    openAutomatedGoal: goalWorkflow.openAutomatedGoal,
    handleCreateGoalFromDraft: goalWorkflow.handleCreateGoalFromDraft,
    addKeyResultDraft: goalWorkflow.addKeyResultDraft,
    removeKeyResultDraft: goalWorkflow.removeKeyResultDraft,
    updateKeyResultDraft: goalWorkflow.updateKeyResultDraft,
    handleUpdateGoalDraft: goalWorkflow.handleUpdateGoalDraft,
    toggleGoalDraftEditor: goalWorkflow.toggleGoalDraftEditor,

    // Note workflow
    noteCreating: noteWorkflow.noteCreating,
    noteSummary: noteWorkflow.noteSummary,
    createKnowledgeNoteFromConversation: noteWorkflow.createKnowledgeNoteFromConversation,
    openCreatedNote: noteWorkflow.openCreatedNote,

    // Formatters
    typingPlaceholder: formatters.typingPlaceholder,
    getMessageStatusLabel: formatters.getMessageStatusLabel,
    formatAutomationTool: formatters.formatAutomationTool,
    formatActionStatus: formatters.formatActionStatus,
    formatExecutionOutcome: formatters.formatExecutionOutcome,

    // Computed
    toolMode,
    currentConversationLabel,
    currentToolLabel,
    currentToolButtonLabel,
    notePreview,
    workflowStatusText,
    canSendMessage,
    canRunWorkflowActions,

    // Functions
    selectConversation,
    deleteConversation,
    loadConversationList,
    startNewConversation,
    exitToolMode,
    handleSendChat,
    openSettings,
    selectModel,
    stopGenerating,
  };
}
