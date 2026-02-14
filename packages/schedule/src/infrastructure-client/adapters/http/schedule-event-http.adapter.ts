/**
 * Schedule Event HTTP Adapter
 *
 * HTTP implementation of IScheduleEventApiClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
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
 * ScheduleEventHttpAdapter
 *
 * HTTP 实现的日程事件 API 客户端
 */
export class ScheduleEventHttpAdapter implements IScheduleEventApiClient {
  private readonly baseUrl = '/schedules/events';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<Result<ScheduleClientDTO>> {
    return this.httpClient.post(this.baseUrl, data);
  }

  async getSchedule(uuid: string): Promise<Result<ScheduleClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async getSchedulesByAccount(): Promise<Result<ScheduleClientDTO[]>> {
    return this.httpClient.get(this.baseUrl);
  }

  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<Result<ScheduleClientDTO[]>> {
    return this.httpClient.get(this.baseUrl, { params: params as unknown as Record<string, unknown> });
  }

  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<Result<ScheduleClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}`, data);
  }

  async deleteSchedule(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(uuid: string): Promise<Result<ConflictDetectionResult>> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}/conflicts`);
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<Result<ConflictDetectionResult>> {
    return this.httpClient.post(`${this.baseUrl}/conflicts/detect`, params);
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }>> {
    return this.httpClient.post(`${this.baseUrl}/with-conflict-detection`, request);
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
    return this.httpClient.post(`${this.baseUrl}/${scheduleUuid}/resolve-conflict`, request);
  }
}

/**
 * Factory function to create ScheduleEventHttpAdapter
 */
export function createScheduleEventHttpAdapter(httpClient: IResultHttpClient): ScheduleEventHttpAdapter {
  return new ScheduleEventHttpAdapter(httpClient);
}
