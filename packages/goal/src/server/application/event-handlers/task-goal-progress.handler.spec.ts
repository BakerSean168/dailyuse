import { describe, expect, it, vi } from 'vitest';
import { ok, error } from '@memoflow/contracts/result';
import type { TaskGoalProgressOutboxEventV1 } from '@memoflow/contracts/task';
import { GoalTaskProgressHandler } from './task-goal-progress.handler';

function event(
  progressTrigger: TaskGoalProgressOutboxEventV1['progressTrigger'] = 'PER_INSTANCE',
): TaskGoalProgressOutboxEventV1 {
  return {
    eventId: 'task-goal-progress:instance-1:1000',
    schemaVersion: 1,
    eventType: 'task.goal-progress-requested',
    identityId: 'identity-1' as never,
    taskInstanceId: 'instance-1' as never,
    taskTemplateId: 'template-1' as never,
    goalId: 'goal-1' as never,
    keyResultId: 'kr-1' as never,
    goalRecordValue: 3,
    progressTrigger,
    taskTitle: 'Write tests',
    occurredAt: 1000,
  };
}

describe('GoalTaskProgressHandler', () => {
  it('maps per-instance delivery to the GoalRecord source idempotency key', async () => {
    const execute = vi.fn(async () => ok({} as never));

    await new GoalTaskProgressHandler({ execute }).handle(event());

    expect(execute).toHaveBeenCalledWith(
      'goal-1',
      'kr-1',
      {
        value: 3,
        note: '任务实例完成: Write tests',
        source: { type: 'TASK_INSTANCE', id: 'instance-1' },
      },
      'identity-1',
    );
  });

  it('maps all-instances delivery to one contribution per template', async () => {
    const execute = vi.fn(async () => ok({} as never));

    await new GoalTaskProgressHandler({ execute }).handle(event('ALL_INSTANCES_COMPLETED'));

    expect(execute).toHaveBeenCalledWith(
      'goal-1',
      'kr-1',
      expect.objectContaining({
        note: '模板实例全部完成: Write tests',
        source: { type: 'TASK_TEMPLATE', id: 'template-1' },
      }),
      'identity-1',
    );
  });

  it('rejects the delivery so the outbox remains retryable when Goal returns an error', async () => {
    const execute = vi.fn(async () => error('NOT_FOUND', 'Goal not found'));

    await expect(new GoalTaskProgressHandler({ execute }).handle(event())).rejects.toThrow(
      'Task -> Goal delivery failed (NOT_FOUND): Goal not found',
    );
  });
});
