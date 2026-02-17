import type { CalendarEntryClientDTO, ScheduleTaskClientDTO } from '../aggregates';
import type { ScheduleExecutionClientDTO } from '../entities';

export interface ScheduleDashboardDTO {
  entries: CalendarEntryClientDTO[];
  tasks: ScheduleTaskClientDTO[];
  recentExecutions: ScheduleExecutionClientDTO[];
}
