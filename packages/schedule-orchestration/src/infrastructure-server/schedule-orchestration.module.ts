import type { ScheduleEventMap } from '@memoflow/contracts/schedule';
import type { GoalScheduleProjectionEventMap } from '@memoflow/goal/schedule-projection';
import type { ReminderScheduleProjectionEventMap } from '@memoflow/reminder/schedule-projection';
import type { TaskScheduleProjectionEventMap } from '@memoflow/task/schedule-projection';
import {
  createTypedEventPublisher,
  createTypedEventSubscriber,
  eventBus,
} from '@memoflow/utils/domain';
import type {
  CreateScheduleOrchestrationModuleOptions,
  ScheduleOrchestrationModule,
} from '../ports/projection';
import { createScheduleExecutionRouter } from '../execution/router';
import { createCompositeRuntimeContribution } from '../runtime/composite-runtime';
import { createGoalProjectionRuntime } from '../runtime/goal-projection-runtime';
import { createReminderProjectionRuntime } from '../runtime/reminder-projection-runtime';
import { createTaskProjectionRuntime } from '../runtime/task-projection-runtime';

export function createScheduleOrchestrationModule(
  options: CreateScheduleOrchestrationModuleOptions,
): ScheduleOrchestrationModule {
  const scheduleEvents = createTypedEventPublisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>(
    eventBus,
  );

  return {
    projectionRuntime: createCompositeRuntimeContribution([
      createTaskProjectionRuntime({
        source: options.taskProjection.source,
        scheduleTaskRepository: options.taskProjection.scheduleTaskRepository,
        taskEvents: createTypedEventSubscriber<TaskScheduleProjectionEventMap>(eventBus),
        scheduleEvents,
      }),
      createGoalProjectionRuntime({
        source: options.goalProjection.source,
        scheduleTaskRepository: options.goalProjection.scheduleTaskRepository,
        goalEvents: createTypedEventSubscriber<GoalScheduleProjectionEventMap>(eventBus),
        scheduleEvents,
      }),
      createReminderProjectionRuntime({
        source: options.reminderProjection.source,
        scheduleTaskRepository: options.reminderProjection.scheduleTaskRepository,
        reminderEvents: createTypedEventSubscriber<ReminderScheduleProjectionEventMap>(eventBus),
        scheduleEvents,
      }),
    ]),
    sourceExecutor: createScheduleExecutionRouter(options.execution),
  };
}
