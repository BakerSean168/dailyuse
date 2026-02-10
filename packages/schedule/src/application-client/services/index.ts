/**
 * Schedule Module Services
 */

// Container
export { ScheduleContainer } from '@/infrastructure-client';

// Events
export {
  ScheduleTaskEvents,
  ScheduleEventEvents,
  type ScheduleTaskRefreshEvent,
  type ScheduleEventRefreshEvent,
  type ScheduleConflictEvent,
} from './schedule-events';

// ===== Schedule Task Use Cases =====

export { CreateScheduleTask } from './create-schedule-task';
export { CreateScheduleTasksBatch } from './create-schedule-tasks-batch';
export { ListScheduleTasks } from './list-schedule-tasks';
export { GetScheduleTask } from './get-schedule-task';
export { GetDueTasks } from './get-due-tasks';
export { GetTaskBySource } from './get-task-by-source';
export { PauseScheduleTask } from './pause-schedule-task';
export { ResumeScheduleTask } from './resume-schedule-task';
export { CompleteScheduleTask } from './complete-schedule-task';
export { CancelScheduleTask } from './cancel-schedule-task';
export { DeleteScheduleTask } from './delete-schedule-task';
export { DeleteScheduleTasksBatch } from './delete-schedule-tasks-batch';
export { UpdateTaskMetadata } from './update-task-metadata';
export { GetScheduleStatistics } from './get-schedule-statistics';
export { GetModuleStatistics } from './get-module-statistics';
export { GetAllModuleStatistics } from './get-all-module-statistics';
export { RecalculateStatistics } from './recalculate-statistics';
export { ResetStatistics } from './reset-statistics';
export { DeleteStatistics } from './delete-statistics';

// ===== Schedule Event Use Cases =====

export { CreateScheduleEvent } from './create-schedule-event';
export { GetScheduleEvent } from './get-schedule-event';
export { ListSchedulesByAccount } from './list-schedules-by-account';
export { GetSchedulesByTimeRange } from './get-schedules-by-time-range';
export { UpdateScheduleEvent } from './update-schedule-event';
export { DeleteScheduleEvent } from './delete-schedule-event';
export { GetScheduleConflicts } from './get-schedule-conflicts';

// ===== Schedule Conflict Use Cases =====

export { DetectConflicts } from './detect-conflicts';
export { CreateScheduleWithConflict } from './create-schedule-with-conflict';
export { ResolveConflict } from './resolve-conflict';
