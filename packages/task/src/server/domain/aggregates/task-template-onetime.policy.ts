/**
 * OneTime task operations policy for TaskTemplate.
 *
 * Pure functions for priority calculation, subtask management, and dependency tracking.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import { PriorityLevel } from '@memoflow/contracts/shared';
import { TaskType } from '../value-objects';
import { DependencyStatus } from '../value-objects';
import { InvalidTaskTemplateStateError } from '../value-objects/task-errors';
import { calculateTaskPriority } from '../services/priority-calculator.service';
import type { TaskTemplateId } from '../../domain/value-objects/task-template-id';
import type { TaskTemplateProps } from './task-template.state';

/** Context for OneTime operations. */
export interface OneTimeOperationContext {
  readonly id: TaskTemplateId;
  props: TaskTemplateProps;
  addHistory(action: string, changes?: unknown): void;
}

// ============ Priority Calculation ============

/** Maps a priority score to a priority level. */
function scoreToPriorityLevel(score: number): PriorityLevel {
  if (score >= 80) return PriorityLevel.Critical as PriorityLevel;
  if (score >= 60) return PriorityLevel.High as PriorityLevel;
  if (score >= 40) return PriorityLevel.Medium as PriorityLevel;
  if (score >= 20) return PriorityLevel.Low as PriorityLevel;
  return PriorityLevel.None as PriorityLevel;
}

/** Gets the priority level and score. */
export function getPriority(
  props: TaskTemplateProps,
): { level: PriorityLevel; score: number } {
  if (props.taskType !== TaskType.OneTime) {
    return { level: PriorityLevel.Low as PriorityLevel, score: 0 };
  }
  const score = calculateTaskPriority(props.importance, props.dueDate, Date.now());
  return { level: scoreToPriorityLevel(score), score };
}

// ============ Subtask Management ============

/** Adds a subtask. */
export function addSubtask(ctx: OneTimeOperationContext, subtaskId: string): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can have subtasks', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'addSubtask',
    });
  }
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('subtask_added', { subtaskId });
}

/** Removes a subtask. */
export function removeSubtask(ctx: OneTimeOperationContext, subtaskId: string): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can have subtasks', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'removeSubtask',
    });
  }
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('subtask_removed', { subtaskId });
}

/** Checks whether this template is a subtask. */
export function isSubtask(props: TaskTemplateProps): boolean {
  return props.parentTaskId !== null;
}

/** Updates the parent task relationship. */
export function updateParentTaskId(
  ctx: OneTimeOperationContext,
  parentTaskId: TaskTemplateId | null,
): void {
  if (parentTaskId && String(parentTaskId) === String(ctx.id)) {
    throw new InvalidTaskTemplateStateError('Task cannot be its own parent', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'updateParentTaskId',
    });
  }
  ctx.props.parentTaskId = parentTaskId;
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('parent_task_updated', {
    parentTaskId: parentTaskId ? String(parentTaskId) : null,
  });
}

// ============ Dependency Management ============

/** Marks the template as blocked. */
export function markAsBlocked(
  ctx: OneTimeOperationContext,
  reason: string,
  dependencyTaskId?: string,
): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can be blocked by dependencies', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'markAsBlocked',
    });
  }
  ctx.props.isBlocked = true;
  ctx.props.blockingReason = reason;
  ctx.props.dependencyStatus = DependencyStatus.Blocked;
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('marked_as_blocked', { reason, dependencyTaskId });
}

/** Marks the template as ready (dependencies resolved). */
export function markAsReady(ctx: OneTimeOperationContext): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can have dependency status', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'markAsReady',
    });
  }
  ctx.props.isBlocked = false;
  ctx.props.blockingReason = null;
  ctx.props.dependencyStatus = DependencyStatus.Ready;
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('marked_as_ready');
}

/** Updates the dependency status. */
export function updateDependencyStatus(
  ctx: OneTimeOperationContext,
  status: DependencyStatus,
): void {
  if (ctx.props.taskType !== TaskType.OneTime) {
    throw new InvalidTaskTemplateStateError('Only OneTime tasks can have dependency status', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'updateDependencyStatus',
    });
  }
  const oldStatus = ctx.props.dependencyStatus;
  ctx.props.dependencyStatus = status;
  ctx.props.updatedAt = Date.now();
  ctx.addHistory('dependency_status_updated', { oldStatus, newStatus: status });
}
