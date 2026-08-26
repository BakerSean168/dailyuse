import type { ScheduleEventMap } from '@memoflow/contracts/schedule';
import type { GoalScheduleProjectionEventMap } from '@memoflow/goal/schedule-projection';
import type { RoutineScheduleProjectionEventMap } from '@memoflow/reminder/schedule-projection/routine';
import type { ReminderScheduleProjectionEventMap } from '@memoflow/reminder/schedule-projection';
import type { TaskScheduleProjectionEventMap } from '@memoflow/task/schedule-projection';
import {
  createTypedEventPublisher,
  createTypedEventSubscriber,
  eventBus,
} from '@memoflow/utils/domain';
import {
  ScheduledHandlerRegistry,
  createHandlerRegistryScheduleTaskSourceExecutor,
  createScheduleTaskSchedulingPort,
} from '@memoflow/schedule';
import {
  createRoutineWallClockExecutionSource,
  createRoutineWallClockScheduledHandler,
} from '@memoflow/reminder/schedule-execution/routine';
import type {
  CreateScheduleOrchestrationModuleOptions,
  ScheduleOrchestrationModule,
} from '../ports/projection';
import { createScheduleExecutionRouter } from '../execution/router';
import { createCompositeRuntimeContribution } from '../runtime/composite-runtime';
import { createGoalProjectionRuntime } from '../runtime/goal-projection-runtime';
import { createReminderProjectionRuntime } from '../runtime/reminder-projection-runtime';
import { createRoutineProjectionRuntime } from '../runtime/routine-projection-runtime';
import { createTaskProjectionRuntime } from '../runtime/task-projection-runtime';

export function createScheduleOrchestrationModule(
  options: CreateScheduleOrchestrationModuleOptions,
): ScheduleOrchestrationModule {
  const scheduleEvents =
    createTypedEventPublisher<Pick<ScheduleEventMap, 'schedule:task-deleted'>>(eventBus);
  const scheduleTaskRepository = options.taskProjection.scheduleTaskRepository;
  if (options.reminderProjection.scheduleTaskRepository !== scheduleTaskRepository) {
    throw new Error(
      'Schedule orchestration requires one shared ScheduleTask repository for projections and SchedulingPort.',
    );
  }

  const schedulingPort = createScheduleTaskSchedulingPort(scheduleTaskRepository);
  const handlerRegistry = new ScheduledHandlerRegistry();
  const legacySourceExecutor = createScheduleExecutionRouter(options.execution);

  const runtimeContributions = [
    createTaskProjectionRuntime({
      source: options.taskProjection.source,
      schedulingPort,
      taskEvents: createTypedEventSubscriber<TaskScheduleProjectionEventMap>(eventBus),
    }),
    createGoalProjectionRuntime({
      source: options.goalProjection.source,
      schedulingPort,
      goalEvents: createTypedEventSubscriber<GoalScheduleProjectionEventMap>(eventBus),
    }),
    createReminderProjectionRuntime({
      source: options.reminderProjection.source,
      scheduleTaskRepository: options.reminderProjection.scheduleTaskRepository,
      reminderEvents: createTypedEventSubscriber<ReminderScheduleProjectionEventMap>(eventBus),
      scheduleEvents,
    }),
  ];

  // ROUTINE-3401: durable wall-clock lane. When a routine projection + execution
  // deps are joined, register the neutral handler and publish the post-commit
  // occurrence-committed signal so the routine runtime re-arms the next trigger.
  if (options.routineProjection && options.execution.routineSource) {
    const routineCommittedPublisher =
      createTypedEventPublisher<RoutineScheduleProjectionEventMap>(eventBus);
    const routineExecutionSource = createRoutineWallClockExecutionSource({
      ...options.execution.routineSource,
      publishOccurrenceCommitted: (event) => {
        routineCommittedPublisher.send('routine:occurrence-committed', event);
      },
    });
    handlerRegistry.register(
      createRoutineWallClockScheduledHandler({ executionSource: routineExecutionSource }),
    );
    runtimeContributions.push(
      createRoutineProjectionRuntime({
        source: options.routineProjection.source,
        schedulingPort,
        routineEvents: createTypedEventSubscriber<RoutineScheduleProjectionEventMap>(eventBus),
      }),
    );
  }

  return {
    projectionRuntime: createCompositeRuntimeContribution(runtimeContributions),
    schedulingPort,
    handlerRegistry,
    sourceExecutor: createHandlerRegistryScheduleTaskSourceExecutor({
      registry: handlerRegistry,
      legacyFallback: legacySourceExecutor,
    }),
  };
}
