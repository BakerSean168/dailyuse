import type { ScheduleEventMap } from '@dailyuse/contracts/schedule';
import type { GoalScheduleProjectionEventMap } from '@dailyuse/goal/schedule-projection';
import type { ReminderScheduleProjectionEventMap } from '@dailyuse/reminder/schedule-projection';
import type { TaskScheduleProjectionEventMap } from '@dailyuse/task/schedule-projection';
import {
  createTypedEventPublisher,
  createTypedEventSubscriber,
  eventBus,
} from '@dailyuse/utils/domain';
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
