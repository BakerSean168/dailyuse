import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { GoalScheduleProjectionEventMap, GoalScheduleProjectionSource } from '@dailyuse/goal/schedule-projection';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import type { Publisher, Subscriber } from '@dailyuse/utils/domain';
import { createGoalProjectionRuntime } from '../runtime/goal-projection-runtime';

function createScheduleTask(goalId: string, name: string) {
  return ScheduleTask.create({
    identityId: 'IdentityId_goal-owner',
    name,
    sourceModule: SourceModule.Goal,
    sourceEntityId: goalId,
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: {
      payload: { goalId },
      tags: ['goal'],
      priority: 'Normal',
      timeout: null,
    },
  });
}

function createGoalEventsHarness(): {
  subscriber: Subscriber<GoalScheduleProjectionEventMap>;
  emit<K extends keyof GoalScheduleProjectionEventMap>(
    event: K,
    payload: GoalScheduleProjectionEventMap[K],
  ): Promise<void>;
} {
  const handlers = new Map<
    keyof GoalScheduleProjectionEventMap,
    Set<(payload: GoalScheduleProjectionEventMap[keyof GoalScheduleProjectionEventMap]) => void>
  >();

  return {
    subscriber: {
      on(event, handler) {
        const existing = handlers.get(event) ?? new Set();
        existing.add(handler as never);
        handlers.set(event, existing);
      },
      off(event, handler) {
        handlers.get(event)?.delete(handler as never);
      },
    },
    async emit(event, payload) {
      const activeHandlers = Array.from(handlers.get(event) ?? []);
      await Promise.all(activeHandlers.map((handler) => Promise.resolve(handler(payload))));
    },
  };
}

function createScheduleEventsHarness(): {
  publisher: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
  sent: Array<{ event: 'schedule:task-deleted'; payload: { taskId: string } }>;
} {
  const sent: Array<{ event: 'schedule:task-deleted'; payload: { taskId: string } }> = [];

  return {
    publisher: {
      send(event, payload) {
        sent.push({ event, payload });
      },
    },
    sent,
  };
}

describe('goal projection runtime', () => {
  it('rebuilds matching schedule tasks on goal:updated', async () => {
    const existingMatchingTask = createScheduleTask('GoalId_goal-1', 'Old');
    const existingUnrelatedTask = createScheduleTask('GoalId_goal-2', 'Other');
    const nextTask = createScheduleTask('GoalId_goal-1', 'Next');
    const goalEvents = createGoalEventsHarness();
    const scheduleEvents = createScheduleEventsHarness();

    const scheduleTaskRepository: IScheduleTaskRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIdForIdentity: vi.fn(),
      deleteById: vi.fn(),
      findByIdentityId: vi.fn(),
      findBySourceModule: vi.fn(),
      findBySourceEntity: vi
        .fn()
        .mockResolvedValue([existingMatchingTask, existingUnrelatedTask]),
      findByStatus: vi.fn(),
      findEnabled: vi.fn(),
      findDueTasksForExecution: vi.fn(),
      query: vi.fn(),
      count: vi.fn(),
      saveBatch: vi.fn().mockResolvedValue(undefined),
      deleteBatch: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn(),
    };

    const source: GoalScheduleProjectionSource = {
      buildGoalPlan: vi.fn().mockResolvedValue({
        selection: {
          sourceModule: SourceModule.Goal,
          identityId: 'IdentityId_goal-owner',
          sourceEntityId: 'GoalId_goal-1',
          matches(task: ScheduleTask) {
            return task.sourceEntityId === 'GoalId_goal-1';
          },
        },
        nextTasks: [nextTask],
      }),
      buildGoalDeletionSelection: vi.fn(),
    };

    const runtime = createGoalProjectionRuntime({
      source,
      scheduleTaskRepository,
      goalEvents: goalEvents.subscriber,
      scheduleEvents: scheduleEvents.publisher,
    });

    runtime.start();
    await goalEvents.emit('goal:updated', {
      identityId: 'IdentityId_goal-owner',
      goal: { id: 'GoalId_goal-1' },
    } as never);

    expect(source.buildGoalPlan).toHaveBeenCalledWith('GoalId_goal-1', 'IdentityId_goal-owner');
    expect(scheduleTaskRepository.deleteBatch).toHaveBeenCalledWith(
      existingMatchingTask.identityId,
      [existingMatchingTask.id],
    );
    expect(scheduleTaskRepository.saveBatch).toHaveBeenCalledWith([nextTask]);
    expect(scheduleEvents.sent).toEqual([
      {
        event: 'schedule:task-deleted',
        payload: { taskId: existingMatchingTask.id },
      },
    ]);
  });
});
