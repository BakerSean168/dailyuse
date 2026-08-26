import type { IDomainEvent } from '@memoflow/contracts/shared';
import {
  TaskGoalBindingTrigger,
  TaskGoalSettlementSourceType,
  type TaskGoalProgressOutboxEventV2,
  type TaskInstanceCompletedEvent,
  type TaskUncompletedEvent,
} from '@memoflow/contracts/task';

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
 * Converts eligible Task completion / correction events into the durable V2
 * settlement contract. Link-only Tasks deliberately return null on completion.
 */
export function toTaskGoalOutboxRecord(event: IDomainEvent): TaskGoalOutboxRecord | null {
  if (event.eventType === 'task:instance-uncompleted') {
    const payload = event.payload as TaskUncompletedEvent;
    const eventId = `task-goal-revert:${String(payload.taskInstanceId)}:${payload.uncompletedAt}`;
    const durableEvent: TaskGoalProgressOutboxEventV2 = {
      eventId,
      schemaVersion: 2,
      eventType: 'task.goal-progress-requested',
      action: 'revert',
      identityId: payload.identityId,
      taskInstanceId: payload.taskInstanceId,
      taskTemplateId: payload.taskTemplateId,
      sources: [
        { type: TaskGoalSettlementSourceType.TaskInstance, id: String(payload.taskInstanceId) },
        { type: TaskGoalSettlementSourceType.TaskPlan, id: String(payload.taskTemplateId) },
      ],
      occurredAt: payload.uncompletedAt,
    };

    return {
      eventId,
      identityId: String(payload.identityId),
      taskInstanceId: String(payload.taskInstanceId),
      taskTemplateId: String(payload.taskTemplateId),
      // Physical V1-era columns remain adapter-local metadata; the V2 payload
      // is authoritative and contains explicit revert sources.
      goalId: '',
      keyResultId: '',
      payload: JSON.stringify(durableEvent),
      occurredAt: event.occurredAt,
    };
  }

  if (event.eventType !== 'task:instance-completed') return null;

  const payload = event.payload as TaskInstanceCompletedEvent;
  const binding = payload.goalBinding;
  const contribution = binding?.contribution;
  if (!binding || !contribution) return null;

  if (
    contribution.trigger === TaskGoalBindingTrigger.PlanCompletion &&
    !payload.planSucceeded
  ) {
    return null;
  }

  const source =
    contribution.trigger === TaskGoalBindingTrigger.PlanCompletion
      ? { type: TaskGoalSettlementSourceType.TaskPlan, id: String(payload.taskTemplateId) }
      : { type: TaskGoalSettlementSourceType.TaskInstance, id: String(payload.taskInstanceId) };
  const eventId = `task-goal-apply:${source.type}:${source.id}:${payload.completedAt}`;
  const durableEvent: TaskGoalProgressOutboxEventV2 = {
    eventId,
    schemaVersion: 2,
    eventType: 'task.goal-progress-requested',
    action: 'apply',
    identityId: payload.identityId,
    taskInstanceId: payload.taskInstanceId,
    taskTemplateId: payload.taskTemplateId,
    goalId: binding.goalId,
    keyResultId: binding.keyResultId,
    value: contribution.value,
    source,
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
