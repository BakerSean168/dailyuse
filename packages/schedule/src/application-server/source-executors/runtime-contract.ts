import type { ScheduleTask } from '../../domain-server/aggregates/schedule-task';

export interface ScheduleTaskExecutionResult {
  readonly nextRunAt?: number | null;
  readonly result?: Record<string, unknown>;
}

export interface ScheduleTaskSourceExecutor {
  execute(task: ScheduleTask): Promise<ScheduleTaskExecutionResult | void>;
}
