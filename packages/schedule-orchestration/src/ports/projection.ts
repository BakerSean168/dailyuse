import type { ScheduledHandlerRegistration, SchedulingPort } from '@memoflow/contracts/schedule';
import type { GoalScheduleProjectionSource } from '@memoflow/goal/schedule-projection';
import type { RoutineScheduleProjectionSource } from '@memoflow/reminder/schedule-projection/routine';
import type { ReminderScheduleProjectionSource } from '@memoflow/reminder/schedule-projection';
import type { IScheduleTaskRepository, ScheduleTask } from '@memoflow/schedule';
import type { TaskScheduleProjectionSource } from '@memoflow/task/schedule-projection';
import type { ScheduleOrchestrationExecutionDeps } from './execution';
import type { RuntimeContribution } from './runtime-contribution';

export interface ScheduleOrchestrationProjectionDeps<TSource> {
  readonly source: TSource;
}

/** Legacy projections still diff their desired set against the ScheduleTask store. */
export interface ScheduleOrchestrationScheduleTaskProjectionDeps<
  TSource,
> extends ScheduleOrchestrationProjectionDeps<TSource> {
  readonly scheduleTaskRepository: IScheduleTaskRepository;
}

/** Composition-only registration surface; Scheduler core remains feature-neutral. */
export interface ScheduleOrchestrationHandlerRegistry {
  register<TPayload>(registration: ScheduledHandlerRegistration<TPayload>): void;
  has(handlerKey: string): boolean;
  keys(): readonly string[];
}

export interface ScheduleOrchestrationModule {
  readonly projectionRuntime: RuntimeContribution;
  readonly schedulingPort: SchedulingPort;
  readonly handlerRegistry: ScheduleOrchestrationHandlerRegistry;
  readonly sourceExecutor: {
    execute(task: ScheduleTask): Promise<{
      nextRunAt?: number | null;
      result?: Record<string, unknown>;
      disposition?: 'succeeded' | 'skipped' | 'failed' | 'dead_letter';
      error?: string;
    } | void>;
  };
}

export interface CreateScheduleOrchestrationModuleOptions {
  readonly taskProjection: ScheduleOrchestrationScheduleTaskProjectionDeps<TaskScheduleProjectionSource>;
  readonly goalProjection: ScheduleOrchestrationProjectionDeps<GoalScheduleProjectionSource>;
  readonly reminderProjection: ScheduleOrchestrationScheduleTaskProjectionDeps<ReminderScheduleProjectionSource>;
  readonly execution: ScheduleOrchestrationExecutionDeps;
  /** ROUTINE-3401 durable wall-clock lane; joining wires the handler + routine runtime. */
  readonly routineProjection?: ScheduleOrchestrationProjectionDeps<RoutineScheduleProjectionSource>;
}
