import type {
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleTaskQueryParamsDTO,
  ScheduleExecutionQueryParamsDTO,
  ScheduleOperationSuccessResponseDTO,
} from '../api';
import type { CalendarEntryClientDTO, ScheduleTaskClientDTO } from '../aggregates';
import type { ScheduleExecutionClientDTO } from '../entities';
import type { ConflictDetectionResult } from '../value-objects';

// === Schedule Module RPC Map ===
export type ScheduleRpcMap = {
  // === Schedule (Calendar Events) Operations ===
  'schedule:create': [CreateScheduleRequest, CalendarEntryClientDTO];
  'schedule:update': [UpdateScheduleRequest, CalendarEntryClientDTO];
  'schedule:delete': [{ scheduleId: string }, ScheduleOperationSuccessResponseDTO];
  'schedule:get-by-range': [{ startTime: number; endTime: number; identityId?: string }, CalendarEntryClientDTO[]];
  'schedule:detect-conflicts': [{ userId: string; startTime: number; endTime: number; excludeId?: string }, ConflictDetectionResult];
  'schedule:resolve-conflict': [{ resolution: string; newStartTime?: number; newEndTime?: number; newDuration?: number }, CalendarEntryClientDTO];
  
  // === Schedule Task Operations ===
  'schedule-task:create': [any, ScheduleTaskClientDTO];
  'schedule-task:update': [any, ScheduleTaskClientDTO];
  'schedule-task:delete': [{ taskId: string }, ScheduleOperationSuccessResponseDTO];
  'schedule-task:query': [ScheduleTaskQueryParamsDTO, any];
  'schedule-task:enable': [{ taskId: string }, ScheduleTaskClientDTO];
  'schedule-task:disable': [{ taskId: string }, ScheduleTaskClientDTO];
  'schedule-task:update-config': [any, ScheduleTaskClientDTO];
  'schedule-task:update-metadata': [any, ScheduleTaskClientDTO];
  
  // === Schedule Execution Records ===
  'schedule-execution:query': [ScheduleExecutionQueryParamsDTO, { items: ScheduleExecutionClientDTO[]; total: number; page: number; limit: number }];
  'schedule-execution:get-stats': [{ taskId: string }, any];
};

