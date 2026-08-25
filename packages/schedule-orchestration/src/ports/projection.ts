import type {
  ScheduledHandlerRegistration,
  SchedulingPort,
} from '@memoflow/contracts/schedule';
import type { GoalScheduleProjectionSource } from '@memoflow/goal/schedule-projection';
import type { ReminderScheduleProjectionSource } from '@memoflow/reminder/schedule-projection';
import type { IScheduleTaskRepository, ScheduleTask } from '@memoflow/schedule';
import type { TaskScheduleProjectionSource } from '@memoflow/task/schedule-projection';
import type { ScheduleOrchestrationExecutionDeps } from './execution';
import type { RuntimeContribution } from './runtime-contribution';

export interface ScheduleOrchestrationProjectionDeps<TSource> {
  readonly source: TSource;
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
  readonly taskProjection: ScheduleOrchestrationProjectionDeps<TaskScheduleProjectionSource>;
  readonly goalProjection: ScheduleOrchestrationProjectionDeps<GoalScheduleProjectionSource>;
  readonly reminderProjection: ScheduleOrchestrationProjectionDeps<ReminderScheduleProjectionSource>;
  readonly execution: ScheduleOrchestrationExecutionDeps;
}
