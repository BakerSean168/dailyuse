import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import {
  createEmptyGoalDraft,
  type EditableGoal,
  type EditableKeyResult,
  type GoalAutomationResult,
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
    clearHelper(draftState);
    const draft = createKeyResultDraft();
    draft.unit = t('aiAssistant.goalDraft.unit');
    editableKeyResults.value.push(draft);
  }

  function removeKeyResultDraft(index: number) {
    clearHelper(draftState);
    editableKeyResults.value.splice(index, 1);
  }

  function updateKeyResultDraft(payload: {
    index: number;
    value: EditableKeyResult;
  }) {
    clearHelper(draftState);
    editableKeyResults.value.splice(payload.index, 1, payload.value);
  }

  function handleUpdateGoalDraft(payload: EditableGoal) {
    clearHelper(draftState);
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
    applyGoalDraft: (nextDraft: GoalDraft) => applyGoalDraftHelper(draftState, nextDraft),
    applyGoalClarification: (next: GoalClarification) => applyGoalClarificationHelper(draftState, next),
    clearGoalAutomationResult: () => clearHelper(draftState),
    resetGoalArtifacts: () => resetHelper(draftState),
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
