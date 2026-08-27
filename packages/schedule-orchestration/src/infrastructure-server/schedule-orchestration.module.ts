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
import {
  defineProjectionRepairLane,
  type ProjectionRepairLane,
} from '../runtime/projection-repair-runtime';
import { createScheduleExecutionRouter } from '../execution/router';
import { createCompositeRuntimeContribution } from '../runtime/composite-runtime';
import { createGoalProjectionRuntime } from '../runtime/goal-projection-runtime';
import { createProjectionRepairRuntime } from '../runtime/projection-repair-runtime';
import { createReminderProjectionRuntime } from '../runtime/reminder-projection-runtime';
import { createRoutineProjectionRuntime } from '../runtime/routine-projection-runtime';
import { createTaskProjectionRuntime } from '../runtime/task-projection-runtime';
import { createRoutineOverrideChangedPublishingStore } from './routine-override-changing-store';

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

  // SCHED-3601 startup ordering is intentional: every Task/Goal/Routine
  // incremental listener is registered before the common durable repair sweep.
  // The legacy Reminder listener also joins before the sweep so moving the
  // neutral lanes does not regress its event coverage.
  const incrementalRuntimes = [
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
  ];

  const repairLanes: ProjectionRepairLane[] = [
    defineProjectionRepairLane<{ templateId: string; identityId: string }>({
      source: 'task',
      enumerate: () => options.taskProjection.source.listTemplateRefs(),
      describe: (ref) => `${ref.identityId}/${ref.templateId}`,
      repair: async (ref) => {
        const plan = await options.taskProjection.source.buildTemplatePlan(
          ref.templateId,
          ref.identityId,
        );
        return schedulingPort.reconcile(plan.owner, plan.desired);
      },
    }),
    defineProjectionRepairLane<{ goalId: string; identityId: string }>({
      source: 'goal',
      enumerate: () => options.goalProjection.source.listGoalRefs(),
      describe: (ref) => `${ref.identityId}/${ref.goalId}`,
      repair: async (ref) => {
        const plan = await options.goalProjection.source.buildGoalPlan(ref.goalId, ref.identityId);
        return schedulingPort.reconcile(plan.owner, plan.desired);
      },
    }),
  ];

  // ROUTINE-3401: durable wall-clock lane. Register its event listener before
  // the repair runtime, then repair from the feature-owned durable source.
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
    incrementalRuntimes.push(
      createRoutineProjectionRuntime({
        source: options.routineProjection.source,
        schedulingPort,
        routineEvents: createTypedEventSubscriber<RoutineScheduleProjectionEventMap>(eventBus),
      }),
    );
    repairLanes.push(
      defineProjectionRepairLane<{ routineId: string; identityId: string }>({
        source: 'routine',
        enumerate: () => options.routineProjection!.source.listRoutineRefs(),
        describe: (ref) => `${ref.identityId}/${ref.routineId}`,
        repair: async (ref) => {
          const plan = await options.routineProjection!.source.buildRoutinePlan(
            ref.routineId,
            ref.identityId,
          );
          return schedulingPort.reconcile(plan.owner, plan.desired);
        },
      }),
    );
  }

  incrementalRuntimes.push(
    createReminderProjectionRuntime({
      source: options.reminderProjection.source,
      scheduleTaskRepository: options.reminderProjection.scheduleTaskRepository,
      reminderEvents: createTypedEventSubscriber<ReminderScheduleProjectionEventMap>(eventBus),
      scheduleEvents,
    }),
  );

  const projectionRepairRuntime = createProjectionRepairRuntime(repairLanes);
  const runtimeContributions = [...incrementalRuntimes, projectionRepairRuntime];

  // ROUTINE-3401: durable snooze/suppress store. Persisted writes converge the
  // neutral Scheduler by publishing `routine:override-changed` on the shared
  // bus (consumed by the routine incremental runtime above).
  const routineOverridePublisher =
    createTypedEventPublisher<RoutineScheduleProjectionEventMap>(eventBus);
  const routineOverrideStore = options.routineOverrideStore
    ? createRoutineOverrideChangedPublishingStore({
        store: options.routineOverrideStore,
        publish: (event) => {
          routineOverridePublisher.send('routine:override-changed', event);
        },
      })
    : undefined;

  return {
    projectionRuntime: createCompositeRuntimeContribution(runtimeContributions),
    projectionRepairMetrics: projectionRepairRuntime.metrics,
    schedulingPort,
    handlerRegistry,
    sourceExecutor: createHandlerRegistryScheduleTaskSourceExecutor({
      registry: handlerRegistry,
      legacyFallback: legacySourceExecutor,
    }),
    ...(routineOverrideStore ? { routineOverrideStore } : {}),
  };
}
