import { describe, expect, it } from 'vitest';
import type { TaskGoalProgressOutboxEventV1 } from './task-goal-progress-outbox.event';

describe('TaskGoalProgressOutboxEventV1', () => {
  it('is a self-contained, versioned delivery contract', () => {
    const event: TaskGoalProgressOutboxEventV1 = {
      eventId: 'event-1',
      schemaVersion: 1,
      eventType: 'task.goal-progress-requested',
      identityId: 'identity-1' as never,
      taskInstanceId: 'instance-1' as never,
      taskTemplateId: 'template-1' as never,
      goalId: 'goal-1' as never,
      keyResultId: 'kr-1' as never,
      goalRecordValue: 2,
      progressTrigger: 'PER_INSTANCE',
      taskTitle: 'Ship outbox',
      occurredAt: 1,
    };

    expect(event).toMatchObject({ schemaVersion: 1, goalId: 'goal-1', keyResultId: 'kr-1' });
  });
});
