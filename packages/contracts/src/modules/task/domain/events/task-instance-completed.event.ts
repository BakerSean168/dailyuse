import type { IdentityId, TaskInstanceId, TaskTemplateId } from '../../../../primitives';
import type { TaskGoalBindingDTO } from '../../value-objects/task-goal-binding';

/**
 * Authoritative occurrence completion fact.
 *
 * The event carries the Task-owned Goal link snapshot needed for
 * `EachCompletion`. Whole-plan (`PlanCompletion`) eligibility is deliberately
 * absent: SETTLE-3501 drives it only from `task:plan-outcome-changed`.
 */
export interface TaskInstanceCompletedEvent {
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  completedAt: number;
  taskTitle: string;
  goalBinding: TaskGoalBindingDTO | null;
}
