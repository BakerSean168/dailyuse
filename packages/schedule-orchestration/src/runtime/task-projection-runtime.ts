import type { SchedulingPort } from '@memoflow/contracts/schedule';
import {
  createTaskScheduleProjectionEventHandlers,
  type TaskScheduleProjectionEventMap,
  type TaskScheduleProjectionSource,
} from '@memoflow/task/schedule-projection';
import type { Subscriber } from '@memoflow/utils/domain';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createTaskProjector } from '../projectors/task-projector';

export interface CreateTaskProjectionRuntimeDeps {
  readonly source: TaskScheduleProjectionSource;
  readonly schedulingPort: SchedulingPort;
  readonly taskEvents: Subscriber<TaskScheduleProjectionEventMap>;
}

/** Incremental fast path. Durable startup repair is owned by the common repair runtime. */
export function createTaskProjectionRuntime(
  deps: CreateTaskProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createTaskProjector({
    source: deps.source,
    schedulingPort: deps.schedulingPort,
  });

  const handlers = createTaskScheduleProjectionEventHandlers(projector);
  let started = false;

  return {
    async start(): Promise<void> {
      if (started) return;

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
      deps.taskEvents.on('task:instance-uncompleted', handlers['task:instance-uncompleted']);
      deps.taskEvents.on('task:rescheduled', handlers['task:rescheduled']);
      started = true;
    },

    async stop(): Promise<void> {
      if (!started) return;

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
      deps.taskEvents.off('task:instance-uncompleted', handlers['task:instance-uncompleted']);
      deps.taskEvents.off('task:rescheduled', handlers['task:rescheduled']);
      started = false;
    },
  };
}
