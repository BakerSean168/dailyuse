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
import { useAIKnowledgeQaWorkflow } from './useAIKnowledgeQaWorkflow';
import { useAIWorkflowPersistence } from './useAIWorkflowPersistence';
import { useAIFormatters } from './useAIFormatters';
import { getToolLocaleKey, normalizeWorkflowMode } from './types';
import { adjustComposerHeight as createAdjustComposerHeight, bindChatViewLifecycle, getWorkflowStatusText, initializeChatView, maybeRenameConversation } from './chatViewHelpers';
import type {
  AgentRunSummary,
  AIWorkspaceRecentGoal,
  AIWorkspaceRecentKnowledgeNote,
  ConversationSummary,
  ProviderListItem,
  WorkflowMode,
} from './types';

export interface UseAIChatViewOptions {
  getComposerTextarea: () => HTMLTextAreaElement | null;
}

export function useAIChatView(options: UseAIChatViewOptions) {
  const { t } = useI18n();
  const router = useRouter();
  const { service, providers, loadProviders } = useAI();
  const { goals, fetchGoals, createGoal, addKeyResult } = useGoal();
  const { getCategory } = useUserSetting();
  const { initRepository, fetchResources, resources } = useRepository();
  const { requestOpenResource } = useEditorWorkspaceActions();
  const formatters = useAIFormatters();

  // ─── Helpers ───────────────────────────────────────────────────────

  function getDefaultConversationName(mode: WorkflowMode | string): string {
    const normalizedMode = normalizeWorkflowMode(mode);
    if (normalizedMode === 'goal-create')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.goalCreate');
    if (normalizedMode === 'knowledge-generate')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeGenerate');
    if (normalizedMode === 'knowledge-qa')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeQa');
    return t('aiAssistant.dialogs.chat.defaultConversationName');
  }

  const toolMode = ref<WorkflowMode>('chat');
  const agentRunList = ref<AgentRunSummary[]>([]);
  const agentRunListLoading = ref(false);
  const adjustComposerHeight = () => createAdjustComposerHeight(options.getComposerTextarea);

  const recentGoalList = computed<AIWorkspaceRecentGoal[]>(() =>
    [...goals.value]
      .filter((goal) => !goal.deletedAt)
      .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0))
      .slice(0, 5)
      .map((goal) => ({
        id: String(goal.id),
        title: goal.name,
        status: String(goal.status),
        updatedAt: Number(goal.updatedAt ?? 0),
        targetDate: goal.targetDate === null ? null : Number(goal.targetDate),
        progress: typeof goal.overallProgress === 'number' ? goal.overallProgress : null,
      })),
  );

  const recentKnowledgeNoteList = computed<AIWorkspaceRecentKnowledgeNote[]>(() =>
    [...resources.value]
      .filter((resource) => {
        if (resource.deletedAt || resource.isDeleted || resource.isArchived) return false;
        const extension = resource.extension?.toLowerCase?.() ?? '';
        const mimeType = resource.mimeType?.toLowerCase?.() ?? '';
        return extension === '.md' || mimeType === 'text/markdown';
      })
      .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0))
      .slice(0, 5)
      .map((resource) => ({
        id: String(resource.id),
        title: resource.name,
        path: resource.path,
        updatedAt: Number(resource.updatedAt ?? 0),
      })),
  );

  // ─── Composables ───────────────────────────────────────────────────

  const providerList = computed<ProviderListItem[]>(() => providers.value);

  const aiSettings = computed(() => getCategory('ai'));
  const knowledgeNoteSubpath = computed(() => aiSettings.value?.knowledgeNoteSubpath ?? '');

  // Late-binding closure for cross-composable coordination.
  // eslint-disable-next-line prefer-const -- reassigned after options object is constructed
  let _persistWorkflowAndModel: ((id: string) => void) | undefined;

  // 1. Chat session
  const chatSession = useAIChatSession({
    service,
    getDefaultConversationName,
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
    chatConversationId: chatSession.chatConversationId,
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
    chatConversationId: chatSession.chatConversationId,
    chatLoading: chatSession.chatLoading,
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

  // 5. Knowledge Q&A workflow
  const knowledgeQaWorkflow = useAIKnowledgeQaWorkflow({
    service,
    selectedModel: modelSelection.selectedModel,
    chatConversationId: chatSession.chatConversationId,
    chatLoading: chatSession.chatLoading,
    chatTimeline: chatSession.chatTimeline,
    hasWorkflowUserMessages: chatSession.hasWorkflowUserMessages,
    scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
    requestOpenResource,
  });

  // 6. Persistence
  function resetWorkflowArtifacts() {
    goalWorkflow.resetGoalArtifacts();
    noteWorkflow.resetNoteArtifacts();
    knowledgeQaWorkflow.resetKnowledgeAnswer();
  }

  const persistence = useAIWorkflowPersistence({
    toolMode,
    goalWorkflowStage: goalWorkflow.goalWorkflowStage,
    goalDraft: goalWorkflow.goalDraft,
    goalClarification: goalWorkflow.goalClarification,
    goalAutomationResult: goalWorkflow.goalAutomationResult,
    goalAgentRun: goalWorkflow.goalAgentRun,
    knowledgeQaAgentRun: knowledgeQaWorkflow.knowledgeQaAgentRun,
    noteAgentRun: noteWorkflow.noteAgentRun,
    knowledgeAnswer: knowledgeQaWorkflow.knowledgeAnswer,
    clarificationAnswers: goalWorkflow.clarificationAnswers,
    editableGoal: goalWorkflow.editableGoal,
    editableKeyResults: goalWorkflow.editableKeyResults,
    editableTaskTemplates: goalWorkflow.editableTaskTemplates,
    editableReminders: goalWorkflow.editableReminders,
    noteSummary: noteWorkflow.noteSummary,
    showGoalDraftEditor: goalWorkflow.showGoalDraftEditor,
    resetWorkflowArtifacts,
  });

  async function refreshRestoredAgentRun(conversationId: string) {
    const goalRunId = goalWorkflow.goalAgentRun.value?.run.runId;
    if (goalRunId) {
      try {
        const result = await service.getAgentRun(goalRunId);
        if (result?.run) {
          goalWorkflow.syncGoalAgentRun(result);
        }
      } catch {
        // Keep the persisted snapshot when the experimental in-memory runtime
        // no longer has this run, for example after an ai-service restart.
      }
    }

    const noteRunId = noteWorkflow.noteAgentRun.value?.run.runId;
    if (noteRunId) {
      try {
        const result = await service.getAgentRun(noteRunId);
        if (result?.run) {
          noteWorkflow.syncKnowledgeNoteAgentRun(result);
        }
      } catch {
        // Keep the persisted snapshot for the same reason as goal Agent runs.
        if (!noteWorkflow.noteSummary.value && noteWorkflow.noteAgentRun.value) {
          noteWorkflow.syncKnowledgeNoteAgentRun(noteWorkflow.noteAgentRun.value);
        }
      }
    }

    const knowledgeQaRunId = knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.runId;
    if (knowledgeQaRunId) {
      try {
        const result = await service.getAgentRun(knowledgeQaRunId);
        if (result?.run) {
          knowledgeQaWorkflow.syncKnowledgeQaAgentRun(result);
        }
      } catch {
        // Keep the persisted snapshot when the runtime snapshot is unavailable.
      }
    }

    persistence.persistWorkflowState(conversationId);
  }

  async function restoreWorkflowState(conversationId: string) {
    persistence.restoreWorkflowState(conversationId);
    await refreshRestoredAgentRun(conversationId);
  }

  function syncSelectedAgentRun(result: Awaited<ReturnType<typeof service.getAgentRun>>) {
    if (result.run.agentType === 'goal.create') {
      noteWorkflow.resetNoteArtifacts();
      knowledgeQaWorkflow.resetKnowledgeAnswer();
      toolMode.value = 'goal-create';
      goalWorkflow.syncGoalAgentRun(result);
      return;
    }

    if (result.run.agentType === 'knowledge.generate') {
      goalWorkflow.resetGoalArtifacts();
      knowledgeQaWorkflow.resetKnowledgeAnswer();
      toolMode.value = 'knowledge-generate';
      noteWorkflow.syncKnowledgeNoteAgentRun(result);
      return;
    }

    if (result.run.agentType === 'knowledge.qa') {
      goalWorkflow.resetGoalArtifacts();
      noteWorkflow.resetNoteArtifacts();
      toolMode.value = 'knowledge-qa';
      knowledgeQaWorkflow.syncKnowledgeQaAgentRun(result);
    }
  }

  function syncAgentRunListItem(run: AgentRunSummary | null | undefined) {
    if (!run) return;
    agentRunList.value = agentRunList.value.filter((item) => item.runId !== run.runId);
    agentRunList.value = [run, ...agentRunList.value]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, 5);
  }

  async function loadAgentRunList() {
    agentRunListLoading.value = true;
    try {
      const runs = await service.listAgentRuns({ limit: 5 });
      agentRunList.value = Array.isArray(runs) ? runs : [];
    } catch {
      agentRunList.value = [];
    } finally {
      syncAgentRunListItem(goalWorkflow.goalAgentRun.value?.run);
      syncAgentRunListItem(noteWorkflow.noteAgentRun.value?.run);
      syncAgentRunListItem(knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run);
      agentRunListLoading.value = false;
    }
  }

  async function loadGoalList() {
    try {
      await fetchGoals();
    } catch {
      // The AI workspace still works when the goal module list is unavailable.
    }
  }

  async function loadKnowledgeNoteList() {
    try {
      await fetchResources();
    } catch {
      // The AI workspace still works when the repository list is unavailable.
    }
  }

  async function loadWorkspaceLists() {
    await Promise.all([
      chatSession.loadConversationList(service),
      loadAgentRunList(),
      loadGoalList(),
      loadKnowledgeNoteList(),
    ]);
  }

  // Wire late-binding callbacks
  _persistWorkflowAndModel = (id) => {
    persistence.persistWorkflowState(id);
    modelSelection.persistSelectedModel(modelSelection.selectedModelKey.value, id);
  };

  // Wire persistence watcher
  persistence.bindPersistenceWatcher(chatSession.chatConversationId);
  watch(
    () => [
      goalWorkflow.goalAgentRun.value?.run.runId,
      goalWorkflow.goalAgentRun.value?.run.status,
      goalWorkflow.goalAgentRun.value?.run.updatedAt,
      noteWorkflow.noteAgentRun.value?.run.runId,
      noteWorkflow.noteAgentRun.value?.run.status,
      noteWorkflow.noteAgentRun.value?.run.updatedAt,
      knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.runId,
      knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.status,
      knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.updatedAt,
    ],
    () => {
      syncAgentRunListItem(goalWorkflow.goalAgentRun.value?.run);
      syncAgentRunListItem(noteWorkflow.noteAgentRun.value?.run);
      syncAgentRunListItem(knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run);
    },
  );

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
        knowledgeQueryLoading: knowledgeQaWorkflow.knowledgeQueryLoading.value,
        knowledgeAnswer: knowledgeQaWorkflow.knowledgeAnswer.value,
        noteCreating: noteWorkflow.noteCreating.value,
        noteAgentLoading: noteWorkflow.noteAgentLoading.value,
        noteAgentDraftReady: Boolean(noteWorkflow.noteAgentDraftArtifact.value),
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
      !knowledgeQaWorkflow.knowledgeQueryLoading.value &&
      !noteWorkflow.noteCreating.value &&
      !noteWorkflow.noteAgentLoading.value &&
      (toolMode.value !== 'knowledge-generate' || chatSession.hasWorkflowMessages.value) &&
      (toolMode.value !== 'knowledge-qa' || chatSession.hasWorkflowUserMessages.value),
  );

  // ─── Template wrappers ────────────────────────────────────────────

  async function selectConversation(item: ConversationSummary) {
    persistence.suspendWorkflowPersistence.value = true;
    try {
      await chatSession.selectConversation(
        item,
        service,
        modelSelection.syncSelectedModel,
        modelSelection.getPersistedModelKey,
      );
      await restoreWorkflowState(item.id);
    } finally {
      persistence.suspendWorkflowPersistence.value = false;
    }
  }

  async function selectAgentRun(run: AgentRunSummary) {
    const conversationId = run.conversationId;
    if (!conversationId) return;

    let conversation = chatSession.conversationList.value.find(
      (item) => item.id === conversationId,
    );
    if (!conversation) {
      await chatSession.loadConversationList(service, { preserveSelection: true });
      conversation = chatSession.conversationList.value.find(
        (item) => item.id === conversationId,
      );
    }
    if (conversation) {
      await selectConversation(conversation);
    }
    try {
      const result = await service.getAgentRun(run.runId);
      if (result?.run) {
        syncSelectedAgentRun(result);
        persistence.persistWorkflowState(conversationId);
      }
    } catch {
      // Keep the conversation selection even when the runtime snapshot is gone.
    }
  }

  async function openRecentGoal(goalId: string) {
    if (!goalId) return;
    await router.push(`/goals/${goalId}`);
  }

  async function openRecentKnowledgeNote(resourceId: string) {
    if (!resourceId) return;
    await requestOpenResource(resourceId);
    await router.push('/repository');
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
    const normalizedMode = normalizeWorkflowMode(mode);
    chatSession.startNewConversation(normalizedMode);
    resetWorkflowArtifacts();
    toolMode.value = normalizedMode;
  }

  function exitToolMode() {
    resetWorkflowArtifacts();
    toolMode.value = 'chat';
    if (!chatConversationId.value && !chatSession.chatTimeline.value.length) {
      chatSession.conversationTitle.value = getDefaultConversationName('chat');
    }
  }

  async function askKnowledgeFromConversation() {
    noteWorkflow.resetNoteArtifacts();
    await knowledgeQaWorkflow.askKnowledgeFromConversation();
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
      initRepository,
      loadProviders,
      loadConversationList: loadWorkspaceLists,
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
      agentRunList,
      agentRunListLoading,
      recentGoalList,
      recentKnowledgeNoteList,
      messagesViewport: chatSession.messagesViewport,
      selectConversation,
      deleteConversation: (id: string) =>
        chatSession.deleteConversation(id, service, persistence.clearWorkflowState, modelSelection.clearConversationModelSelection),
      loadConversationList: loadWorkspaceLists,
      selectAgentRun,
      openRecentGoal,
      openRecentKnowledgeNote,
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
    knowledgeQaWorkflow: {
      ...knowledgeQaWorkflow,
      askKnowledgeFromConversation,
    },
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

