import type {
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '../api/requests/schedule-requests';
import type { ScheduleTaskQueryParamsDTO } from '../api/requests/schedule-task-requests';
import type { ScheduleExecutionQueryParamsDTO } from '../api/requests/schedule-execution-requests';
import type { ScheduleOperationSuccessResponseDTO } from '../api/requests/common-responses';
import type { CalendarEntryClientDTO } from '../aggregates/calendar-entry-client';
import type { ScheduleTaskClientDTO } from '../aggregates/schedule-task-client';
import type { ScheduleExecutionClientDTO } from '../entities/schedule-execution-client';
import type { ConflictDetectionResult } from '../value-objects/conflict-detection-result';

// === Schedule Module RPC Map ===
export type ScheduleRpcMap = {
  // === Schedule (Calendar Events) Operations ===
  'schedule:create': [CreateScheduleRequest, CalendarEntryClientDTO];
  'schedule:update': [UpdateScheduleRequest, CalendarEntryClientDTO];
  'schedule:delete': [{ scheduleId: string }, ScheduleOperationSuccessResponseDTO];
  'schedule:get-by-range': [{ startTime: number; endTime: number }, CalendarEntryClientDTO[]];
  'schedule:detect-conflicts': [
    { startTime: number; endTime: number; excludeId?: string },
    ConflictDetectionResult,
  ];
  'schedule:resolve-conflict': [
    { resolution: string; newStartTime?: number; newEndTime?: number; newDuration?: number },
    CalendarEntryClientDTO,
  ];

  // === Schedule Task Operations ===
  'schedule-task:create': [unknown, ScheduleTaskClientDTO];
  'schedule-task:update': [unknown, ScheduleTaskClientDTO];
  'schedule-task:delete': [{ taskId: string }, ScheduleOperationSuccessResponseDTO];
  'schedule-task:query': [ScheduleTaskQueryParamsDTO, unknown];
  'schedule-task:enable': [{ taskId: string }, ScheduleTaskClientDTO];
  'schedule-task:disable': [{ taskId: string }, ScheduleTaskClientDTO];
  'schedule-task:update-config': [unknown, ScheduleTaskClientDTO];
  'schedule-task:update-metadata': [unknown, ScheduleTaskClientDTO];

  // === Schedule Execution Records ===
  'schedule-execution:query': [
    ScheduleExecutionQueryParamsDTO,
    { items: ScheduleExecutionClientDTO[]; total: number; page: number; limit: number },
  ];
  'schedule-execution:get-stats': [{ taskId: string }, unknown];
};
