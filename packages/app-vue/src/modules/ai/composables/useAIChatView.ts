import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AgentRun, AgentRunResult } from '@memoflow/contracts/ai';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import { useAI } from './useAI';
import { useGoal } from '../../goal/composables/useGoal';
import { useRecentKnowledgeNotes } from '../../repository/composables/useRecentKnowledgeNotes';
import { useAIChatSession } from './useAIChatSession';
import { useAIModelSelection } from './useAIModelSelection';
import { useAIGoalWorkflow } from './useAIGoalWorkflow';
import { useAIKnowledgeNoteWorkflow } from './useAIKnowledgeNoteWorkflow';
import { useAITaskWorkflow } from './useAITaskWorkflow';
import { useAIKnowledgeQaWorkflow } from './useAIKnowledgeQaWorkflow';
import { useAIWorkflowPersistence } from './useAIWorkflowPersistence';
import { useAIFormatters } from './useAIFormatters';
import { getToolLocaleKey, normalizeWorkflowMode } from './types';
import {
  adjustComposerHeight as createAdjustComposerHeight,
  bindChatViewLifecycle,
  getWorkflowStatusText,
  initializeChatView,
  maybeRenameConversation,
} from './chatViewHelpers';
import { unwrap } from '@memoflow/contracts/result';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import {
  AI_ASSISTANT_RUNTIME_KEY,
  AI_WORKFLOW_RUNTIME_KEY,
  ASSISTANT_SURFACE_KEY,
} from '../../../di/keys';
import type {
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
  const assistantRuntime = useStrictInject(AI_ASSISTANT_RUNTIME_KEY, 'AIAssistantRuntime');
  const workflowRuntime = useStrictInject(AI_WORKFLOW_RUNTIME_KEY, 'AIWorkflowRuntime');
  const assistantSurface = useStrictInject(ASSISTANT_SURFACE_KEY, 'AssistantSurface');
  const { goals, fetchGoals, createGoal } = useGoal();
  const recentKnowledgeNotes = useRecentKnowledgeNotes();
  const formatters = useAIFormatters();

  async function openKnowledgeNoteInRepository(noteId: string): Promise<void> {
    if (!noteId) return;
    await router.push({ path: '/repository', query: { note: noteId } });
  }

  async function requestOpenKnowledgeNote(resourceId: string): Promise<void> {
    await openKnowledgeNoteInRepository(resourceId);
  }

  async function loadRecentKnowledgeNotes(): Promise<void> {
    await recentKnowledgeNotes.load(20);
  }

  async function initRepository(): Promise<void> {
    await recentKnowledgeNotes.load(20);
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  function getDefaultConversationName(mode: WorkflowMode | string): string {
    const normalizedMode = normalizeWorkflowMode(mode);
    if (normalizedMode === 'goal-create')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.goalCreate');
    if (normalizedMode === 'task-create')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.taskCreate');
    if (normalizedMode === 'knowledge-generate')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeGenerate');
    if (normalizedMode === 'knowledge-qa')
      return t('aiAssistant.chatPage.workflow.defaultConversationNames.knowledgeQa');
    return t('aiAssistant.dialogs.chat.defaultConversationName');
  }

  const toolMode = ref<WorkflowMode>('chat');
  const agentRunList = ref<AgentRun[]>([]);
  const agentRunListLoading = ref(false);
  /** Residual 427: dedicated Host task.create AgentRun session field. */
  const taskAgentRun = ref<AgentRunResult | null>(null);
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
        progress: goal.overallProgress,
      })),
  );

  const recentKnowledgeNoteList = computed<AIWorkspaceRecentKnowledgeNote[]>(() =>
    [...recentKnowledgeNotes.notes.value]
      .sort((left, right) => Number(right.updatedAt) - Number(left.updatedAt))
      .slice(0, 5)
      .map((note) => ({
        id: note.id,
        title: note.title,
        path: note.path,
        updatedAt: note.updatedAt,
      })),
  );

  /** Explicit degrade when knowledge notes are gated by email verification. */
  const recentKnowledgeNotesEmailVerificationRequired = computed(
    () => recentKnowledgeNotes.emailVerificationRequired.value,
  );
  const recentKnowledgeNotesErrorMessageKey = computed(
    () => recentKnowledgeNotes.errorMessageKey.value,
  );

  // ─── Composables ───────────────────────────────────────────────────

  const providerList = computed<ProviderListItem[]>(() => providers.value);

  // Late-binding closure for cross-composable coordination.
  // eslint-disable-next-line prefer-const -- reassigned after options object is constructed
  let _persistWorkflowAndModel: ((id: string) => void) | undefined;

  // 1. Chat session
  const chatSession = useAIChatSession({
    service,
    runtime: assistantRuntime,
    surface: assistantSurface,
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
    workflowRuntime,
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
    scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
    maybeRenameCurrentConversation,
    refreshRecentNotes: loadRecentKnowledgeNotes,
    recentNotes: recentKnowledgeNotes.notes,
    openKnowledgeNote: requestOpenKnowledgeNote,
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
    requestOpenKnowledgeNote,
  });

  const taskWorkflow = useAITaskWorkflow({
    workflowRuntime,
    selectedModel: modelSelection.selectedModel,
    chatConversationId: chatSession.chatConversationId,
    chatLoading: chatSession.chatLoading,
    hasWorkflowUserMessages: chatSession.hasWorkflowUserMessages,
    buildConversationTranscript: chatSession.buildConversationTranscript,
    scrollMessagesToBottom: chatSession.scrollMessagesToBottom,
    maybeRenameCurrentConversation,
  });

  // 6. Persistence
  function resetWorkflowArtifacts() {
    goalWorkflow.resetGoalArtifacts();
    noteWorkflow.resetNoteArtifacts();
    knowledgeQaWorkflow.resetKnowledgeAnswer();
    // Residual 427: clear dedicated task.create session field.
    taskAgentRun.value = null;
    // Residual 433: clear task start local state (linked goal).
    taskWorkflow.resetTaskWorkflowLocalState();
  }

  const persistence = useAIWorkflowPersistence({
    toolMode,
    goalWorkflowStage: goalWorkflow.goalWorkflowStage,
    goalWorkflowRun: goalWorkflow.goalWorkflowRun,
    knowledgeQaAgentRun: knowledgeQaWorkflow.knowledgeQaAgentRun,
    noteAgentRun: noteWorkflow.noteAgentRun,
    taskWorkflowRun: taskWorkflow.taskWorkflowRun,
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
    const goalRunId = goalWorkflow.goalWorkflowRun.value?.runId;
    if (goalRunId) {
      // Durable Workflow storage is authoritative: a local snapshot is only a
      // run reference/UI cache and must be refreshed after reload/restart.
      await goalWorkflow.syncGoalWorkflowRun(goalRunId);
    }

    const noteRunId = noteWorkflow.noteAgentRun.value?.run.runId;
    if (noteRunId) {
      try {
        const result = unwrap(await service.getAgentRun(noteRunId));
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
        const result = unwrap(await service.getAgentRun(knowledgeQaRunId));
        if (result?.run) {
          knowledgeQaWorkflow.syncKnowledgeQaAgentRun(result);
        }
      } catch {
        // Keep the persisted snapshot when the runtime snapshot is unavailable.
      }
    }

    const taskRunId = taskWorkflow.taskWorkflowRun.value?.runId;
    if (taskRunId) {
      await taskWorkflow.syncTaskWorkflowRun(taskRunId);
      if (taskWorkflow.taskWorkflowRun.value) toolMode.value = 'task-create';
    }

    persistence.persistWorkflowState(conversationId);
  }

  async function restoreWorkflowState(conversationId: string) {
    persistence.restoreWorkflowState(conversationId);
    // One-way migration: historical primary-task-shaped goal.create snapshots
    // must never re-enter the Task Host lane after ADR-052 cutover.
    if (taskAgentRun.value && taskAgentRun.value.run.agentType !== 'task.create') {
      taskAgentRun.value = null;
    }
    // Re-align toolMode only when a real task.create run owns the session.
    if (taskAgentRun.value?.run.agentType === 'task.create') {
      toolMode.value = 'task-create';
    }
    await refreshRestoredAgentRun(conversationId);
  }

  function syncSelectedAgentRun(result: import('@memoflow/contracts/ai').AgentRunResult) {
    // Transitional Task/Knowledge AgentRun history remains available. goal.create
    // is owned exclusively by the durable Workflow runtime and must never be
    // rehydrated into the Host proposal lane from a legacy AgentRun snapshot.
    if (result.run.agentType === 'task.create') {
      noteWorkflow.resetNoteArtifacts();
      knowledgeQaWorkflow.resetKnowledgeAnswer();
      goalWorkflow.resetGoalArtifacts();
      toolMode.value = 'task-create';
      taskAgentRun.value = result;
      return;
    }

    if (result.run.agentType === 'goal.create') {
      noteWorkflow.resetNoteArtifacts();
      knowledgeQaWorkflow.resetKnowledgeAnswer();
      taskAgentRun.value = null;
      goalWorkflow.resetGoalArtifacts();
      toolMode.value = 'goal-create';
      return;
    }

    if (result.run.agentType === 'knowledge.generate') {
      goalWorkflow.resetGoalArtifacts();
      knowledgeQaWorkflow.resetKnowledgeAnswer();
      taskAgentRun.value = null;
      toolMode.value = 'knowledge-generate';
      noteWorkflow.syncKnowledgeNoteAgentRun(result);
      return;
    }

    if (result.run.agentType === 'knowledge.qa') {
      goalWorkflow.resetGoalArtifacts();
      noteWorkflow.resetNoteArtifacts();
      taskAgentRun.value = null;
      toolMode.value = 'knowledge-qa';
      knowledgeQaWorkflow.syncKnowledgeQaAgentRun(result);
    }
  }

  function syncAgentRunListItem(run: AgentRun | null | undefined) {
    if (!run) return;
    agentRunList.value = agentRunList.value.filter((item) => item.runId !== run.runId);
    agentRunList.value = [run, ...agentRunList.value]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, 5);
  }

  async function loadAgentRunList() {
    agentRunListLoading.value = true;
    try {
      const runs = unwrap(await service.listAgentRuns({ limit: 5 }));
      agentRunList.value = Array.isArray(runs) ? runs : [];
    } catch {
      agentRunList.value = [];
    } finally {
      syncAgentRunListItem(noteWorkflow.noteAgentRun.value?.run);
      syncAgentRunListItem(knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run);
      syncAgentRunListItem(taskAgentRun.value?.run);
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
      await loadRecentKnowledgeNotes();
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
      noteWorkflow.noteAgentRun.value?.run.runId,
      noteWorkflow.noteAgentRun.value?.run.status,
      noteWorkflow.noteAgentRun.value?.run.updatedAt,
      knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.runId,
      knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.status,
      knowledgeQaWorkflow.knowledgeQaAgentRun.value?.run.updatedAt,
    ],
    () => {
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
    const content = noteWorkflow.noteSummary.value?.note?.content;
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
        taskAgentLoading: taskWorkflow.taskAgentLoading.value,
        taskAgentRun: taskAgentRun.value,
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
      !taskWorkflow.taskAgentLoading.value &&
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

  async function selectAgentRun(
    run: AgentRun,
  ): Promise<import('@memoflow/contracts/ai').AgentRunResult | null> {
    const conversationId = run.conversationId;
    if (!conversationId) return null;

    let conversation = chatSession.conversationList.value.find(
      (item) => item.id === conversationId,
    );
    if (!conversation) {
      await chatSession.loadConversationList(service, { preserveSelection: true });
      conversation = chatSession.conversationList.value.find((item) => item.id === conversationId);
    }
    if (conversation) {
      await selectConversation(conversation);
    }
    try {
      const result = unwrap(await service.getAgentRun(run.runId));
      if (result?.run) {
        syncSelectedAgentRun(result);
        persistence.persistWorkflowState(conversationId);
        // Residual 381: return restored snapshot so Host workbench can reopen.
        return result;
      }
    } catch {
      // Keep the conversation selection even when the runtime snapshot is gone.
    }
    return null;
  }

  async function openRecentGoal(goalId: string) {
    if (!goalId) return;
    await router.push(`/goals/${goalId}`);
  }

  async function openRecentKnowledgeNote(resourceId: string) {
    await openKnowledgeNoteInRepository(resourceId);
  }

  async function maybeRenameCurrentConversation(name: string) {
    const nextName = name.trim();
    const currentTitle = chatSession.conversationTitle.value;
    if (!nextName || nextName === currentTitle) return;
    chatSession.conversationTitle.value = nextName;
    await maybeRenameConversation(nextName, currentTitle, chatConversationId.value, service, () =>
      chatSession.loadConversationList(service),
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
      /** Residual 427: dedicated Host task.create AgentRun session field. */
      taskAgentRun,
      recentGoalList,
      recentKnowledgeNoteList,
      recentKnowledgeNotesEmailVerificationRequired,
      recentKnowledgeNotesErrorMessageKey,
      messagesViewport: chatSession.messagesViewport,
      selectConversation,
      deleteConversation: (id: string) =>
        chatSession.deleteConversation(
          id,
          service,
          persistence.clearWorkflowState,
          modelSelection.clearConversationModelSelection,
        ),
      loadConversationList: loadWorkspaceLists,
      selectAgentRun,
      openRecentGoal,
      openRecentKnowledgeNote,
      startNewConversation,
      handleSendChat: () =>
        chatSession.handleSendChat(
          service,
          modelSelection.selectedModel.value,
          currentConversationLabel.value,
          adjustComposerHeight,
        ),
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
    taskWorkflow,
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
