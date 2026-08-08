import type { IDomainEvent } from '@memoflow/contracts/shared';
import {
  TaskGoalBindingTrigger,
  type TaskGoalProgressOutboxEventV1,
  type TaskInstanceCompletedEvent,
  type TaskUncompletedEvent,
} from '@memoflow/contracts/task';
import type { GoalId, KeyResultId } from '@memoflow/contracts/primitives';

export interface TaskGoalOutboxRecord {
  eventId: string;
  identityId: string;
  taskInstanceId: string;
  taskTemplateId: string;
  goalId: string;
  keyResultId: string;
  payload: string;
  occurredAt: Date;
}

export interface TaskGoalOutboxWriter {
  append(record: TaskGoalOutboxRecord): Promise<void>;
}

/**
 * Converts eligible Task completion / uncompletion events into durable Goal
 * deliveries (R2-5b：outbox 是唯一跨模块贡献通道，撤销也走 outbox)。
 */
export function toTaskGoalOutboxRecord(event: IDomainEvent): TaskGoalOutboxRecord | null {
  if (event.eventType === 'task:instance-uncompleted') {
    const payload = event.payload as TaskUncompletedEvent;
    const eventId = `task-goal-remove:${String(payload.taskInstanceId)}:${payload.uncompletedAt}`;
    const durableEvent: TaskGoalProgressOutboxEventV1 = {
      eventId,
      schemaVersion: 1,
      eventType: 'task.goal-progress-requested',
      action: 'uncomplete',
      identityId: payload.identityId,
      taskInstanceId: payload.taskInstanceId,
      taskTemplateId: payload.taskTemplateId,
      goalId: '' as GoalId,
      keyResultId: '' as KeyResultId,
      goalRecordValue: 0,
      progressTrigger: TaskGoalBindingTrigger.PerInstance,
      taskTitle: '',
      occurredAt: payload.uncompletedAt,
    };

    return {
      eventId,
      identityId: String(payload.identityId),
      taskInstanceId: String(payload.taskInstanceId),
      taskTemplateId: String(payload.taskTemplateId),
      goalId: '',
      keyResultId: '',
      payload: JSON.stringify(durableEvent),
      occurredAt: event.occurredAt,
    };
  }

  if (event.eventType !== 'task:instance-completed') return null;

  const payload = event.payload as TaskInstanceCompletedEvent;
  const binding = payload.goalBinding;
  if (!binding) return null;
  if (
    binding.progressTrigger === TaskGoalBindingTrigger.AllInstancesCompleted &&
    !payload.allInstancesCompleted
  ) {
    return null;
  }

  const eventId = `task-goal-progress:${String(payload.taskInstanceId)}:${payload.completedAt}`;
  const durableEvent: TaskGoalProgressOutboxEventV1 = {
    eventId,
    schemaVersion: 1,
    eventType: 'task.goal-progress-requested',
    action: 'complete',
    identityId: payload.identityId,
    taskInstanceId: payload.taskInstanceId,
    taskTemplateId: payload.taskTemplateId,
    goalId: binding.goalId,
    keyResultId: binding.keyResultId,
    goalRecordValue: binding.goalRecordValue,
    progressTrigger: binding.progressTrigger,
    taskTitle: payload.taskTitle,
    occurredAt: payload.completedAt,
  };

  return {
    eventId,
    identityId: String(payload.identityId),
    taskInstanceId: String(payload.taskInstanceId),
    taskTemplateId: String(payload.taskTemplateId),
    goalId: String(binding.goalId),
    keyResultId: String(binding.keyResultId),
    payload: JSON.stringify(durableEvent),
    occurredAt: event.occurredAt,
  };
}
