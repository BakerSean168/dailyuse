import { describe, expect, it } from 'vitest';
import type { IDomainEvent } from '@memoflow/contracts/shared';
import { TaskGoalBindingTrigger, type TaskInstanceCompletedEvent } from '@memoflow/contracts/task';
import { toTaskGoalOutboxRecord } from './task-goal-outbox';

function completionEvent(
  contribution: NonNullable<NonNullable<TaskInstanceCompletedEvent['goalBinding']>['contribution']> | null = {
    value: 2,
    trigger: TaskGoalBindingTrigger.EachCompletion,
  },
): IDomainEvent<TaskInstanceCompletedEvent> {
  return {
    eventType: 'task:instance-completed',
    aggregateId: 'instance-1',
    occurredAt: new Date(1_000),
    payload: {
      identityId: 'identity-1' as TaskInstanceCompletedEvent['identityId'],
      taskInstanceId: 'instance-1' as TaskInstanceCompletedEvent['taskInstanceId'],
      taskTemplateId: 'template-1' as TaskInstanceCompletedEvent['taskTemplateId'],
      completedAt: 1_000,
      taskTitle: 'Ship reliable progress',
      goalBinding: {
        goalId: 'goal-1' as NonNullable<TaskInstanceCompletedEvent['goalBinding']>['goalId'],
        keyResultId: 'kr-1' as NonNullable<TaskInstanceCompletedEvent['goalBinding']>['keyResultId'],
        contribution,
      },
      planSucceeded: false,
    },
  };
}

describe('toTaskGoalOutboxRecord V2', () => {
  it('derives a stable instance-source event id so transaction retries cannot enqueue duplicates', () => {
    const source = completionEvent();
    const first = toTaskGoalOutboxRecord(source);
    const retry = toTaskGoalOutboxRecord(source);

    expect(first?.eventId).toBe('task-goal-apply:TaskInstance:instance-1:1000');
    expect(retry?.eventId).toBe(first?.eventId);
    expect(JSON.parse(first!.payload)).toMatchObject({
      schemaVersion: 2,
      action: 'apply',
      value: 2,
      source: { type: 'TaskInstance', id: 'instance-1' },
    });
  });

  it('never enqueues progress for a link-only Task', () => {
    expect(toTaskGoalOutboxRecord(completionEvent(null))).toBeNull();
  });

  it('does not enqueue PlanCompletion until Task-owned outcome policy says Succeeded', () => {
    const source = completionEvent({ value: 3, trigger: TaskGoalBindingTrigger.PlanCompletion });
    expect(toTaskGoalOutboxRecord(source)).toBeNull();

    source.payload.planSucceeded = true;
    const record = toTaskGoalOutboxRecord(source);
    expect(record).not.toBeNull();
    expect(JSON.parse(record!.payload)).toMatchObject({
      action: 'apply',
      source: { type: 'TaskPlan', id: 'template-1' },
      value: 3,
    });
  });

  it('converts uncomplete into an explicit-source revert delivery', () => {
    const source: IDomainEvent = {
      eventType: 'task:instance-uncompleted',
      aggregateId: 'instance-1',
      occurredAt: new Date(2_000),
      payload: {
        identityId: 'identity-1',
        taskInstanceId: 'instance-1',
        taskTemplateId: 'template-1',
        uncompletedAt: 2_000,
      },
    };

    const record = toTaskGoalOutboxRecord(source);

    expect(record).not.toBeNull();
    expect(record!.eventId).toBe('task-goal-revert:instance-1:2000');
    expect(JSON.parse(record!.payload)).toMatchObject({
      schemaVersion: 2,
      action: 'revert',
      sources: [
        { type: 'TaskInstance', id: 'instance-1' },
        { type: 'TaskPlan', id: 'template-1' },
      ],
    });
  });
});
