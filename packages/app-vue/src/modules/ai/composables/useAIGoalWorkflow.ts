import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type {
  AgentActionPlan,
  AgentArtifact,
  AgentResumePayload,
  AgentStartRunClientRequest,
  GeneratedGoalDraft,
  KeyResultPreview,
} from '@dailyuse/contracts/ai';
import {
  createEmptyGoalDraft,
  createEmptyGoalReminderDraft,
  createEmptyGoalTaskTemplateDraft,
  type EditableGoal,
  type EditableKeyResult,
  type EditableGoalReminder,
  type EditableGoalTaskTemplate,
  type GoalAutomationResult,
  type GoalAgentAction,
  type GoalAgentRunResult,
  type GoalClarification,
  type GoalDraft,
  type GoalWorkflowStage,
  type UseAIGoalWorkflowOptions,
} from './types';
import { getAIErrorMessage } from './error';
import {
  buildDraftContext,
  generateGoalDraft,
  handlePlanAutomation,
  handleExecuteAutomation,
  type AutomationContext,
} from './goalAutomationHelpers';
import { unwrap } from '@dailyuse/contracts/result';
import {
  applyGoalDraft as applyGoalDraftHelper,
  applyGoalClarification as applyGoalClarificationHelper,
  clearGoalAutomationResult as clearHelper,
  resetGoalArtifacts as resetHelper,
  createKeyResultDraft,
  createDraftStateProxy,
  buildCreateGoalRequest,
  buildAddKeyResultRequest,
} from './goalDraftHelpers';

const GOAL_CATEGORIES = [
  'work',
  'health',
  'learning',
  'personal',
  'finance',
  'relationship',
  'other',
] as const;
const IMPORTANCE_LEVELS = ['Vital', 'Important', 'Moderate', 'Minor', 'Trivial'] as const;
const GOAL_CADENCES = ['daily', 'weekly', 'once'] as const;
const DEFAULT_REMINDER_TIME_OF_DAY = '09:00';
const REMINDER_TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function useAIGoalWorkflow(options: UseAIGoalWorkflowOptions) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const goalDraftLoading = ref(false);
  const goalWorkflowStage = ref<GoalWorkflowStage>('collect');
  const goalDraft = ref<GoalDraft | null>(null);
  const goalClarification = ref<GoalClarification | null>(null);
  const goalAutomationResult = ref<GoalAutomationResult | null>(null);
  const clarificationAnswers = ref<string[]>([]);
  const showGoalDraftEditor = ref(false);
  const creatingGoal = ref(false);
  const automationLoading = ref(false);
  const automationExecuting = ref(false);
  const goalAgentRun = ref<GoalAgentRunResult | null>(null);
  const goalAgentLoading = ref(false);
  const goalAgentResuming = ref(false);
  const editableGoal = ref<EditableGoal>(createEmptyGoalDraft());
  const editableKeyResults = ref<EditableKeyResult[]>([]);
  const editableTaskTemplates = ref<EditableGoalTaskTemplate[]>([]);
  const editableReminders = ref<EditableGoalReminder[]>([]);

  const automationCtx: AutomationContext = {
    service: options.service,
    selectedModel: options.selectedModel,
    buildConversationTranscript: options.buildConversationTranscript,
    conversationTitle: options.conversationTitle,
    scrollMessagesToBottom: options.scrollMessagesToBottom,
  };
  const handlerCtx = {
    selectedModel: options.selectedModel,
    goalDraft,
    goalAutomationResult,
    goalWorkflowStage,
    automationLoading,
    automationExecuting,
    buildCurrentDraftContext: () => buildDraftContext(editableGoal.value, editableKeyResults.value, goalDraft.value, options.conversationTitle.value),
    scrollMessagesToBottom: options.scrollMessagesToBottom,
    toastSuccess: (msg: string) => toast.success(msg),
    toastError: (msg: string) => toast.error(msg),
    translate: t,
    getAIErrorMessage,
  };

  const draftState = createDraftStateProxy({
    goalWorkflowStage, goalDraft, goalClarification, goalAutomationResult,
    clarificationAnswers, showGoalDraftEditor, editableGoal, editableKeyResults,
    editableTaskTemplates, editableReminders,
  });

  const canSubmitGoalClarification = computed(() => {
    if (!goalClarification.value) return false;
    return goalClarification.value.questions.every(
      (_, index) => (clarificationAnswers.value[index] || '').trim().length > 0,
    );
  });

  const canRunGoalWorkflow = computed(() =>
    goalClarification.value
      ? Boolean(options.selectedModel.value) && !options.chatLoading.value && canSubmitGoalClarification.value
      : Boolean(options.selectedModel.value) && !options.chatLoading.value && options.hasWorkflowUserMessages.value,
  );

  const canPlanGoalAutomation = computed(
    () =>
      Boolean(options.selectedModel.value) &&
      !automationLoading.value &&
      !automationExecuting.value &&
      Boolean(goalDraft.value),
  );
  const canRunGoalAgent = computed(
    () =>
      !options.chatLoading.value &&
      !goalAgentLoading.value &&
      !goalAgentResuming.value &&
      options.hasWorkflowUserMessages.value,
  );

  const goalExecutedActions = computed(() =>
    goalAutomationResult.value?.state === 'result' ? goalAutomationResult.value.executedActions : [],
  );
  const goalExecutionSummary = computed(() =>
    goalAutomationResult.value?.state === 'result' ? goalAutomationResult.value.executionSummary : null,
  );
  const goalExecutionRecovery = computed(() =>
    goalAutomationResult.value?.state === 'result' ? goalAutomationResult.value.recovery : null,
  );
  const goalAgentPendingActions = computed(() => {
    const run = goalAgentRun.value;
    if (!run) return [];
    return run.state.pendingActions.length ? run.state.pendingActions : run.state.approvedActions;
  });
  const goalAgentExecutedActions = computed(() => goalAgentRun.value?.state.executedActions ?? []);
  const automatedGoalId = computed(
    () =>
      goalExecutedActions.value.find((action) => action.tool === 'create_goal')?.entityId ??
      goalAgentExecutedActions.value.find((action) => action.tool === 'create_goal')?.entityId ??
      '',
  );
  const goalAgentWaitingForApproval = computed(
    () => goalAgentRun.value?.run.status === 'waiting_approval',
  );
  const goalAgentWaitingForClarification = computed(
    () => goalAgentRun.value?.run.status === 'waiting_clarification',
  );
  const goalAgentWaitingForExecution = computed(
    () => goalAgentRun.value?.run.status === 'waiting_execution',
  );
  const canResumeGoalAgentClarification = computed(
    () =>
      goalAgentWaitingForClarification.value &&
      !goalAgentResuming.value &&
      canSubmitGoalClarification.value,
  );
  const canContinueGoalAgentExecution = computed(
    () => {
      const run = goalAgentRun.value;
      return Boolean(
        run &&
          goalAgentWaitingForExecution.value &&
          !goalAgentResuming.value,
      );
    },
  );
  const canRetryGoalAgentExecution = computed(() => {
    const run = goalAgentRun.value;
    if (!run || run.run.status !== 'completed' || goalAgentResuming.value) return false;
    const recovery = getGoalAgentExecutionRecovery(run);
    return recovery?.canRetry === true;
  });

  function createAgentId(prefix: string): string {
    const randomId = globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${randomId}`;
  }

  function syncGoalAgentStage(result: GoalAgentRunResult) {
    if (result.run.status === 'waiting_clarification') {
      goalWorkflowStage.value = 'clarification';
      return;
    }
    if (result.run.status === 'waiting_approval') {
      goalWorkflowStage.value = 'confirm';
      return;
    }
    if (result.run.status === 'waiting_execution') {
      goalWorkflowStage.value = 'execute';
      return;
    }
    if (result.run.status === 'completed' || result.run.status === 'cancelled' || result.run.status === 'failed') {
      goalWorkflowStage.value = 'result';
      return;
    }
    goalWorkflowStage.value = 'plan';
  }

  function getGoalAgentClarification(result: GoalAgentRunResult): GoalClarification | null {
    const interrupt = result.interrupts.find(
      (item) => isRecord(item) && item.type === 'clarification.required',
    );
    if (!isRecord(interrupt)) return null;

    const rawQuestions = interrupt.questions;
    if (!Array.isArray(rawQuestions)) return null;

    const questions = rawQuestions
      .filter(isRecord)
      .map((item) => ({
        question: getString(item, 'question'),
        context: getString(item, 'context') || null,
      }))
      .filter((item) => item.question);

    if (!questions.length) return null;

    return {
      needsClarification: true,
      questions,
      rationale: getString(interrupt, 'rationale') || null,
    };
  }

  function syncGoalAgentRun(result: GoalAgentRunResult) {
    const previousRun = goalAgentRun.value;
    goalAgentRun.value = result;
    if (result.run.status === 'waiting_clarification') {
      const clarification = getGoalAgentClarification(result);
      if (clarification) {
        applyGoalClarificationHelper(draftState, clarification);
      } else {
        goalWorkflowStage.value = 'clarification';
      }
      return;
    }

    goalClarification.value = null;
    clarificationAnswers.value = [];
    syncEditableDraftFromGoalAgentRun(result, {
      force:
        previousRun?.run.runId !== result.run.runId ||
        !showGoalDraftEditor.value ||
        isEditableGoalEmpty(),
    });
    syncGoalAgentStage(result);
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function getString(data: Record<string, unknown>, key: string): string {
    const value = data[key];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
  }

  function getNumber(data: Record<string, unknown>, key: string, fallback: number): number {
    const value = data[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  function getStringArray(data: Record<string, unknown>, key: string): string[] {
    const value = data[key];
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  }

  function normalizeGoalCategory(value: string): GeneratedGoalDraft['category'] {
    return (GOAL_CATEGORIES as readonly string[]).includes(value)
      ? value as GeneratedGoalDraft['category']
      : 'other' as GeneratedGoalDraft['category'];
  }

  function normalizeImportance(value: string): GeneratedGoalDraft['importance'] {
    return (IMPORTANCE_LEVELS as readonly string[]).includes(value)
      ? value as GeneratedGoalDraft['importance']
      : 'Moderate' as GeneratedGoalDraft['importance'];
  }

  function normalizeCadence(value: string): EditableGoalTaskTemplate['cadence'] {
    return (GOAL_CADENCES as readonly string[]).includes(value)
      ? value as EditableGoalTaskTemplate['cadence']
      : 'weekly';
  }

  function normalizeReminderTimeOfDay(value: string): string {
    return REMINDER_TIME_OF_DAY_PATTERN.test(value)
      ? value
      : DEFAULT_REMINDER_TIME_OF_DAY;
  }

  function coerceKeyResults(value: unknown): KeyResultPreview[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const keyResults = value
      .filter(isRecord)
      .map((item) => ({
        title: getString(item, 'title'),
        description: getString(item, 'description') || undefined,
        valueType: getString(item, 'valueType') as KeyResultPreview['valueType'],
        calculationMethod: getString(item, 'calculationMethod') as KeyResultPreview['calculationMethod'],
        startValue: getNumber(item, 'startValue', 0),
        currentValue: getNumber(item, 'currentValue', getNumber(item, 'startValue', 0)),
        targetValue: getNumber(item, 'targetValue', 1),
        unit: getString(item, 'unit') || t('aiAssistant.goalDraft.unit'),
        weight: getNumber(item, 'weight', 1),
      }))
      .filter((item) => item.title && item.valueType && item.calculationMethod);
    return keyResults.length ? keyResults : undefined;
  }

  function coerceTaskTemplates(value: unknown): EditableGoalTaskTemplate[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter(isRecord)
      .map((item) => ({
        name: getString(item, 'name'),
        description: getString(item, 'description'),
        importance: normalizeImportance(getString(item, 'importance')),
        cadence: normalizeCadence(getString(item, 'cadence')),
        timeOfDay: getString(item, 'timeOfDay') || '09:00',
      }))
      .filter((item) => item.name);
  }

  function coerceReminders(value: unknown): EditableGoalReminder[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter(isRecord)
      .map((item) => ({
        title: getString(item, 'title'),
        description: getString(item, 'description'),
        importance: normalizeImportance(getString(item, 'importance')),
        cadence: normalizeCadence(getString(item, 'cadence')),
        timeOfDay: normalizeReminderTimeOfDay(getString(item, 'timeOfDay')),
      }))
      .filter((item) => item.title);
  }

  function findGoalAgentArtifactData(run: GoalAgentRunResult, kind: string): Record<string, unknown> {
    const artifact = run.state.artifacts.find((item) => item.kind === kind);
    return isRecord(artifact?.data) ? artifact.data : {};
  }

  function findGoalAgentArtifact(run: GoalAgentRunResult, kind: AgentArtifact['kind']) {
    return run.state.artifacts.find((item) => item.kind === kind) ?? null;
  }

  function getGoalAgentExecutionRecovery(run: GoalAgentRunResult): Record<string, unknown> | null {
    const data = findGoalAgentArtifactData(run, 'execution_timeline');
    return isRecord(data.recovery) ? data.recovery : null;
  }

  function getOptionalNumber(data: Record<string, unknown>, key: string): number | null {
    const value = data[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function isEditableGoalEmpty() {
    return Boolean(
      !editableGoal.value.name.trim() &&
        !editableGoal.value.description.trim() &&
        !editableKeyResults.value.length &&
        !editableTaskTemplates.value.length &&
        !editableReminders.value.length,
    );
  }

  function syncEditableDraftFromGoalAgentRun(
    result: GoalAgentRunResult,
    options: { force: boolean },
  ) {
    if (
      !options.force ||
      (result.run.status !== 'waiting_approval' && result.run.status !== 'waiting_execution')
    ) {
      return;
    }

    const artifact = findGoalAgentArtifact(result, 'goal_draft');
    const goalData = isRecord(artifact?.data) ? artifact.data : null;
    if (!goalData) return;

    editableGoal.value = {
      name: getString(goalData, 'title') || artifact?.title || '',
      description: getString(goalData, 'description'),
      category: getString(goalData, 'category'),
      importance: normalizeImportance(getString(goalData, 'importance')),
      motivation: getString(goalData, 'motivation'),
      feasibilityAnalysis: getString(goalData, 'feasibilityAnalysis'),
      tags: getStringArray(goalData, 'tags'),
      startDate: getOptionalNumber(goalData, 'suggestedStartDate'),
      targetDate: getOptionalNumber(goalData, 'suggestedEndDate'),
    };
    editableKeyResults.value = (coerceKeyResults(goalData.keyResults) ?? []).map((item) => ({
      title: item.title,
      description: item.description ?? '',
      valueType: item.valueType,
      calculationMethod: item.calculationMethod,
      startValue: item.startValue,
      currentValue: item.currentValue,
      targetValue: item.targetValue,
      unit: item.unit,
      weight: item.weight,
    }));
    editableTaskTemplates.value = coerceTaskTemplates(goalData.taskTemplates);
    editableReminders.value = coerceReminders(goalData.reminders);
  }

  function buildEditedGoalDraftData(run: GoalAgentRunResult): Record<string, unknown> {
    const goalData = findGoalAgentArtifactData(run, 'goal_draft');
    const now = Date.now();
    const startDate = editableGoal.value.startDate ?? getNumber(goalData, 'suggestedStartDate', now);
    const targetDate =
      editableGoal.value.targetDate ?? getNumber(goalData, 'suggestedEndDate', startDate);

    return {
      ...goalData,
      title:
        editableGoal.value.name.trim() ||
        getString(goalData, 'title') ||
        options.conversationTitle.value,
      description:
        editableGoal.value.description.trim() ||
        getString(goalData, 'description') ||
        options.buildConversationTranscript(),
      motivation: editableGoal.value.motivation.trim() || undefined,
      category: normalizeGoalCategory(editableGoal.value.category),
      suggestedStartDate: startDate,
      suggestedEndDate: targetDate,
      importance: normalizeImportance(editableGoal.value.importance),
      tags: editableGoal.value.tags.map((item) => item.trim()).filter(Boolean),
      feasibilityAnalysis: editableGoal.value.feasibilityAnalysis.trim() || undefined,
      keyResults: editableKeyResults.value
        .filter((item) => item.title.trim())
        .map((item) => ({
          title: item.title.trim(),
          description: item.description.trim() || undefined,
          valueType: item.valueType,
          calculationMethod: item.calculationMethod,
          startValue: item.startValue,
          currentValue: item.currentValue,
          targetValue: item.targetValue,
          unit: item.unit.trim() || t('aiAssistant.goalDraft.unit'),
          weight: item.weight,
        })),
      taskTemplates: editableTaskTemplates.value
        .filter((item) => item.name.trim())
        .map((item) => ({
          name: item.name.trim(),
          description: item.description.trim() || undefined,
          importance: normalizeImportance(item.importance),
          cadence: normalizeCadence(item.cadence),
        })),
      reminders: editableReminders.value
        .filter((item) => item.title.trim())
        .map((item) => ({
          title: item.title.trim(),
          description: item.description.trim() || undefined,
          importance: normalizeImportance(item.importance),
          cadence: normalizeCadence(item.cadence),
          timeOfDay: normalizeReminderTimeOfDay(item.timeOfDay),
        })),
    };
  }

  function getGoalAgentActionPlanSummary(run: GoalAgentRunResult): string {
    const actionPlanData = findGoalAgentArtifactData(run, 'action_plan');
    return getString(actionPlanData, 'summary') || 'Execute approved Agent goal action plan.';
  }

  function buildEditedApprovedActions(run: GoalAgentRunResult): GoalAgentAction[] {
    const sourceActions = run.state.pendingActions.length
      ? run.state.pendingActions
      : run.state.approvedActions;
    const draftData = buildEditedGoalDraftData(run);
    const keyResults = Array.isArray(draftData.keyResults) ? draftData.keyResults : [];
    const taskTemplates = Array.isArray(draftData.taskTemplates) ? draftData.taskTemplates : [];
    const reminders = Array.isArray(draftData.reminders) ? draftData.reminders : [];
    const originalGoalAction = sourceActions.find((action) => action.tool === 'create_goal');
    const originalKeyResultActions = sourceActions.filter(
      (action) => action.tool === 'create_key_result',
    );
    const originalTaskTemplateActions = sourceActions.filter(
      (action) => action.tool === 'create_task_template',
    );
    const originalReminderActions = sourceActions.filter(
      (action) => action.tool === 'create_reminder',
    );

    return [
      {
        tool: 'create_goal',
        payload: draftData,
        rationale:
          originalGoalAction?.rationale ??
          'Create the approved goal draft after user confirmation.',
        index: 0,
        dependsOn: originalGoalAction?.dependsOn ?? [],
      },
      ...keyResults.map((payload, index) => {
        const originalAction =
          originalKeyResultActions.find((action) => action.index === index) ??
          originalKeyResultActions[index];
        return {
          tool: 'create_key_result' as const,
          payload: isRecord(payload) ? payload : {},
          rationale:
            originalAction?.rationale ??
            'Attach a measurable key result to the approved goal.',
          index,
          dependsOn: originalAction?.dependsOn ?? [0],
        };
      }),
      ...taskTemplates.map((payload, index) => {
        const originalAction =
          originalTaskTemplateActions.find((action) => action.index === index) ??
          originalTaskTemplateActions[index];
        return {
          tool: 'create_task_template' as const,
          payload: isRecord(payload) ? payload : {},
          rationale:
            originalAction?.rationale ??
            'Create a task template that supports the approved goal plan.',
          index,
          dependsOn: normalizeTaskTemplateDependsOn(index, keyResults.length),
        };
      }),
      ...reminders.map((payload, index) => {
        const originalAction =
          originalReminderActions.find((action) => action.index === index) ??
          originalReminderActions[index];
        return {
          tool: 'create_reminder' as const,
          payload: isRecord(payload) ? payload : {},
          rationale:
            originalAction?.rationale ??
            'Create a reminder for reviewing the approved goal.',
          index,
          dependsOn: [0],
        };
      }),
      ...sourceActions
        .filter(
          (action) =>
            action.tool !== 'create_goal' &&
            action.tool !== 'create_key_result' &&
            action.tool !== 'create_task_template' &&
            action.tool !== 'create_reminder',
        )
        .map((action) => ({
          ...action,
          dependsOn: normalizePreservedActionDependsOn(action, keyResults.length),
        })),
    ];
  }

  function normalizeTaskTemplateDependsOn(index: number, keyResultCount: number): number[] {
    return index < keyResultCount ? [0, index + 1] : [0];
  }

  function normalizePreservedActionDependsOn(
    action: GoalAgentAction,
    keyResultCount: number,
  ): number[] {
    if (action.tool === 'create_task_template') {
      return action.index < keyResultCount ? [0, action.index + 1] : [0];
    }
    if (action.tool === 'create_reminder') {
      return [0];
    }
    return action.dependsOn;
  }

  function buildEditedGoalAgentArtifacts(
    run: GoalAgentRunResult,
    approvedActions: GoalAgentAction[],
  ): AgentArtifact[] {
    const now = Date.now();
    const draftData = buildEditedGoalDraftData(run);
    const title = getString(draftData, 'title') || options.conversationTitle.value;
    return run.state.artifacts.map((artifact) => {
      if (artifact.kind === 'goal_draft') {
        return {
          ...artifact,
          title,
          data: draftData,
          updatedAt: now,
        };
      }
      if (artifact.kind === 'action_plan') {
        return {
          ...artifact,
          data: {
            ...artifact.data,
            summary: getGoalAgentActionPlanSummary(run),
            actions: approvedActions,
          },
          updatedAt: now,
        };
      }
      return artifact;
    });
  }

  function buildEditedGoalAgentApprovedPlan(
    run: GoalAgentRunResult,
    approvedActions: GoalAgentAction[],
  ): AgentActionPlan {
    const actionPlanData = findGoalAgentArtifactData(run, 'action_plan');
    return {
      summary: getGoalAgentActionPlanSummary(run),
      actions: approvedActions,
      warnings: getStringArray(actionPlanData, 'warnings'),
    };
  }

  function buildGoalAgentApprovalPayload(
    run: GoalAgentRunResult,
    userDecision: AgentResumePayload['userDecision'],
  ): AgentResumePayload {
    if (userDecision !== 'confirm') {
      return { userDecision };
    }

    const approvedActions = buildEditedApprovedActions(run);
    return {
      userDecision,
      approvedActions,
      editedArtifacts: buildEditedGoalAgentArtifacts(run, approvedActions),
      approvedPlan: buildEditedGoalAgentApprovedPlan(run, approvedActions),
    };
  }

  async function generateGoalDraftFromConversation() {
    goalDraftLoading.value = true;
    try {
      const response = await generateGoalDraft({
        service: options.service,
        selectedModel: options.selectedModel,
        buildConversationTranscript: options.buildConversationTranscript,
        conversationTitle: options.conversationTitle,
        hasWorkflowUserMessages: options.hasWorkflowUserMessages,
        goalClarification,
        canSubmitGoalClarification,
        clarificationAnswers,
      });

      if (!response) return;

      if (response.state === 'clarification') {
        applyGoalClarificationHelper(draftState, response.clarification);
      } else if (response.state === 'draft') {
        applyGoalDraftHelper(draftState, response);
        showGoalDraftEditor.value = false;
        await options.maybeRenameCurrentConversation(
          editableGoal.value.name || options.conversationTitle.value,
        );
        toast.success(t('aiAssistant.dialogs.generateGoal.draftGenerated'));
      } else {
        throw new Error('Goal draft generation returned an unexpected workflow state.');
      }
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.generateGoal.generateFailed'));
    } finally {
      goalDraftLoading.value = false;
    }
  }

  async function handlePlanGoalAutomation() {
    await handlePlanAutomation(handlerCtx, automationCtx);
  }

  async function handleExecuteGoalAutomation() {
    await handleExecuteAutomation(handlerCtx, automationCtx);
  }

  async function startGoalAgentRun() {
    if (!canRunGoalAgent.value) return;
    goalAgentLoading.value = true;
    try {
      const selectedModel = options.selectedModel.value;
      const request: AgentStartRunClientRequest = {
        runId: createAgentId('run'),
        threadId: createAgentId('thread'),
        conversationId: options.chatConversationId.value || null,
        agentType: 'goal.create',
        locale: locale.value === 'en-US' ? 'en-US' : 'zh-CN',
        input: {
          idea: options.buildConversationTranscript(),
          conversationTitle: options.conversationTitle.value,
          ...(selectedModel
            ? {
                provider_id: selectedModel.providerId,
                model: selectedModel.modelId,
              }
            : {}),
        },
      };

      const result = unwrap(await options.service.startAgentRun(request));
      syncGoalAgentRun(result);
      toast.success(t('aiAssistant.dialogs.agent.started'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.startFailed'));
    } finally {
      goalAgentLoading.value = false;
    }
  }

  async function resumeGoalAgentRun(userDecision: AgentResumePayload['userDecision']) {
    if (!goalAgentRun.value || goalAgentResuming.value) return;
    goalAgentResuming.value = true;
    try {
      const payload = buildGoalAgentApprovalPayload(goalAgentRun.value, userDecision);
      const result = unwrap(await options.service.resumeAgentRun(goalAgentRun.value.run.runId, payload));
      syncGoalAgentRun(result);
      toast.success(
        userDecision === 'cancel'
          ? t('aiAssistant.dialogs.agent.cancelled')
          : t('aiAssistant.dialogs.agent.resumed'),
      );
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      goalAgentResuming.value = false;
    }
  }

  async function submitGoalAgentClarification() {
    if (!goalAgentRun.value || !canResumeGoalAgentClarification.value) return;
    goalAgentResuming.value = true;
    try {
      const result = unwrap(await options.service.resumeAgentRun(goalAgentRun.value.run.runId, {
        userDecision: 'clarify',
        clarificationAnswers: clarificationAnswers.value.map((item) => item.trim()),
      }));
      syncGoalAgentRun(result);
      toast.success(t('aiAssistant.dialogs.agent.resumed'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      goalAgentResuming.value = false;
    }
  }

  async function continueGoalAgentExecution() {
    if (!canContinueGoalAgentExecution.value || !goalAgentRun.value) return;
    goalAgentResuming.value = true;
    try {
      const result = unwrap(await options.service.resumeAgentRun(goalAgentRun.value.run.runId, {
        userDecision: 'confirm',
      }));
      syncGoalAgentRun(result);
      toast.success(t('aiAssistant.dialogs.agent.resumed'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      goalAgentResuming.value = false;
    }
  }

  async function retryGoalAgentExecution() {
    if (!canRetryGoalAgentExecution.value || !goalAgentRun.value) return;
    goalAgentResuming.value = true;
    try {
      const result = unwrap(await options.service.resumeAgentRun(goalAgentRun.value.run.runId, {
        userDecision: 'confirm',
      }));
      syncGoalAgentRun(result);
      toast.success(t('aiAssistant.dialogs.agent.resumed'));
      options.scrollMessagesToBottom();
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.agent.resumeFailed'));
    } finally {
      goalAgentResuming.value = false;
    }
  }

  async function openAutomatedGoal() {
    if (!automatedGoalId.value) return;
    await router.push(`/goals/${automatedGoalId.value}`);
  }

  async function handleCreateGoalFromDraft() {
    if (!goalDraft.value) return;
    creatingGoal.value = true;
    try {
      const created = await options.createGoal(buildCreateGoalRequest(editableGoal.value));
      if (!created) {
        toast.error(t('aiAssistant.dialogs.generateGoal.createFailed'));
        return;
      }
      for (const item of editableKeyResults.value) {
        await options.addKeyResult(created.id, buildAddKeyResultRequest(created.id, item));
      }
      toast.success(t('aiAssistant.dialogs.generateGoal.created'));
      await router.push(`/goals/${created.id}`);
    } catch (error) {
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.generateGoal.createFailed'));
    } finally {
      creatingGoal.value = false;
    }
  }

  function addKeyResultDraft() {
    clearGoalEditingResult();
    const draft = createKeyResultDraft();
    draft.unit = t('aiAssistant.goalDraft.unit');
    editableKeyResults.value.push(draft);
  }

  function removeKeyResultDraft(index: number) {
    clearGoalEditingResult();
    editableKeyResults.value.splice(index, 1);
  }

  function updateKeyResultDraft(payload: {
    index: number;
    value: EditableKeyResult;
  }) {
    clearGoalEditingResult();
    editableKeyResults.value.splice(payload.index, 1, payload.value);
  }

  function handleUpdateGoalDraft(payload: EditableGoal) {
    clearGoalEditingResult();
    editableGoal.value = payload;
  }

  function addTaskTemplateDraft() {
    clearGoalEditingResult();
    editableTaskTemplates.value.push(createEmptyGoalTaskTemplateDraft());
  }

  function removeTaskTemplateDraft(index: number) {
    clearGoalEditingResult();
    editableTaskTemplates.value.splice(index, 1);
  }

  function updateTaskTemplateDraft(payload: {
    index: number;
    value: EditableGoalTaskTemplate;
  }) {
    clearGoalEditingResult();
    editableTaskTemplates.value.splice(payload.index, 1, payload.value);
  }

  function addReminderDraft() {
    clearGoalEditingResult();
    editableReminders.value.push(createEmptyGoalReminderDraft());
  }

  function removeReminderDraft(index: number) {
    clearGoalEditingResult();
    editableReminders.value.splice(index, 1);
  }

  function updateReminderDraft(payload: {
    index: number;
    value: EditableGoalReminder;
  }) {
    clearGoalEditingResult();
    editableReminders.value.splice(payload.index, 1, payload.value);
  }

  function clearGoalEditingResult() {
    if (goalAgentRun.value) {
      goalAutomationResult.value = null;
      return;
    }
    clearHelper(draftState);
  }

  function toggleGoalDraftEditor() {
    showGoalDraftEditor.value = !showGoalDraftEditor.value;
  }

  return {
    goalDraftLoading,
    goalWorkflowStage,
    goalDraft,
    goalClarification,
    goalAutomationResult,
    goalAgentRun,
    clarificationAnswers,
    showGoalDraftEditor,
    creatingGoal,
    automationLoading,
    automationExecuting,
    goalAgentLoading,
    goalAgentResuming,
    editableGoal,
    editableKeyResults,
    editableTaskTemplates,
    editableReminders,
    canSubmitGoalClarification,
    canRunGoalWorkflow,
    canPlanGoalAutomation,
    canRunGoalAgent,
    goalExecutedActions,
    goalExecutionSummary,
    goalExecutionRecovery,
    automatedGoalId,
    goalAgentPendingActions,
    goalAgentExecutedActions,
    goalAgentWaitingForClarification,
    goalAgentWaitingForApproval,
    goalAgentWaitingForExecution,
    canResumeGoalAgentClarification,
    canContinueGoalAgentExecution,
    canRetryGoalAgentExecution,
    applyGoalDraft: (nextDraft: GoalDraft) => applyGoalDraftHelper(draftState, nextDraft),
    applyGoalClarification: (next: GoalClarification) => applyGoalClarificationHelper(draftState, next),
    clearGoalAutomationResult: () => clearHelper(draftState),
    resetGoalArtifacts: () => {
      resetHelper(draftState);
      goalAgentRun.value = null;
    },
    generateGoalDraftFromConversation,
    handlePlanGoalAutomation,
    handleExecuteGoalAutomation,
    startGoalAgentRun,
    submitGoalAgentClarification,
    confirmGoalAgentRun: () => resumeGoalAgentRun('confirm'),
    cancelGoalAgentRun: () => resumeGoalAgentRun('cancel'),
    continueGoalAgentExecution,
    retryGoalAgentExecution,
    syncGoalAgentRun,
    openAutomatedGoal,
    handleCreateGoalFromDraft,
    addKeyResultDraft,
    removeKeyResultDraft,
    updateKeyResultDraft,
    handleUpdateGoalDraft,
    addTaskTemplateDraft,
    removeTaskTemplateDraft,
    updateTaskTemplateDraft,
    addReminderDraft,
    removeReminderDraft,
    updateReminderDraft,
    toggleGoalDraftEditor,
  };
}
