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

export interface ScheduleOrchestrationModule {
  readonly projectionRuntime: RuntimeContribution;
  readonly sourceExecutor: {
    execute(task: ScheduleTask): Promise<{
      nextRunAt?: number | null;
      result?: Record<string, unknown>;
    } | void>;
  };
}

export interface CreateScheduleOrchestrationModuleOptions {
  readonly taskProjection: ScheduleOrchestrationProjectionDeps<TaskScheduleProjectionSource>;
  readonly goalProjection: ScheduleOrchestrationProjectionDeps<GoalScheduleProjectionSource>;
  readonly reminderProjection: ScheduleOrchestrationProjectionDeps<ReminderScheduleProjectionSource>;
  readonly execution: ScheduleOrchestrationExecutionDeps;
}
