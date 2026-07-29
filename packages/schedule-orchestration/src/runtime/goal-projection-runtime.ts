import type { ScheduleEventMap } from '@memoflow/contracts/schedule';
import {
  createGoalScheduleProjectionEventHandlers,
  type GoalScheduleProjectionEventMap,
  type GoalScheduleProjectionSource,
} from '@memoflow/goal/schedule-projection';
import type { IScheduleTaskRepository } from '@memoflow/schedule';
import type { Publisher, Subscriber } from '@memoflow/utils/domain';
import type { RuntimeContribution } from '../ports/runtime-contribution';
import { createGoalProjector } from '../projectors/goal-projector';

export interface CreateGoalProjectionRuntimeDeps {
  readonly source: GoalScheduleProjectionSource;
  readonly scheduleTaskRepository: IScheduleTaskRepository;
  readonly goalEvents: Subscriber<GoalScheduleProjectionEventMap>;
  readonly scheduleEvents: Publisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>;
}

export function createGoalProjectionRuntime(
  deps: CreateGoalProjectionRuntimeDeps,
): RuntimeContribution {
  const projector = createGoalProjector({
    source: deps.source,
    scheduleTaskRepository: deps.scheduleTaskRepository,
    scheduleEvents: deps.scheduleEvents,
  });

  const handlers = createGoalScheduleProjectionEventHandlers(projector);
  let started = false;

  return {
    start() {
      if (started) {
        return;
      }

      deps.goalEvents.on('goal:created', handlers['goal:created']);
      deps.goalEvents.on('goal:updated', handlers['goal:updated']);
      deps.goalEvents.on(
        'goal:schedule-time-changed',
        handlers['goal:schedule-time-changed'],
      );
      deps.goalEvents.on(
        'goal:reminder-config-changed',
        handlers['goal:reminder-config-changed'],
      );
      deps.goalEvents.on('goal:completed', handlers['goal:completed']);
      deps.goalEvents.on('goal:archived', handlers['goal:archived']);
      deps.goalEvents.on('goal:deleted', handlers['goal:deleted']);

      started = true;
    },

    stop() {
      if (!started) {
        return;
      }

      deps.goalEvents.off('goal:created', handlers['goal:created']);
      deps.goalEvents.off('goal:updated', handlers['goal:updated']);
      deps.goalEvents.off(
        'goal:schedule-time-changed',
        handlers['goal:schedule-time-changed'],
      );
      deps.goalEvents.off(
        'goal:reminder-config-changed',
        handlers['goal:reminder-config-changed'],
      );
      deps.goalEvents.off('goal:completed', handlers['goal:completed']);
      deps.goalEvents.off('goal:archived', handlers['goal:archived']);
      deps.goalEvents.off('goal:deleted', handlers['goal:deleted']);

      started = false;
    },
  };
}
