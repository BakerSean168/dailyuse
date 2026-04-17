import type { CalendarEntryClientDTO } from '../aggregates/calendar-entry-client';
import type { ScheduleTaskClientDTO } from '../aggregates/schedule-task-client';
import type { ScheduleExecutionClientDTO } from '../entities/schedule-execution-client';

export interface ScheduleDashboardDTO {
  entries: CalendarEntryClientDTO[];
  tasks: ScheduleTaskClientDTO[];
  recentExecutions: ScheduleExecutionClientDTO[];
}
