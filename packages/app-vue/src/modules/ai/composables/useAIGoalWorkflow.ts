import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import type { Ref } from 'vue';
import {
  KeyResultCalculationMethod,
  KeyResultValueType,
  type CreateGoalReq,
  type AddKeyResultReq,
} from '@dailyuse/contracts/goal';
import type { GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import {
  createEmptyGoalDraft,
  type AIChatService,
  type ChatItem,
  type ChatModelOption,
  type EditableGoal,
  type EditableKeyResult,
  type GoalAutomationResult,
  type GoalClarification,
  type GoalDraft,
  type GoalExecutedAction,
  type GoalWorkflowStage,
} from './types';
import { getAIErrorMessage } from './error';

export interface UseAIGoalWorkflowOptions {
  service: Pick<AIChatService, 'generateGoal'>;
  selectedModel: Ref<ChatModelOption | null>;
  chatLoading: Ref<boolean>;
  chatTimeline: Ref<ChatItem[]>;
  conversationTitle: Ref<string>;
  hasWorkflowUserMessages: Ref<boolean>;
  buildConversationTranscript: () => string;
  scrollMessagesToBottom: () => void;
  maybeRenameCurrentConversation: (name: string) => Promise<void>;
  createGoal: (req: CreateGoalReq) => Promise<{ id: string } | null>;
  addKeyResult: (goalId: string, req: AddKeyResultReq) => Promise<unknown>;
}

type GenerateGoalRequest = Parameters<UseAIGoalWorkflowOptions['service']['generateGoal']>[0];

export function useAIGoalWorkflow(options: UseAIGoalWorkflowOptions) {
  const { t } = useI18n();
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
  const editableGoal = ref<EditableGoal>(createEmptyGoalDraft());
  const editableKeyResults = ref<EditableKeyResult[]>([]);

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

  const goalExecutedActions = computed(() =>
    goalAutomationResult.value?.state === 'result' ? goalAutomationResult.value.executedActions : [],
  );
  const goalExecutionSummary = computed(() =>
    goalAutomationResult.value?.state === 'result' ? goalAutomationResult.value.executionSummary : null,
  );
  const goalExecutionRecovery = computed(() =>
    goalAutomationResult.value?.state === 'result' ? goalAutomationResult.value.recovery : null,
  );
  const automatedGoalId = computed(
    () => goalExecutedActions.value.find((action) => action.tool === 'create_goal')?.entityId ?? '',
  );

  function applyGoalDraft(nextDraft: GoalDraft) {
    goalWorkflowStage.value = 'draft';
    goalClarification.value = null;
    goalAutomationResult.value = null;
    clarificationAnswers.value = [];
    goalDraft.value = nextDraft;

    editableGoal.value = {
      name: nextDraft.goal.title ?? '',
      description: nextDraft.goal.description,
      category: nextDraft.goal.category,
      importance: nextDraft.goal.importance || ImportanceLevel.Moderate,
      motivation: nextDraft.goal.motivation ?? '',
      feasibilityAnalysis: nextDraft.goal.feasibilityAnalysis ?? '',
      tags: [...(nextDraft.goal.tags ?? [])],
      startDate: nextDraft.goal.suggestedStartDate ?? null,
      targetDate: nextDraft.goal.suggestedEndDate ?? null,
    };
    editableKeyResults.value =
      nextDraft.keyResults?.map((item) => ({
        title: item.title,
        description: item.description ?? '',
        valueType: item.valueType || KeyResultValueType.Incremental,
        calculationMethod:
          item.calculationMethod ||
          (item.valueType === KeyResultValueType.Incremental
            ? KeyResultCalculationMethod.Sum
            : KeyResultCalculationMethod.Last),
        startValue: item.startValue ?? 0,
        currentValue: item.currentValue ?? item.startValue ?? 0,
        targetValue: item.targetValue,
        unit: item.unit,
        weight: item.weight ?? 1,
      })) ?? [];
  }

  function applyGoalClarification(nextClarification: GoalClarification) {
    goalWorkflowStage.value = 'clarification';
    goalDraft.value = null;
    goalAutomationResult.value = null;
    showGoalDraftEditor.value = false;
    editableGoal.value = createEmptyGoalDraft();
    editableKeyResults.value = [];
    goalClarification.value = nextClarification;
    clarificationAnswers.value = nextClarification.questions.map(
      (_, index) => clarificationAnswers.value[index] ?? '',
    );
  }

  function clearGoalAutomationResult() {
    goalAutomationResult.value = null;
    goalWorkflowStage.value = goalDraft.value
      ? 'draft'
      : goalClarification.value
        ? 'clarification'
        : 'collect';
  }

  function resetGoalArtifacts() {
    goalWorkflowStage.value = 'collect';
    goalDraft.value = null;
    goalClarification.value = null;
    goalAutomationResult.value = null;
    clarificationAnswers.value = [];
    showGoalDraftEditor.value = false;
    editableGoal.value = createEmptyGoalDraft();
    editableKeyResults.value = [];
  }

  async function generateGoalDraftFromConversation() {
    if (!options.selectedModel.value) return;
    if (!goalClarification.value && !options.hasWorkflowUserMessages.value) return;
    if (goalClarification.value && !canSubmitGoalClarification.value) return;

    goalDraftLoading.value = true;
    try {
      const response = (await options.service.generateGoal({
        idea: options.buildConversationTranscript(),
        includeKeyResults: true,
        providerId: options.selectedModel.value.providerId as GenerateGoalRequest['providerId'],
        model: options.selectedModel.value.modelId,
        clarificationAnswers: goalClarification.value
          ? clarificationAnswers.value.map((item) => item.trim())
          : undefined,
      })) as GenerateGoalsRes;

      if (response.state === 'clarification') {
        applyGoalClarification(response.clarification);
      } else if (response.state === 'draft') {
        applyGoalDraft(response);
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
    if (!options.selectedModel.value || !goalDraft.value) return;
    goalWorkflowStage.value = 'plan';
    automationLoading.value = true;
    try {
      const response = (await options.service.generateGoal({
        idea: options.buildConversationTranscript(),
        command: 'prepare',
        includeKeyResults: true,
        includeTaskTemplates: true,
        draftContext: {
          goal: {
            title:
              editableGoal.value.name ||
              goalDraft.value.goal.title ||
              options.conversationTitle.value,
            description: editableGoal.value.description,
            category: editableGoal.value.category || undefined,
            importance: editableGoal.value.importance,
            motivation: editableGoal.value.motivation || undefined,
            feasibilityAnalysis: editableGoal.value.feasibilityAnalysis || undefined,
            tags: editableGoal.value.tags.length ? editableGoal.value.tags : undefined,
            suggestedStartDate: editableGoal.value.startDate ?? undefined,
            suggestedEndDate: editableGoal.value.targetDate ?? undefined,
          },
          keyResults: editableKeyResults.value.length
            ? editableKeyResults.value.map((item) => ({
                title: item.title,
                description: item.description || undefined,
                valueType: item.valueType,
                calculationMethod: item.calculationMethod,
                startValue: item.startValue,
                currentValue: item.currentValue,
                targetValue: item.targetValue,
                unit: item.unit,
                weight: item.weight,
              }))
            : undefined,
        },
        providerId: options.selectedModel.value.providerId as GenerateGoalRequest['providerId'],
        model: options.selectedModel.value.modelId,
      })) as GenerateGoalsRes;

      if (response.state !== 'confirm' && response.state !== 'result') {
        throw new Error('Goal automation planning returned an unexpected workflow state.');
      }
      goalAutomationResult.value = response;
      goalWorkflowStage.value = response.state === 'result' ? 'result' : 'confirm';
      toast.success(t('aiAssistant.dialogs.automation.planReady'));
      options.scrollMessagesToBottom();
    } catch (error) {
      goalWorkflowStage.value = goalDraft.value ? 'draft' : 'collect';
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.automation.planFailed'));
    } finally {
      automationLoading.value = false;
    }
  }

  async function handleExecuteGoalAutomation() {
    if (!options.selectedModel.value || !goalAutomationResult.value) return;
    goalWorkflowStage.value = 'execute';
    automationExecuting.value = true;
    try {
      const response = (await options.service.generateGoal({
        idea: options.buildConversationTranscript(),
        command: 'execute',
        includeKeyResults: true,
        includeTaskTemplates: true,
        draftContext: {
          goal: {
            title:
              editableGoal.value.name ||
              goalDraft.value?.goal.title ||
              options.conversationTitle.value,
            description: editableGoal.value.description,
            category: editableGoal.value.category || undefined,
            importance: editableGoal.value.importance,
            motivation: editableGoal.value.motivation || undefined,
            feasibilityAnalysis: editableGoal.value.feasibilityAnalysis || undefined,
            tags: editableGoal.value.tags.length ? editableGoal.value.tags : undefined,
            suggestedStartDate: editableGoal.value.startDate ?? undefined,
            suggestedEndDate: editableGoal.value.targetDate ?? undefined,
          },
          keyResults: editableKeyResults.value.length
            ? editableKeyResults.value.map((item) => ({
                title: item.title,
                description: item.description || undefined,
                valueType: item.valueType,
                calculationMethod: item.calculationMethod,
                startValue: item.startValue,
                currentValue: item.currentValue,
                targetValue: item.targetValue,
                unit: item.unit,
                weight: item.weight,
              }))
            : undefined,
        },
        approvedSummary: goalAutomationResult.value.summary,
        approvedPlan: goalAutomationResult.value.plan,
        approvedActions: goalAutomationResult.value.actions,
        providerId: options.selectedModel.value.providerId as GenerateGoalRequest['providerId'],
        model: options.selectedModel.value.modelId,
      })) as GenerateGoalsRes;

      if (response.state !== 'result') {
        throw new Error('Goal automation execution returned an unexpected workflow state.');
      }
      goalAutomationResult.value = response;
      goalWorkflowStage.value = 'result';
      toast.success(t('aiAssistant.dialogs.automation.executed'));
      options.scrollMessagesToBottom();
    } catch (error) {
      goalWorkflowStage.value = goalAutomationResult.value
        ? 'confirm'
        : goalDraft.value
          ? 'draft'
          : 'collect';
      toast.error(getAIErrorMessage(error, t, 'aiAssistant.dialogs.automation.executeFailed'));
    } finally {
      automationExecuting.value = false;
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
      const created = await options.createGoal({
        name: editableGoal.value.name,
        description: editableGoal.value.description,
        category: editableGoal.value.category || undefined,
        importance: editableGoal.value.importance,
        motivation: editableGoal.value.motivation || undefined,
        feasibilityAnalysis: editableGoal.value.feasibilityAnalysis || undefined,
        tags: editableGoal.value.tags.length ? editableGoal.value.tags : undefined,
        startDate: editableGoal.value.startDate ?? undefined,
        targetDate: editableGoal.value.targetDate ?? undefined,
      });

      if (!created) {
        toast.error(t('aiAssistant.dialogs.generateGoal.createFailed'));
        return;
      }

      for (const item of editableKeyResults.value) {
        await options.addKeyResult(created.id, {
          goalId: created.id as never,
          title: item.title,
          description: item.description || undefined,
          valueType: item.valueType,
          calculationMethod: item.calculationMethod,
          startValue: item.startValue,
          targetValue: item.targetValue,
          currentValue: item.currentValue,
          unit: item.unit || undefined,
          weight: item.weight,
        });
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
    clearGoalAutomationResult();
    editableKeyResults.value.push({
      title: '',
      description: '',
      valueType: KeyResultValueType.Incremental,
      calculationMethod: KeyResultCalculationMethod.Sum,
      startValue: 0,
      currentValue: 0,
      targetValue: 1,
      unit: t('aiAssistant.goalDraft.unit'),
      weight: 1,
    });
  }

  function removeKeyResultDraft(index: number) {
    clearGoalAutomationResult();
    editableKeyResults.value.splice(index, 1);
  }

  function updateKeyResultDraft(payload: {
    index: number;
    value: EditableKeyResult;
  }) {
    clearGoalAutomationResult();
    editableKeyResults.value.splice(payload.index, 1, payload.value);
  }

  function handleUpdateGoalDraft(payload: EditableGoal) {
    clearGoalAutomationResult();
    editableGoal.value = payload;
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
    clarificationAnswers,
    showGoalDraftEditor,
    creatingGoal,
    automationLoading,
    automationExecuting,
    editableGoal,
    editableKeyResults,
    canSubmitGoalClarification,
    canRunGoalWorkflow,
    canPlanGoalAutomation,
    goalExecutedActions,
    goalExecutionSummary,
    goalExecutionRecovery,
    automatedGoalId,
    applyGoalDraft,
    applyGoalClarification,
    clearGoalAutomationResult,
    resetGoalArtifacts,
    generateGoalDraftFromConversation,
    handlePlanGoalAutomation,
    handleExecuteGoalAutomation,
    openAutomatedGoal,
    handleCreateGoalFromDraft,
    addKeyResultDraft,
    removeKeyResultDraft,
    updateKeyResultDraft,
    handleUpdateGoalDraft,
    toggleGoalDraftEditor,
  };
}
