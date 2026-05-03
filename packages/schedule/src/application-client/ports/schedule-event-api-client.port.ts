/**
 * Schedule Event API Client Port
 *
 * Transport-agnostic interface for Schedule Event API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/schedule.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  CalendarEntryClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';

/**
 * IScheduleEventApiClient
 *
 * 日程事件 API 客户端接口
 */
export interface IScheduleEventApiClient {
  // ===== Schedule Event CRUD =====
  createSchedule(data: CreateScheduleRequest): Promise<Result<CalendarEntryClientDTO>>;
  getSchedule(id: string): Promise<Result<CalendarEntryClientDTO>>;
  getSchedulesByAccount(): Promise<Result<CalendarEntryClientDTO[]>>;
  getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<Result<CalendarEntryClientDTO[]>>;
  updateSchedule(id: string, data: UpdateScheduleRequest): Promise<Result<CalendarEntryClientDTO>>;
  deleteSchedule(id: string): Promise<Result<void>>;

  // ===== Schedule Conflict Detection =====
  getScheduleConflicts(id: string): Promise<Result<ConflictDetectionResult>>;
  detectConflicts(params: {
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): Promise<Result<ConflictDetectionResult>>;
  createScheduleWithConflictDetection(request: CreateScheduleRequest): Promise<
    Result<{
      schedule: CalendarEntryClientDTO;
      conflicts?: ConflictDetectionResult;
    }>
  >;
  resolveConflict(
    scheduleId: string,
    request: ResolveConflictRequest,
  ): Promise<
    Result<{
      schedule: CalendarEntryClientDTO;
      conflicts: ConflictDetectionResult;
      applied: {
        strategy: string;
        previousStartTime?: number;
        previousEndTime?: number;
        changes: string[];
      };
    }>
  >;
}
