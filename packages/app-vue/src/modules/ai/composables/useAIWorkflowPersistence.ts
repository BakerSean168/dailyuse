import { ref, watch, type Ref } from 'vue';
// Residual 1007: sole normalizeReminderTimeOfDay (local dual retired).
import { normalizeReminderTimeOfDay } from '@memoflow/utils/shared';
import type { AgentRunResult, AIWorkflowRunView } from '@memoflow/contracts/ai';
import {
  createEmptyGoalDraft,
  type EditableGoal,
  type EditableKeyResult,
  type EditableGoalReminder,
  type EditableGoalTaskTemplate,
  type GoalWorkflowStage,
  type KnowledgeAnswer,
  type NoteSummary,
  type PersistedWorkflowEntry,
  type WorkflowMode,
  normalizeWorkflowMode,
} from './types';

const WORKFLOW_STORAGE_KEY = 'ai:conversation-workflow-map';

export interface UseAIWorkflowPersistenceOptions {
  toolMode: Ref<WorkflowMode>;
  goalWorkflowStage: Ref<GoalWorkflowStage>;
  goalWorkflowRun: Ref<AIWorkflowRunView | null>;
  knowledgeQaAgentRun: Ref<AgentRunResult | null>;
  noteAgentRun: Ref<AgentRunResult | null>;
  /** Residual 427: dedicated Host task.create AgentRun session field. */
  taskAgentRun: Ref<AgentRunResult | null>;
  knowledgeAnswer: Ref<KnowledgeAnswer | null>;
  clarificationAnswers: Ref<string[]>;
  editableGoal: Ref<EditableGoal>;
  editableKeyResults: Ref<EditableKeyResult[]>;
  editableTaskTemplates: Ref<EditableGoalTaskTemplate[]>;
  editableReminders: Ref<EditableGoalReminder[]>;
  noteSummary: Ref<NoteSummary | null>;
  showGoalDraftEditor: Ref<boolean>;
  resetWorkflowArtifacts: () => void;
}

export function useAIWorkflowPersistence(options: UseAIWorkflowPersistenceOptions) {
  const suspendWorkflowPersistence = ref(false);

  function readWorkflowStorage(): Record<string, PersistedWorkflowEntry> {
    try {
      const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, PersistedWorkflowEntry>)
        : {};
    } catch {
      return {};
    }
  }

  function writeWorkflowStorage(next: Record<string, PersistedWorkflowEntry>) {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(next));
  }

  function createStoredNoteSummary(summary: NoteSummary | null): NoteSummary | null {
    if (!summary) return null;
    return {
      resolvedPath: summary.resolvedPath,
      indexStatus: summary.indexStatus,
      note: summary.note
        ? {
            id: summary.note.id,
            name: summary.note.name,
            content: summary.note.content?.slice(0, 280),
          }
        : undefined,
    };
  }

  function normalizeReminderDraft(item: EditableGoalReminder): EditableGoalReminder {
    return {
      ...item,
      // Residual 1007: normalizeReminderTimeOfDay elevated to @memoflow/utils/shared.
      timeOfDay: normalizeReminderTimeOfDay(item.timeOfDay),
    };
  }

  function inferGoalWorkflowStage(
    entry: PersistedWorkflowEntry | undefined | null,
  ): GoalWorkflowStage {
    const run = entry?.goalWorkflowRun;
    if (run?.kind === 'goal.create') {
      if (run.status === 'suspended' && run.suspension?.type === 'clarification_required') {
        return 'clarification';
      }
      if (run.status === 'suspended' && run.suspension?.type === 'goal_draft_review') {
        return 'confirm';
      }
      if (run.status === 'suspended' && run.suspension?.type === 'recovery_required') {
        return 'execute';
      }
      if (run.status === 'completed' || run.status === 'cancelled' || run.status === 'failed') {
        return 'result';
      }
      return 'plan';
    }
    if (entry?.goalWorkflowStage) return entry.goalWorkflowStage;
    if (
      entry?.goalAutomationResult?.state === 'result' &&
      entry.goalAutomationResult.executedActions.length
    )
      return 'result';
    if (entry?.goalAutomationResult) return 'confirm';
    if (entry?.goalClarification) return 'clarification';
    if (entry?.goalDraft) return 'draft';
    return 'collect';
  }

  function snapshotWorkflowEntry(): PersistedWorkflowEntry | null {
    if (options.toolMode.value === 'chat') return null;

    return {
      mode: options.toolMode.value,
      goalWorkflowStage:
        options.toolMode.value === 'goal-create' ? options.goalWorkflowStage.value : undefined,
      goalWorkflowRun: options.goalWorkflowRun.value,
      knowledgeQaAgentRun: options.knowledgeQaAgentRun.value,
      noteAgentRun: options.noteAgentRun.value,
      taskAgentRun: options.taskAgentRun.value,
      knowledgeAnswer: options.knowledgeAnswer.value,
      clarificationAnswers: [...options.clarificationAnswers.value],
      editableGoal: {
        ...options.editableGoal.value,
        tags: [...options.editableGoal.value.tags],
      },
      editableKeyResults: options.editableKeyResults.value.map((item) => ({ ...item })),
      editableTaskTemplates: options.editableTaskTemplates.value.map((item) => ({ ...item })),
      editableReminders: options.editableReminders.value.map((item) => ({ ...item })),
      noteSummary: createStoredNoteSummary(options.noteSummary.value),
      showGoalDraftEditor: options.showGoalDraftEditor.value,
    };
  }

  function persistWorkflowState(conversationId: string) {
    if (!conversationId) return;
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
    if (!conversationId) return;
    const stored = readWorkflowStorage();
    if (!(conversationId in stored)) return;
    delete stored[conversationId];
    writeWorkflowStorage(stored);
  }

  function restoreWorkflowState(conversationId: string) {
    const entry = readWorkflowStorage()[conversationId];
    options.resetWorkflowArtifacts();

    if (!entry) {
      options.toolMode.value = 'chat';
      return;
    }

    const mode = normalizeWorkflowMode(entry.mode);
    options.toolMode.value = mode;
    options.goalWorkflowStage.value =
      mode === 'goal-create' ? inferGoalWorkflowStage(entry) : 'collect';
    options.goalWorkflowRun.value = entry.goalWorkflowRun ?? null;
    options.knowledgeQaAgentRun.value = entry.knowledgeQaAgentRun ?? null;
    options.noteAgentRun.value = entry.noteAgentRun ?? null;
    options.taskAgentRun.value = entry.taskAgentRun ?? null;
    options.knowledgeAnswer.value = entry.knowledgeAnswer ?? null;
    options.clarificationAnswers.value = [...(entry.clarificationAnswers ?? [])];
    options.editableGoal.value = {
      ...createEmptyGoalDraft(),
      ...entry.editableGoal,
      tags: [...(entry.editableGoal?.tags ?? [])],
    };
    options.editableKeyResults.value = (entry.editableKeyResults ?? []).map((item) => ({
      ...item,
    }));
    options.editableTaskTemplates.value = (entry.editableTaskTemplates ?? []).map((item) => ({
      ...item,
    }));
    options.editableReminders.value = (entry.editableReminders ?? []).map((item) =>
      normalizeReminderDraft(item),
    );
    options.noteSummary.value = entry.noteSummary
      ? createStoredNoteSummary(entry.noteSummary)
      : null;
    options.showGoalDraftEditor.value = Boolean(entry.showGoalDraftEditor);
  }

  function bindPersistenceWatcher(chatConversationId: Ref<string>) {
    watch(
      () =>
        [
          chatConversationId.value,
          options.toolMode.value,
          options.goalWorkflowStage.value,
          options.showGoalDraftEditor.value ? '1' : '0',
          JSON.stringify(options.goalWorkflowRun.value),
          JSON.stringify(options.knowledgeQaAgentRun.value),
          JSON.stringify(options.noteAgentRun.value),
          JSON.stringify(options.taskAgentRun.value),
          JSON.stringify(options.knowledgeAnswer.value),
          JSON.stringify(options.clarificationAnswers.value),
          JSON.stringify(options.editableGoal.value),
          JSON.stringify(options.editableKeyResults.value),
          JSON.stringify(options.editableTaskTemplates.value),
          JSON.stringify(options.editableReminders.value),
          JSON.stringify(createStoredNoteSummary(options.noteSummary.value)),
        ].join('|'),
      () => {
        if (!chatConversationId.value || suspendWorkflowPersistence.value) return;
        persistWorkflowState(chatConversationId.value);
      },
    );
  }

  return {
    suspendWorkflowPersistence,
    persistWorkflowState,
    clearWorkflowState,
    restoreWorkflowState,
    bindPersistenceWatcher,
  };
}
