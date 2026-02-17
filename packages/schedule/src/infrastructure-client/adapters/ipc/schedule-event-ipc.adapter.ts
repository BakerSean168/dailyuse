/**
 * Schedule Event IPC Adapter
 *
 * IPC implementation of IScheduleEventApiClient for Electron desktop apps.
 */

import type { Result } from '@dailyuse/contracts/result';
import { tryCatch } from '@dailyuse/contracts/result';
import type {
  IIpcClient,
  IScheduleEventApiClient,
} from '../types';
import type {
  CalendarEntryClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';

/**
 * IPC channel definitions for Schedule Event operations
 */
const SCHEDULE_EVENT_CHANNELS = {
  // CRUD
  CREATE_SCHEDULE: 'schedule:create',
  GET_SCHEDULE: 'schedule:get',
  GET_SCHEDULES_BY_ACCOUNT: 'schedule:list',
  GET_SCHEDULES_BY_TIME_RANGE: 'schedule:list-by-date-range',
  UPDATE_SCHEDULE: 'schedule:update',
  DELETE_SCHEDULE: 'schedule:delete',
  // Conflict Detection
  GET_CONFLICTS: 'schedule:get-conflicts',
  DETECT_CONFLICTS: 'schedule:detect-conflicts',
  CREATE_WITH_CONFLICT_DETECTION: 'schedule:create-with-conflict-detection',
  RESOLVE_CONFLICT: 'schedule:resolve-conflict',
} as const;

export class ScheduleEventIpcAdapter implements IScheduleEventApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<Result<CalendarEntryClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.CREATE_SCHEDULE, data));
  }

  async getSchedule(id: string): Promise<Result<CalendarEntryClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULE, id));
  }

  async getSchedulesByAccount(): Promise<Result<CalendarEntryClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULES_BY_ACCOUNT));
  }

  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<Result<CalendarEntryClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULES_BY_TIME_RANGE, params));
  }

  async updateSchedule(id: string, data: UpdateScheduleRequest): Promise<Result<CalendarEntryClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.UPDATE_SCHEDULE, id, data));
  }

  async deleteSchedule(id: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.DELETE_SCHEDULE, id));
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(id: string): Promise<Result<ConflictDetectionResult>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_CONFLICTS, id));
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): Promise<Result<ConflictDetectionResult>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.DETECT_CONFLICTS, params));
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: CalendarEntryClientDTO;
    conflicts?: ConflictDetectionResult;
  }>> {
    return tryCatch(() => this.ipcClient.invoke(
      SCHEDULE_EVENT_CHANNELS.CREATE_WITH_CONFLICT_DETECTION,
      request,
    ));
  }

  async resolveConflict(
    scheduleId: string,
    request: ResolveConflictRequest,
  ): Promise<Result<{
    schedule: CalendarEntryClientDTO;
    conflicts: ConflictDetectionResult;
    applied: {
      strategy: string;
      previousStartTime?: number;
      previousEndTime?: number;
      changes: string[];
    };
  }>> {
    return tryCatch(() => this.ipcClient.invoke(
      SCHEDULE_EVENT_CHANNELS.RESOLVE_CONFLICT,
      scheduleId,
      request,
    ));
  }
}

/**
 * Factory function to create ScheduleEventIpcAdapter
 */
export function createScheduleEventIpcAdapter(ipcClient: IIpcClient): ScheduleEventIpcAdapter {
  return new ScheduleEventIpcAdapter(ipcClient);
}
