import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import type {
  TaskScheduleProjectionEventMap,
  TaskScheduleProjectionSource,
} from '@dailyuse/task/schedule-projection';
import type { Publisher, Subscriber } from '@dailyuse/utils/domain';
import { createTaskProjectionRuntime } from '../runtime/task-projection-runtime';

function createScheduleTask(templateId: string, sourceEntityId: string, name: string) {
  return ScheduleTask.create({
    identityId: 'IdentityId_schedule-owner',
    name,
    sourceModule: SourceModule.Task,
    sourceEntityId,
    schedule: {
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    },
    metadata: {
      payload: { templateId },
      tags: ['task'],
      priority: 'Normal',
      timeout: null,
    },
  });
}

function createTaskEventsHarness(): {
  subscriber: Subscriber<TaskScheduleProjectionEventMap>;
  emit<K extends keyof TaskScheduleProjectionEventMap>(
    event: K,
    payload: TaskScheduleProjectionEventMap[K],
  ): Promise<void>;
} {
  const handlers = new Map<
    keyof TaskScheduleProjectionEventMap,
    Set<(payload: TaskScheduleProjectionEventMap[keyof TaskScheduleProjectionEventMap]) => void>
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

describe('task projection runtime', () => {
  it('rebuilds matching task projection entries on task:created', async () => {
    const existingMatchingTask = createScheduleTask('TaskTemplateId_template', 'instance-1', 'Old');
    const existingUnrelatedTask = createScheduleTask('TaskTemplateId_other', 'instance-2', 'Other');
    const nextTask = createScheduleTask('TaskTemplateId_template', 'instance-3', 'Next');
    const taskEvents = createTaskEventsHarness();
    const scheduleEvents = createScheduleEventsHarness();

    const scheduleTaskRepository: IScheduleTaskRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIdForIdentity: vi.fn(),
      deleteById: vi.fn(),
      findByIdentityId: vi.fn(),
      findBySourceModule: vi.fn().mockResolvedValue([existingMatchingTask, existingUnrelatedTask]),
      findBySourceEntity: vi.fn(),
      findByStatus: vi.fn(),
      findEnabled: vi.fn(),
      findDueTasksForExecution: vi.fn(),
      query: vi.fn(),
      count: vi.fn(),
      saveBatch: vi.fn().mockResolvedValue(undefined),
      deleteBatch: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn(),
    };

    const source: TaskScheduleProjectionSource = {
      buildTemplatePlan: vi.fn().mockResolvedValue({
        selection: {
          sourceModule: SourceModule.Task,
          identityId: 'IdentityId_schedule-owner',
          matches(task: ScheduleTask) {
            return task.metadata.payload['templateId'] === 'TaskTemplateId_template';
          },
        },
        nextTasks: [nextTask],
      }),
      buildTemplateDeletionSelection: vi.fn(),
      buildInstanceDeletionSelection: vi.fn(),
    };

    const runtime = createTaskProjectionRuntime({
      source,
      scheduleTaskRepository,
      taskEvents: taskEvents.subscriber,
      scheduleEvents: scheduleEvents.publisher,
    });

    runtime.start();
    await taskEvents.emit('task:created', {
      identityId: 'IdentityId_schedule-owner',
      templateId: 'TaskTemplateId_template',
      goalId: null,
      task: { id: 'TaskTemplateId_template' },
    } as never);

    expect(source.buildTemplatePlan).toHaveBeenCalledWith(
      'TaskTemplateId_template',
      'IdentityId_schedule-owner',
    );
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

  it('removes instance projection entries and unsubscribes on stop', async () => {
    const matchingTask = createScheduleTask('TaskTemplateId_template', 'TaskInstanceId_dead', 'Old');
    const taskEvents = createTaskEventsHarness();
    const scheduleEvents = createScheduleEventsHarness();

    const scheduleTaskRepository: IScheduleTaskRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByIdForIdentity: vi.fn(),
      deleteById: vi.fn(),
      findByIdentityId: vi.fn(),
      findBySourceModule: vi.fn(),
      findBySourceEntity: vi.fn().mockResolvedValue([matchingTask]),
      findByStatus: vi.fn(),
      findEnabled: vi.fn(),
      findDueTasksForExecution: vi.fn(),
      query: vi.fn(),
      count: vi.fn(),
      saveBatch: vi.fn().mockResolvedValue(undefined),
      deleteBatch: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn(),
    };

    const source: TaskScheduleProjectionSource = {
      buildTemplatePlan: vi.fn(),
      buildTemplateDeletionSelection: vi.fn(),
      buildInstanceDeletionSelection: vi.fn().mockReturnValue({
        sourceModule: SourceModule.Task,
        sourceEntityId: 'TaskInstanceId_dead',
        identityId: 'IdentityId_schedule-owner',
        matches(task: ScheduleTask) {
          return task.sourceEntityId === 'TaskInstanceId_dead';
        },
      }),
    };

    const runtime = createTaskProjectionRuntime({
      source,
      scheduleTaskRepository,
      taskEvents: taskEvents.subscriber,
      scheduleEvents: scheduleEvents.publisher,
    });

    runtime.start();
    await taskEvents.emit('task:instance-deleted', {
      identityId: 'IdentityId_schedule-owner',
      taskInstanceId: 'TaskInstanceId_dead',
      taskTemplateId: 'TaskTemplateId_template',
      deletedAt: Date.now(),
    } as never);
    runtime.stop();
    await taskEvents.emit('task:instance-deleted', {
      identityId: 'IdentityId_schedule-owner',
      taskInstanceId: 'TaskInstanceId_dead',
      taskTemplateId: 'TaskTemplateId_template',
      deletedAt: Date.now(),
    } as never);

    expect(source.buildInstanceDeletionSelection).toHaveBeenCalledTimes(1);
    expect(scheduleTaskRepository.deleteBatch).toHaveBeenCalledTimes(1);
    expect(scheduleEvents.sent).toEqual([
      {
        event: 'schedule:task-deleted',
        payload: { taskId: matchingTask.id },
      },
    ]);
  });
});
