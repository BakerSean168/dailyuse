import { describe, expect, it } from 'vitest';
import type { IDomainEvent } from '@memoflow/contracts/shared';
import { TaskGoalBindingTrigger, type TaskInstanceCompletedEvent } from '@memoflow/contracts/task';
import { toTaskGoalOutboxRecord } from './task-goal-outbox';

function completionEvent(): IDomainEvent<TaskInstanceCompletedEvent> {
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
        keyResultId: 'kr-1' as NonNullable<
          TaskInstanceCompletedEvent['goalBinding']
        >['keyResultId'],
        goalRecordValue: 2,
        progressTrigger: TaskGoalBindingTrigger.PerInstance,
      },
      allInstancesCompleted: false,
    },
  };
}

describe('toTaskGoalOutboxRecord', () => {
  it('derives a stable event id so transaction retries cannot enqueue duplicates', () => {
    const source = completionEvent();
    const first = toTaskGoalOutboxRecord(source);
    const retry = toTaskGoalOutboxRecord(source);

    expect(first?.eventId).toBe('task-goal-progress:instance-1:1000');
    expect(retry?.eventId).toBe(first?.eventId);
  });

  it('does not enqueue an all-instances contribution before the condition is met', () => {
    const source = completionEvent();
    source.payload.goalBinding!.progressTrigger = TaskGoalBindingTrigger.AllInstancesCompleted;

    expect(toTaskGoalOutboxRecord(source)).toBeNull();
  });
});
