/**
 * Schedule Event IPC Adapter
 *
 * IPC implementation of IScheduleEventApiClient for Electron desktop apps.
 */

import type { IScheduleEventApiClient } from '../../ports/schedule-event-api-client.port';
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

/**
 * IPC API interface for Electron renderer process
 */
interface IpcApi {
  invoke<T>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * ScheduleEventIpcAdapter
 *
 * IPC 实现的日程事件 API 客户端（用于 Electron 桌面应用）
 */
export class ScheduleEventIpcAdapter implements IScheduleEventApiClient {
  constructor(private readonly ipcApi: IpcApi) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.CREATE_SCHEDULE, data);
  }

  async getSchedule(uuid: string): Promise<ScheduleClientDTO> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULE, uuid);
  }

  async getSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULES_BY_ACCOUNT);
  }

  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<ScheduleClientDTO[]> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.GET_SCHEDULES_BY_TIME_RANGE, params);
  }

  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<ScheduleClientDTO> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.UPDATE_SCHEDULE, uuid, data);
  }

  async deleteSchedule(uuid: string): Promise<void> {
    await this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.DELETE_SCHEDULE, uuid);
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.GET_CONFLICTS, uuid);
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<ConflictDetectionResult> {
    return this.ipcApi.invoke(SCHEDULE_EVENT_CHANNELS.DETECT_CONFLICTS, params);
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }> {
    return this.ipcApi.invoke(
      SCHEDULE_EVENT_CHANNELS.CREATE_WITH_CONFLICT_DETECTION,
      request,
    );
  }

  async resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts: ConflictDetectionResult;
    applied: {
      strategy: string;
      previousStartTime?: number;
      previousEndTime?: number;
      changes: string[];
    };
  }> {
    return this.ipcApi.invoke(
      SCHEDULE_EVENT_CHANNELS.RESOLVE_CONFLICT,
      scheduleUuid,
      request,
    );
  }
}

/**
 * Factory function to create ScheduleEventIpcAdapter
 */
export function createScheduleEventIpcAdapter(ipcApi: IpcApi): ScheduleEventIpcAdapter {
  return new ScheduleEventIpcAdapter(ipcApi);
}
