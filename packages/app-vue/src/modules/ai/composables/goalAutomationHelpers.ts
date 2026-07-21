/**
 * Goal automation helper functions.
 *
 * Extracted from useAIGoalWorkflow.ts to reduce composable size.
 */

import type { Ref } from 'vue';
import type {
  GenerateGoalsReq,
  GenerateGoalsRes,
} from '@dailyuse/contracts/ai';
import type {
  AIChatService,
  ChatModelOption,
  EditableGoal,
  EditableKeyResult,
  GoalAutomationResult,
  GoalDraft,
  GoalWorkflowStage,
} from './types';
import { unwrap } from '@dailyuse/contracts/result';

/** Context for automation operations. */
export interface AutomationContext {
  service: Pick<AIChatService, 'generateGoal'>;
  selectedModel: Ref<ChatModelOption | null>;
  buildConversationTranscript: () => string;
  conversationTitle: Ref<string>;
  scrollMessagesToBottom: () => void;
}

/** Context for generateGoalDraftFromConversation. */
export interface GenerateDraftContext {
  service: Pick<AIChatService, 'generateGoal'>;
  selectedModel: Ref<ChatModelOption | null>;
  buildConversationTranscript: () => string;
  conversationTitle: Ref<string>;
  hasWorkflowUserMessages: Ref<boolean>;
  goalClarification: Ref<import('./types').GoalClarification | null>;
  canSubmitGoalClarification: Ref<boolean>;
  clarificationAnswers: Ref<string[]>;
}

/** Generates a goal draft from the current conversation state. Returns the raw response. */
export async function generateGoalDraft(
  ctx: GenerateDraftContext,
): Promise<GenerateGoalsRes | null> {
  if (!ctx.selectedModel.value) return null;
  if (!ctx.goalClarification.value && !ctx.hasWorkflowUserMessages.value) return null;
  if (ctx.goalClarification.value && !ctx.canSubmitGoalClarification.value) return null;

  return unwrap(
    await ctx.service.generateGoal({
      idea: ctx.buildConversationTranscript(),
      includeKeyResults: true,
      providerId: ctx.selectedModel.value.providerId as GenerateGoalsReq['providerId'],
      model: ctx.selectedModel.value.modelId,
      clarificationAnswers: ctx.goalClarification.value
        ? ctx.clarificationAnswers.value.map((item) => item.trim())
        : undefined,
    }),
  );
}

/** Builds the draft context for automation requests. */
export function buildDraftContext(
  editableGoal: EditableGoal,
  editableKeyResults: EditableKeyResult[],
  goalDraft: GoalDraft | null,
  conversationTitle: string,
): GenerateGoalsReq['draftContext'] {
  return {
    goal: {
      title: editableGoal.name || goalDraft?.goal.title || conversationTitle,
      description: editableGoal.description,
      category: editableGoal.category || undefined,
      importance: editableGoal.importance,
      motivation: editableGoal.motivation || undefined,
      feasibilityAnalysis: editableGoal.feasibilityAnalysis || undefined,
      tags: editableGoal.tags.length ? editableGoal.tags : undefined,
      suggestedStartDate: editableGoal.startDate ?? undefined,
      suggestedEndDate: editableGoal.targetDate ?? undefined,
    },
    keyResults: editableKeyResults.length
      ? editableKeyResults.map((item) => ({
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
  };
}

/** Plans goal automation. Returns the result or throws. */
export async function planGoalAutomation(
  ctx: AutomationContext,
  draftContext: GenerateGoalsReq['draftContext'],
): Promise<{ result: GoalAutomationResult; stage: 'confirm' | 'result' }> {
  const response = unwrap(
    await ctx.service.generateGoal({
      idea: ctx.buildConversationTranscript(),
      command: 'prepare',
      includeKeyResults: true,
      includeTaskTemplates: true,
      draftContext,
      providerId: ctx.selectedModel.value?.providerId as GenerateGoalsReq['providerId'],
      model: ctx.selectedModel.value?.modelId,
    }),
  );

  if (response.state !== 'confirm' && response.state !== 'result') {
    throw new Error('Goal automation planning returned an unexpected workflow state.');
  }

  return {
    result: response,
    stage: response.state === 'result' ? 'result' : 'confirm',
  };
}

/** Executes goal automation. Returns the result or throws. */
export async function executeGoalAutomation(
  ctx: AutomationContext,
  draftContext: GenerateGoalsReq['draftContext'],
  approvedSummary: string,
  approvedPlan: NonNullable<GoalAutomationResult['plan']>,
  approvedActions: NonNullable<GoalAutomationResult['actions']>,
): Promise<GoalAutomationResult> {
  const response = unwrap(
    await ctx.service.generateGoal({
      idea: ctx.buildConversationTranscript(),
      command: 'execute',
      includeKeyResults: true,
      includeTaskTemplates: true,
      draftContext,
      approvedSummary,
      approvedPlan,
      approvedActions,
      providerId: ctx.selectedModel.value?.providerId as GenerateGoalsReq['providerId'],
      model: ctx.selectedModel.value?.modelId,
    }),
  );

  if (response.state !== 'result') {
    throw new Error('Goal automation execution returned an unexpected workflow state.');
  }

  return response;
}

/** Context for automation handler operations. */
export interface AutomationHandlerContext {
  selectedModel: Ref<ChatModelOption | null>;
  goalDraft: Ref<GoalDraft | null>;
  goalAutomationResult: Ref<GoalAutomationResult | null>;
  goalWorkflowStage: { value: GoalWorkflowStage };
  automationLoading: Ref<boolean>;
  automationExecuting: Ref<boolean>;
  buildCurrentDraftContext: () => GenerateGoalsReq['draftContext'];
  scrollMessagesToBottom: () => void;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
  translate: (key: string) => string;
  getAIErrorMessage: (error: unknown, t: (key: string) => string, fallback: string) => string;
}

/** Handles the plan automation flow with loading/error management. */
export async function handlePlanAutomation(
  ctx: AutomationHandlerContext,
  automationCtx: AutomationContext,
): Promise<void> {
  if (!ctx.selectedModel.value || !ctx.goalDraft.value) return;
  ctx.goalWorkflowStage.value = 'plan';
  ctx.automationLoading.value = true;
  try {
    const { result, stage } = await planGoalAutomation(automationCtx, ctx.buildCurrentDraftContext());
    ctx.goalAutomationResult.value = result;
    ctx.goalWorkflowStage.value = stage;
    ctx.toastSuccess(ctx.translate('aiAssistant.dialogs.automation.planReady'));
    ctx.scrollMessagesToBottom();
  } catch (error) {
    ctx.goalWorkflowStage.value = ctx.goalDraft.value ? 'draft' : 'collect';
    ctx.toastError(ctx.getAIErrorMessage(error, ctx.translate, 'aiAssistant.dialogs.automation.planFailed'));
  } finally {
    ctx.automationLoading.value = false;
  }
}

/** Handles the execute automation flow with loading/error management. */
export async function handleExecuteAutomation(
  ctx: AutomationHandlerContext,
  automationCtx: AutomationContext,
): Promise<void> {
  if (!ctx.selectedModel.value || !ctx.goalAutomationResult.value) return;
  ctx.goalWorkflowStage.value = 'execute';
  ctx.automationExecuting.value = true;
  try {
    const result = await executeGoalAutomation(
      automationCtx,
      ctx.buildCurrentDraftContext(),
      ctx.goalAutomationResult.value.summary,
      ctx.goalAutomationResult.value.plan,
      ctx.goalAutomationResult.value.actions,
    );
    ctx.goalAutomationResult.value = result;
    ctx.goalWorkflowStage.value = 'result';
    ctx.toastSuccess(ctx.translate('aiAssistant.dialogs.automation.executed'));
    ctx.scrollMessagesToBottom();
  } catch (error) {
    ctx.goalWorkflowStage.value = ctx.goalAutomationResult.value
      ? 'confirm'
      : ctx.goalDraft.value
        ? 'draft'
        : 'collect';
    ctx.toastError(ctx.getAIErrorMessage(error, ctx.translate, 'aiAssistant.dialogs.automation.executeFailed'));
  } finally {
    ctx.automationExecuting.value = false;
  }
}
