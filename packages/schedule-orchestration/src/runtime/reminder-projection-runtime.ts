import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import {
  createReminderScheduleProjectionEventHandlers,
  type ReminderScheduleProjectionEventMap,
  type ReminderScheduleProjectionSource,
} from '@dailyuse/reminder/schedule-projection';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import type { Publisher, Subscriber } from '@dailyuse/utils/domain';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createReminderProjector } from '../projectors/reminder-projector';

export interface CreateReminderProjectionRuntimeDeps {
  readonly source: ReminderScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly reminderEvents: Subscriber<ReminderScheduleProjectionEventMap>;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createReminderProjectionRuntime(
  deps: CreateReminderProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createReminderProjector({
    source: deps.source,
    scheduleTaskRepository: deps.scheduleTaskRepository,
    scheduleEvents: deps.scheduleEvents,
  });

  const handlers = createReminderScheduleProjectionEventHandlers(projector);
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      deps.reminderEvents.on(
        'reminder:template-created',
        handlers['reminder:template-created'],
      );
      deps.reminderEvents.on(
        'reminder:template-updated',
        handlers['reminder:template-updated'],
      );
      deps.reminderEvents.on(
        'reminder:template-enabled',
        handlers['reminder:template-enabled'],
      );
      deps.reminderEvents.on(
        'reminder:template-moved',
        handlers['reminder:template-moved'],
      );
      deps.reminderEvents.on(
        'reminder:template-paused',
        handlers['reminder:template-paused'],
      );
      deps.reminderEvents.on(
        'reminder:template-deleted',
        handlers['reminder:template-deleted'],
      );

      started = true;
    },

    stop() {
      if (!started) {
        return;
      }

      deps.reminderEvents.off(
        'reminder:template-created',
        handlers['reminder:template-created'],
      );
      deps.reminderEvents.off(
        'reminder:template-updated',
        handlers['reminder:template-updated'],
      );
      deps.reminderEvents.off(
        'reminder:template-enabled',
        handlers['reminder:template-enabled'],
      );
      deps.reminderEvents.off(
        'reminder:template-moved',
        handlers['reminder:template-moved'],
      );
      deps.reminderEvents.off(
        'reminder:template-paused',
        handlers['reminder:template-paused'],
      );
      deps.reminderEvents.off(
        'reminder:template-deleted',
        handlers['reminder:template-deleted'],
      );

      started = false;
    },
  };
}
