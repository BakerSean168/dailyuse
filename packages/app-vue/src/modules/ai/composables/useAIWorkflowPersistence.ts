import { ref, watch, type Ref } from 'vue';
import {
  createEmptyGoalDraft,
  type EditableGoal,
  type EditableKeyResult,
  type EditableGoalReminder,
  type EditableGoalTaskTemplate,
  type GoalAgentRunResult,
  type GoalAutomationResult,
  type GoalClarification,
  type GoalDraft,
  type GoalWorkflowStage,
  type KnowledgeAnswer,
  type KnowledgeQaAgentRunResult,
  type KnowledgeNoteAgentRunResult,
  type NoteSummary,
  type PersistedWorkflowEntry,
  type WorkflowMode,
  normalizeWorkflowMode,
} from './types';

const WORKFLOW_STORAGE_KEY = 'ai:conversation-workflow-map';
const DEFAULT_REMINDER_TIME_OF_DAY = '09:00';
const REMINDER_TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface UseAIWorkflowPersistenceOptions {
  toolMode: Ref<WorkflowMode>;
  goalWorkflowStage: Ref<GoalWorkflowStage>;
  goalDraft: Ref<GoalDraft | null>;
  goalClarification: Ref<GoalClarification | null>;
  goalAutomationResult: Ref<GoalAutomationResult | null>;
  goalAgentRun: Ref<GoalAgentRunResult | null>;
  knowledgeQaAgentRun: Ref<KnowledgeQaAgentRunResult | null>;
  noteAgentRun: Ref<KnowledgeNoteAgentRunResult | null>;
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
      resource: summary.resource
        ? {
            id: summary.resource.id,
            name: summary.resource.name,
            content: summary.resource.content?.slice(0, 280),
          }
        : undefined,
    };
  }

  function normalizeReminderDraft(item: EditableGoalReminder): EditableGoalReminder {
    return {
      ...item,
      timeOfDay: REMINDER_TIME_OF_DAY_PATTERN.test(item.timeOfDay)
        ? item.timeOfDay
        : DEFAULT_REMINDER_TIME_OF_DAY,
    };
  }

  function inferGoalWorkflowStage(entry: PersistedWorkflowEntry | undefined | null): GoalWorkflowStage {
    if (entry?.goalAgentRun?.run.status === 'waiting_clarification') return 'clarification';
    if (entry?.goalAgentRun?.run.status === 'waiting_approval') return 'confirm';
    if (entry?.goalAgentRun?.run.status === 'waiting_execution') return 'execute';
    if (
      entry?.goalAgentRun?.run.status === 'completed' ||
      entry?.goalAgentRun?.run.status === 'cancelled' ||
      entry?.goalAgentRun?.run.status === 'failed'
    ) {
      return 'result';
    }
    if (entry?.goalWorkflowStage) return entry.goalWorkflowStage;
    if (entry?.goalAutomationResult?.state === 'result' && entry.goalAutomationResult.executedActions.length)
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
      goalWorkflowStage: options.toolMode.value === 'goal-create' ? options.goalWorkflowStage.value : undefined,
      goalDraft: options.goalDraft.value,
      goalClarification: options.goalClarification.value,
      goalAutomationResult: options.goalAutomationResult.value,
      goalAgentRun: options.goalAgentRun.value,
      knowledgeQaAgentRun: options.knowledgeQaAgentRun.value,
      noteAgentRun: options.noteAgentRun.value,
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
    options.goalWorkflowStage.value = mode === 'goal-create' ? inferGoalWorkflowStage(entry) : 'collect';
    options.goalDraft.value = entry.goalDraft;
    options.goalClarification.value = entry.goalClarification ?? null;
    options.goalAutomationResult.value = entry.goalAutomationResult ?? null;
    options.goalAgentRun.value = entry.goalAgentRun ?? null;
    options.knowledgeQaAgentRun.value = entry.knowledgeQaAgentRun ?? null;
    options.noteAgentRun.value = entry.noteAgentRun ?? null;
    options.knowledgeAnswer.value = entry.knowledgeAnswer ?? null;
    options.clarificationAnswers.value = [...(entry.clarificationAnswers ?? [])];
    options.editableGoal.value = {
      ...createEmptyGoalDraft(),
      ...entry.editableGoal,
      tags: [...(entry.editableGoal?.tags ?? [])],
    };
    options.editableKeyResults.value = (entry.editableKeyResults ?? []).map((item) => ({ ...item }));
    options.editableTaskTemplates.value = (entry.editableTaskTemplates ?? []).map((item) => ({
      ...item,
    }));
    options.editableReminders.value = (entry.editableReminders ?? []).map((item) =>
      normalizeReminderDraft(item),
    );
    options.noteSummary.value = entry.noteSummary ? createStoredNoteSummary(entry.noteSummary) : null;
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
          JSON.stringify(options.goalDraft.value),
          JSON.stringify(options.goalClarification.value),
          JSON.stringify(options.goalAutomationResult.value),
          JSON.stringify(options.goalAgentRun.value),
          JSON.stringify(options.knowledgeQaAgentRun.value),
          JSON.stringify(options.noteAgentRun.value),
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
