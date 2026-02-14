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
  ScheduleClientDTO,
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
  CREATE_SCHEDULE: 'schedule:event:create',
  GET_SCHEDULE: 'schedule:event:get',
  GET_SCHEDULES_BY_ACCOUNT: 'schedule:event:get-by-account',
  GET_SCHEDULES_BY_TIME_RANGE: 'schedule:event:get-by-time-range',
  UPDATE_SCHEDULE: 'schedule:event:update',
  DELETE_SCHEDULE: 'schedule:event:delete',
  // Conflict Detection
  GET_CONFLICTS: 'schedule:event:get-conflicts',
  DETECT_CONFLICTS: 'schedule:event:detect-conflicts',
  CREATE_WITH_CONFLICT_DETECTION: 'schedule:event:create-with-conflict-detection',
  RESOLVE_CONFLICT: 'schedule:event:resolve-conflict',
} as const;

export class ScheduleEventIpcAdapter implements IScheduleEventApiClient {
  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<Result<ScheduleClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.CREATE_SCHEDULE, data));
  }

  async getSchedule(uuid: string): Promise<Result<ScheduleClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULE, uuid));
  }

  async getSchedulesByAccount(): Promise<Result<ScheduleClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULES_BY_ACCOUNT));
  }

  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<Result<ScheduleClientDTO[]>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULES_BY_TIME_RANGE, params));
  }

  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<Result<ScheduleClientDTO>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.UPDATE_SCHEDULE, uuid, data));
  }

  async deleteSchedule(uuid: string): Promise<Result<void>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.DELETE_SCHEDULE, uuid));
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(uuid: string): Promise<Result<ConflictDetectionResult>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.GET_CONFLICTS, uuid));
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<Result<ConflictDetectionResult>> {
    return tryCatch(() => this.ipcClient.invoke(SCHEDULE_EVENT_CHANNELS.DETECT_CONFLICTS, params));
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }>> {
    return tryCatch(() => this.ipcClient.invoke(
      SCHEDULE_EVENT_CHANNELS.CREATE_WITH_CONFLICT_DETECTION,
      request,
    ));
  }

  async resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<Result<{
    schedule: ScheduleClientDTO;
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
      scheduleUuid,
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
