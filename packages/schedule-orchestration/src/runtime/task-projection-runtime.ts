import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import {
  createTaskScheduleProjectionEventHandlers,
  type TaskScheduleProjectionEventMap,
  type TaskScheduleProjectionSource,
} from '@dailyuse/task/schedule-projection';
import type { IScheduleTaskRepository } from '@dailyuse/schedule';
import type { Publisher, Subscriber } from '@dailyuse/utils/domain';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createTaskProjector } from '../projectors/task-projector';

export interface CreateTaskProjectionRuntimeDeps {
  readonly source: TaskScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly taskEvents: Subscriber<TaskScheduleProjectionEventMap>;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createTaskProjectionRuntime(
  deps: CreateTaskProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createTaskProjector({
    source: deps.source,
    scheduleTaskRepository: deps.scheduleTaskRepository,
    scheduleEvents: deps.scheduleEvents,
  });

  const handlers = createTaskScheduleProjectionEventHandlers(projector);
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      deps.taskEvents.on('task:created', handlers['task:created']);
      deps.taskEvents.on('task:updated', handlers['task:updated']);
      deps.taskEvents.on('task:instance-generated', handlers['task:instance-generated']);
      deps.taskEvents.on(
        'task:template-schedule-time-changed',
        handlers['task:template-schedule-time-changed'],
      );
      deps.taskEvents.on(
        'task:template-recurrence-changed',
        handlers['task:template-recurrence-changed'],
      );
      deps.taskEvents.on('task:template-resumed', handlers['task:template-resumed']);
      deps.taskEvents.on('task:deleted', handlers['task:deleted']);
      deps.taskEvents.on('task:template-paused', handlers['task:template-paused']);
      deps.taskEvents.on('task:instance-completed', handlers['task:instance-completed']);
      deps.taskEvents.on('task:instance-skipped', handlers['task:instance-skipped']);
      deps.taskEvents.on('task:instance-deleted', handlers['task:instance-deleted']);

      started = true;
    },

    stop() {
      if (!started) {
        return;
      }

      deps.taskEvents.off('task:created', handlers['task:created']);
      deps.taskEvents.off('task:updated', handlers['task:updated']);
      deps.taskEvents.off('task:instance-generated', handlers['task:instance-generated']);
      deps.taskEvents.off(
        'task:template-schedule-time-changed',
        handlers['task:template-schedule-time-changed'],
      );
      deps.taskEvents.off(
        'task:template-recurrence-changed',
        handlers['task:template-recurrence-changed'],
      );
      deps.taskEvents.off('task:template-resumed', handlers['task:template-resumed']);
      deps.taskEvents.off('task:deleted', handlers['task:deleted']);
      deps.taskEvents.off('task:template-paused', handlers['task:template-paused']);
      deps.taskEvents.off('task:instance-completed', handlers['task:instance-completed']);
      deps.taskEvents.off('task:instance-skipped', handlers['task:instance-skipped']);
      deps.taskEvents.off('task:instance-deleted', handlers['task:instance-deleted']);

      started = false;
    },
  };
}
