/**
 * Goal binding policy for TaskTemplate.
 *
 * Pure functions that handle goal linking/binding operations.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import type {
  TaskGoalBindingTrigger as TaskGoalBindingTriggerValue,
} from '@dailyuse/contracts/task';
import { TaskGoalBindingTrigger } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '../../domain/value-objects/task-template-status';
import { TaskType } from '../value-objects';
import { TaskGoalBinding } from '../value-objects';
import {
  InvalidTaskTemplateStateError,
  TaskTemplateArchivedError,
  InvalidGoalBindingError,
} from '../value-objects/task-errors';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';
import type { TaskTemplateProps } from './task-template.state';

/** Mutable context for goal operations. */
export interface GoalOperationContext {
  props: TaskTemplateProps;
  readonly id: string;
  addHistory(action: string, changes?: unknown): void;
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
  if (ctx.props.goalId || ctx.props.goalBinding) {
    throw new InvalidGoalBindingError('Template is already bound to a goal');
  }

  ctx.props.goalId = goalId as GoalId;
  ctx.props.keyResultId = keyResultId as KeyResultId;
  ctx.props.goalBinding = TaskGoalBinding.fromDTO({
    goalId: goalId as GoalId,
    keyResultId: keyResultId as KeyResultId,
    goalRecordValue: goalRecordValue ?? 1,
    progressTrigger,
  });
  ctx.props.updatedAt = new Date();
  ctx.addHistory('goal_bound', { goalId, keyResultId, goalRecordValue, progressTrigger });
}

/** Unbinds from the current goal. */
export function unbindFromGoal(ctx: GoalOperationContext): void {
  if (!ctx.props.goalId && !ctx.props.goalBinding) {
    throw new InvalidGoalBindingError('Template is not bound to any goal');
  }
  if (ctx.props.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.id);
  }

  const oldGoalId = ctx.props.goalId;
  const oldKeyResultId = ctx.props.keyResultId;
  ctx.props.goalBinding = null;
  ctx.props.goalId = null;
  ctx.props.keyResultId = null;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('goal_unbound', { oldGoalId, oldKeyResultId });
}

/** Checks whether the template is linked to a goal. */
export function isLinkedToGoal(props: TaskTemplateProps): boolean {
  return props.goalId !== null || props.goalBinding !== null;
}

/** Links to a goal (OneTime tasks only). */
export function linkToGoal(ctx: GoalOperationContext, goalId: string, keyResultId?: string): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can be linked to goals', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'linkToGoal',
    });
  }
  if (ctx.props.goalId) {
    throw new InvalidTaskTemplateStateError('Task is already linked to a goal', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'linkToGoal',
    });
  }
  if (ctx.props.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.id);
  }

  if (keyResultId) {
    bindToGoal(ctx, goalId, keyResultId);
  } else {
    if (!goalId) {
      throw new InvalidGoalBindingError('Goal ID is required');
    }
    ctx.props.goalId = goalId as GoalId;
    ctx.props.keyResultId = null;
    ctx.props.updatedAt = new Date();
    ctx.addHistory('linked_to_goal', { goalId, keyResultId });
  }
}

/** Unlinks from the current goal (OneTime tasks only). */
export function unlinkFromGoal(ctx: GoalOperationContext): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can be unlinked from goals', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'unlinkFromGoal',
    });
  }
  if (!ctx.props.goalId) {
    throw new InvalidTaskTemplateStateError('Task is not linked to any goal', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'unlinkFromGoal',
    });
  }
  unbindFromGoal(ctx);
}
