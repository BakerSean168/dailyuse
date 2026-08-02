import type {
  IdentityId,
  GoalId,
  KeyResultId,
  TaskInstanceId,
  TaskTemplateId,
} from '../../../../primitives';
import type { TaskGoalBindingTrigger } from '../../value-objects/task-goal-binding-trigger';

/**
 * Persisted Task → Goal delivery contract. This is deliberately independent
 * from the in-process domain-event envelope: it has a durable event ID and a
 * version that a dispatcher can safely replay after restart.
 */
export interface TaskGoalProgressOutboxEventV1 {
  eventId: string;
  schemaVersion: 1;
  eventType: 'task.goal-progress-requested';
  identityId: IdentityId;
  taskInstanceId: TaskInstanceId;
  taskTemplateId: TaskTemplateId;
  goalId: GoalId;
  keyResultId: KeyResultId;
  goalRecordValue: number;
  progressTrigger: TaskGoalBindingTrigger;
  taskTitle: string;
  occurredAt: number;
}
