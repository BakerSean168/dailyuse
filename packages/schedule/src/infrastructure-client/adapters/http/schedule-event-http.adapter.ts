/**
 * Schedule Event HTTP Adapter
 *
 * HTTP implementation of IScheduleEventApiClient.
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
import type { IHttpClient } from '../../../shared/http-client.types';

/**
 * ScheduleEventHttpAdapter
 *
 * HTTP 实现的日程事件 API 客户端
 */
export class ScheduleEventHttpAdapter implements IScheduleEventApiClient {
  private readonly baseUrl = '/schedules/events';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO> {
    return this.httpClient.post(this.baseUrl, data);
  }

  async getSchedule(uuid: string): Promise<ScheduleClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async getSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    return this.httpClient.get(this.baseUrl);
  }

  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<ScheduleClientDTO[]> {
    return this.httpClient.get(this.baseUrl, { params: params as unknown as Record<string, unknown> });
  }

  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<ScheduleClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}`, data);
  }

  async deleteSchedule(uuid: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}/conflicts`);
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<ConflictDetectionResult> {
    return this.httpClient.post(`${this.baseUrl}/conflicts/detect`, params);
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }> {
    return this.httpClient.post(`${this.baseUrl}/with-conflict-detection`, request);
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
    return this.httpClient.post(`${this.baseUrl}/${scheduleUuid}/resolve-conflict`, request);
  }
}

/**
 * Factory function to create ScheduleEventHttpAdapter
 */
export function createScheduleEventHttpAdapter(httpClient: IHttpClient): ScheduleEventHttpAdapter {
  return new ScheduleEventHttpAdapter(httpClient);
}
