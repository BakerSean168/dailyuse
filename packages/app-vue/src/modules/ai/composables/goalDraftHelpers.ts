/**
 * Goal draft helper functions.
 *
 * Extracted from useAIGoalWorkflow.ts to reduce composable size.
 */

import {
  KeyResultCalculationMethod,
  KeyResultValueType,
  type AddKeyResultReq,
  type CreateGoalReq,
} from '@memoflow/contracts/goal';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import type {
  GoalClarificationDTO,
  GoalWorkflowDraftResultDTO,
} from '@memoflow/contracts/ai';
import {
  createEmptyGoalDraft,
  type EditableGoal,
  type EditableKeyResult,
  type EditableGoalReminder,
  type EditableGoalTaskTemplate,
  type GoalAutomationResult,
  type GoalWorkflowStage,
} from './types';

/** Mutable state for goal workflow operations. */
export interface GoalDraftState {
  goalWorkflowStage: GoalWorkflowStage;
  goalDraft: GoalWorkflowDraftResultDTO | null;
  goalClarification: GoalClarificationDTO | null;
  goalAutomationResult: GoalAutomationResult | null;
  clarificationAnswers: string[];
  showGoalDraftEditor: boolean;
  editableGoal: EditableGoal;
  editableKeyResults: EditableKeyResult[];
  editableTaskTemplates: EditableGoalTaskTemplate[];
  editableReminders: EditableGoalReminder[];
}

/** Vue refs that back the GoalDraftState proxy. */
export interface GoalDraftRefs {
  goalWorkflowStage: import('vue').Ref<GoalWorkflowStage>;
  goalDraft: import('vue').Ref<GoalWorkflowDraftResultDTO | null>;
  goalClarification: import('vue').Ref<GoalClarificationDTO | null>;
  goalAutomationResult: import('vue').Ref<GoalAutomationResult | null>;
  clarificationAnswers: import('vue').Ref<string[]>;
  showGoalDraftEditor: import('vue').Ref<boolean>;
  editableGoal: import('vue').Ref<EditableGoal>;
  editableKeyResults: import('vue').Ref<EditableKeyResult[]>;
  editableTaskTemplates: import('vue').Ref<EditableGoalTaskTemplate[]>;
  editableReminders: import('vue').Ref<EditableGoalReminder[]>;
}

/** Creates a GoalDraftState proxy that bridges Vue refs to a plain mutable object. */
export function createDraftStateProxy(refs: GoalDraftRefs): GoalDraftState {
  return {
    get goalWorkflowStage() { return refs.goalWorkflowStage.value; },
    set goalWorkflowStage(v: GoalWorkflowStage) { refs.goalWorkflowStage.value = v; },
    get goalDraft() { return refs.goalDraft.value; },
    set goalDraft(v) { refs.goalDraft.value = v; },
    get goalClarification() { return refs.goalClarification.value; },
    set goalClarification(v) { refs.goalClarification.value = v; },
    get goalAutomationResult() { return refs.goalAutomationResult.value; },
    set goalAutomationResult(v) { refs.goalAutomationResult.value = v; },
    get clarificationAnswers() { return refs.clarificationAnswers.value; },
    set clarificationAnswers(v) { refs.clarificationAnswers.value = v; },
    get showGoalDraftEditor() { return refs.showGoalDraftEditor.value; },
    set showGoalDraftEditor(v) { refs.showGoalDraftEditor.value = v; },
    get editableGoal() { return refs.editableGoal.value; },
    set editableGoal(v) { refs.editableGoal.value = v; },
    get editableKeyResults() { return refs.editableKeyResults.value; },
    set editableKeyResults(v) { refs.editableKeyResults.value = v; },
    get editableTaskTemplates() { return refs.editableTaskTemplates.value; },
    set editableTaskTemplates(v) { refs.editableTaskTemplates.value = v; },
    get editableReminders() { return refs.editableReminders.value; },
    set editableReminders(v) { refs.editableReminders.value = v; },
  };
}

/** Applies a goal draft to the workflow state. */
export function applyGoalDraft(state: GoalDraftState, nextDraft: GoalWorkflowDraftResultDTO): void {
  state.goalWorkflowStage = 'draft';
  state.goalClarification = null;
  state.goalAutomationResult = null;
  state.clarificationAnswers = [];
  state.goalDraft = nextDraft;

  state.editableGoal = {
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
  state.editableKeyResults =
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
  state.editableTaskTemplates = [];
  state.editableReminders = [];
}

/** Applies a goal clarification to the workflow state. */
export function applyGoalClarification(
  state: GoalDraftState,
  nextClarification: GoalClarificationDTO,
): void {
  state.goalWorkflowStage = 'clarification';
  state.goalDraft = null;
  state.goalAutomationResult = null;
  state.showGoalDraftEditor = false;
  state.editableGoal = createEmptyGoalDraft();
  state.editableKeyResults = [];
  state.editableTaskTemplates = [];
  state.editableReminders = [];
  state.goalClarification = nextClarification;
  state.clarificationAnswers = nextClarification.questions.map(
    (_, index) => state.clarificationAnswers[index] ?? '',
  );
}

/** Clears automation result and reverts to the appropriate stage. */
export function clearGoalAutomationResult(state: GoalDraftState): void {
  state.goalAutomationResult = null;
  state.goalWorkflowStage = state.goalDraft
    ? 'draft'
    : state.goalClarification
      ? 'clarification'
      : 'collect';
}

/** Resets all goal workflow artifacts. */
export function resetGoalArtifacts(state: GoalDraftState): void {
  state.goalWorkflowStage = 'collect';
  state.goalDraft = null;
  state.goalClarification = null;
  state.goalAutomationResult = null;
  state.clarificationAnswers = [];
  state.showGoalDraftEditor = false;
  state.editableGoal = createEmptyGoalDraft();
  state.editableKeyResults = [];
  state.editableTaskTemplates = [];
  state.editableReminders = [];
}

/** Creates a key result draft with defaults. */
export function createKeyResultDraft(): EditableKeyResult {
  return {
    title: '',
    description: '',
    valueType: KeyResultValueType.Incremental,
    calculationMethod: KeyResultCalculationMethod.Sum,
    startValue: 0,
    currentValue: 0,
    targetValue: 1,
    unit: '',
    weight: 1,
  };
}

/** Builds a CreateGoalReq from editable state. */
export function buildCreateGoalRequest(editableGoal: EditableGoal): CreateGoalReq {
  return {
    name: editableGoal.name,
    description: editableGoal.description,
    category: editableGoal.category || undefined,
    importance: editableGoal.importance,
    motivation: editableGoal.motivation || undefined,
    feasibilityAnalysis: editableGoal.feasibilityAnalysis || undefined,
    tags: editableGoal.tags.length ? editableGoal.tags : undefined,
    startDate: editableGoal.startDate ?? undefined,
    targetDate: editableGoal.targetDate ?? undefined,
  };
}

/** Builds an AddKeyResultReq from editable state. */
export function buildAddKeyResultRequest(
  goalId: string,
  item: EditableKeyResult,
): AddKeyResultReq {
  return {
    goalId: goalId as never,
    title: item.title,
    description: item.description || undefined,
    valueType: item.valueType,
    calculationMethod: item.calculationMethod,
    startValue: item.startValue,
    targetValue: item.targetValue,
    currentValue: item.currentValue,
    unit: item.unit || undefined,
    weight: item.weight,
  };
}
