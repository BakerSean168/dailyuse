import { describe, expect, it, vi } from 'vitest';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type {
  ReminderScheduleProjectionEventMap,
  ReminderScheduleProjectionSource,
} from '@dailyuse/reminder/schedule-projection';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import { ScheduleTask } from '@dailyuse/schedule';
import { ScheduleConfig, ScheduleTaskMetadata } from '@dailyuse/schedule/domain-shared';
import type { Publisher, Subscriber } from '@dailyuse/utils/domain';
import { createReminderProjectionRuntime } from '../runtime/reminder-projection-runtime';

function createScheduleTask(templateId: string, name: string) {
  return ScheduleTask.create({
    identityId: 'IdentityId_reminder-owner',
    name,
    sourceModule: SourceModule.Reminder,
    sourceEntityId: templateId,
    schedule: ScheduleConfig.fromDTO({
      cronExpression: null,
      timezone: 'Asia/Shanghai',
      startDate: new Date('2030-01-10T08:45:00.000Z').toISOString(),
      endDate: null,
      maxExecutions: 1,
    }),
    metadata: ScheduleTaskMetadata.create({
      payload: { reminderId: templateId },
      tags: ['reminder'],
      priority: 'Normal',
      timeout: null,
    }),
  });
}

function createReminderEventsHarness(): {
  subscriber: Subscriber<ReminderScheduleProjectionEventMap>;
  emit<K extends keyof ReminderScheduleProjectionEventMap>(
    event: K,
    payload: ReminderScheduleProjectionEventMap[K],
  ): Promise<void>;
} {
  const handlers = new Map<
    keyof ReminderScheduleProjectionEventMap,
    Set<
      (
        payload: ReminderScheduleProjectionEventMap[keyof ReminderScheduleProjectionEventMap],
      ) => void
    >
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

describe('reminder projection runtime', () => {
  it('removes template projection entries and unsubscribes on stop', async () => {
    const matchingTask = createScheduleTask('ReminderTemplateId_dead', 'Old');
    const reminderEvents = createReminderEventsHarness();
    const scheduleEvents = createScheduleEventsHarness();

    const scheduleTaskRepository: IScheduleTaskRepository = {
      save: vi.fn(),
      findById: vi.fn(),
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

    const source: ReminderScheduleProjectionSource = {
      buildTemplatePlan: vi.fn(),
      buildTemplateDeletionSelection: vi.fn().mockReturnValue({
        sourceModule: SourceModule.Reminder,
        sourceEntityId: 'ReminderTemplateId_dead',
        identityId: 'IdentityId_reminder-owner',
        matches(task: ScheduleTask) {
          return task.sourceEntityId === 'ReminderTemplateId_dead';
        },
      }),
    };

    const runtime = createReminderProjectionRuntime({
      source,
      scheduleTaskRepository,
      reminderEvents: reminderEvents.subscriber,
      scheduleEvents: scheduleEvents.publisher,
    });

    runtime.start();
    await reminderEvents.emit('reminder:template-deleted', {
      identityId: 'IdentityId_reminder-owner',
      templateId: 'ReminderTemplateId_dead',
    } as never);
    runtime.stop();
    await reminderEvents.emit('reminder:template-deleted', {
      identityId: 'IdentityId_reminder-owner',
      templateId: 'ReminderTemplateId_dead',
    } as never);

    expect(source.buildTemplateDeletionSelection).toHaveBeenCalledTimes(1);
    expect(scheduleTaskRepository.deleteBatch).toHaveBeenCalledTimes(1);
    expect(scheduleEvents.sent).toEqual([
      {
        event: 'schedule:task-deleted',
        payload: { taskId: matchingTask.id },
      },
    ]);
  });
});
