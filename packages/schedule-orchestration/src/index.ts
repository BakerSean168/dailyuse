/**
 * @memoflow/schedule-orchestration
 *
 * System-level orchestration for schedule projections and source execution.
 * 负责把跨 feature 的 schedule owner 收回成一个更深的 Module。
 */

export { createScheduleOrchestrationModule } from './infrastructure-server';
export type {
  CreateScheduleOrchestrationModuleOptions,
  ScheduleOrchestrationHandlerRegistry,
  ScheduleOrchestrationModule,
  ScheduleOrchestrationProjectionDeps,
  ScheduleOrchestrationScheduleTaskProjectionDeps,
} from './ports/projection';
export type { ScheduleOrchestrationExecutionDeps } from './ports/execution';
export type { RuntimeContribution } from './ports/runtime-contribution';

export { createReminderSchedulerDueSetReader } from './shadow/reminder-due-set-shadow';
