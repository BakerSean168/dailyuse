/**
 * Schedule Module - Aggregates
 * 调度模块 - 聚合根统一导出
 */

// ============ CalendarEntry Aggregate ============
export type {
  CalendarEntryServerDTO,
} from './calendar-entry-server';

export type {
  CalendarEntryClientDTO,
} from './calendar-entry-client';

// ============ Backward Compatibility (Deprecated) ============
export type {
  ScheduleJobServerDTO,
} from './schedule-job-server';

export type {
  ScheduleJobClientDTO,
} from './schedule-job-client';

// ============ ScheduleTask Aggregate ============
export type {
  ScheduleTaskServerDTO,
} from './schedule-task-server';

export type {
  ScheduleTaskClientDTO,
} from './schedule-task-client';
