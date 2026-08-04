/**
 * Goal binding policy for TaskTemplate.
 *
 * Pure functions that handle goal linking/binding operations.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import type {
  TaskGoalBindingTrigger as TaskGoalBindingTriggerValue,
} from '@memoflow/contracts/task';
import { TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import { TaskTemplateStatus } from '../../domain/value-objects/task-template-status';
import { TaskType } from '../value-objects';
import { TaskGoalBinding, type RecurrenceRule } from '../value-objects';
import {
  TaskTemplateArchivedError,
  InvalidGoalBindingError,
} from '../value-objects/task-errors';
import type { TaskTemplateProps } from './task-template.state';

/** Mutable context for goal operations. */
export interface GoalOperationContext {
  props: TaskTemplateProps;
  readonly id: string;
  addHistory(action: string, changes?: unknown): void;
}

/** Whole-plan progress is meaningful only when the task has a closed execution scope. */
export function isFiniteTaskPlan(
  taskType: TaskType,
  recurrenceRule: RecurrenceRule | null | undefined,
): boolean {
  return taskType === TaskType.OneTime || Boolean(recurrenceRule?.hasEndCondition);
}

/** Binds the template to a goal. */
export function bindToGoal(
  ctx: GoalOperationContext,
  goalId: string,
  keyResultId: string,
  goalRecordValue?: number,
  progressTrigger: TaskGoalBindingTriggerValue = TaskGoalBindingTrigger.PerInstance,
): void {
  if (!goalId || !keyResultId) {
    throw new InvalidGoalBindingError('Goal ID and Key Result ID are required');
  }
  if (ctx.props.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.id);
  }
  if (ctx.props.goalBinding) {
    throw new InvalidGoalBindingError('Template is already bound to a goal');
  }
  if (
    progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted &&
    !isFiniteTaskPlan(ctx.props.taskType, ctx.props.recurrenceRule)
  ) {
    throw new InvalidGoalBindingError(
      'Whole-plan goal progress requires a finite task plan',
    );
  }

  ctx.props.goalBinding = TaskGoalBinding.create({
    goalId: goalId as TaskGoalBinding['goalId'],
    keyResultId: keyResultId as TaskGoalBinding['keyResultId'],
    goalRecordValue: goalRecordValue ?? 1,
    progressTrigger,
  });
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('goal_bound', { goalId, keyResultId, goalRecordValue, progressTrigger });
}

/** Unbinds from the current goal. */
export function unbindFromGoal(ctx: GoalOperationContext): void {
  if (!ctx.props.goalBinding) {
    throw new InvalidGoalBindingError('Template is not bound to any goal');
  }
  if (ctx.props.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.id);
  }

  const { goalId: oldGoalId, keyResultId: oldKeyResultId } = ctx.props.goalBinding;
  ctx.props.goalBinding = null;
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('goal_unbound', { oldGoalId, oldKeyResultId });
}

/** Checks whether the template is linked to a goal. */
export function isLinkedToGoal(props: TaskTemplateProps): boolean {
  return props.goalBinding !== null;
}
