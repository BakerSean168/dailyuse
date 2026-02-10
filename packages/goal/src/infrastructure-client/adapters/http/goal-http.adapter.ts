/**
 * Goal HTTP Adapter
 *
 * HTTP implementation of IGoalApiClient.
 * Extracted from apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts
 */

import type { IGoalApiClient } from '../../ports/goal-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
import type {
  GoalClientDTO,
  GoalsResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  KeyResultClientDTO,
  KeyResultsResponse,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  ProgressBreakdown,
  GoalReviewClientDTO,
  GoalReviewsResponse,
  CreateGoalReviewRequest,
  GoalRecordClientDTO,
  GoalRecordsResponse,
  CreateGoalRecordRequest,
  GoalAggregateViewResponse,
} from '@dailyuse/contracts/goal';

/**
 * Goal HTTP Adapter
 *
 * Implements IGoalApiClient using HTTP REST API calls.
 */
export class GoalHttpAdapter implements IGoalApiClient {
  private readonly baseUrl = '/goals';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Goal CRUD =====

  async createGoal(request: CreateGoalRequest): Promise<GoalClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<GoalsResponse> {
    const requestParams = {
      ...params,
      includeChildren: params?.includeChildren !== false,
    };
    return this.httpClient.get(this.baseUrl, { params: requestParams });
  }

  async getGoalById(uuid: string, includeChildren = true): Promise<GoalClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}?includeChildren=${includeChildren}`);
  }

  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<GoalClientDTO> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteGoal(uuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/activate`);
  }

  async pauseGoal(uuid: string): Promise<GoalClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/pause`);
  }

  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/complete`);
  }

  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/archive`);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalsResponse> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params });
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    const backendRequest: AddKeyResultRequest = {
      goalUuid,
      ...request,
    };
    return this.httpClient.post(`${this.baseUrl}/${goalUuid}/key-results`, backendRequest);
  }

  async getKeyResultsByGoal(goalUuid: string): Promise<KeyResultsResponse> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/key-results`);
  }

  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResultClientDTO> {
    return this.httpClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`,
      request,
    );
  }

  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`);
  }

  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: {
      updates: Array<{
        keyResultUuid: string;
        weight: number;
      }>;
    },
  ): Promise<KeyResultsResponse> {
    return this.httpClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/batch-weight`,
      request,
    );
  }

  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/progress-breakdown`);
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${goalUuid}/reviews`, request);
  }

  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalReviewsResponse> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/reviews`);
  }

  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<GoalReviewClientDTO> {
    return this.httpClient.put(`${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`, request);
  }

  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`);
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    return this.httpClient.post(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      request,
    );
  }

  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.httpClient.get(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      { params },
    );
  }

  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/records`, { params });
  }

  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    return this.httpClient.delete(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records/${recordUuid}`,
    );
  }

  // ===== DDD Aggregate View =====

  async getGoalAggregateView(goalUuid: string): Promise<GoalAggregateViewResponse> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/aggregate`);
  }

  async cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<GoalClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${goalUuid}/clone`, request);
  }

  // ===== AI Generation =====

  async generateKeyResults(request: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }): Promise<{
    keyResults: Array<{
      title: string;
      description?: string;
      targetValue?: number;
      unit?: string;
    }>;
    tokenUsage: unknown;
    generatedAt: number;
  }> {
    return this.httpClient.post('/ai/generate/key-results', request);
  }
}

/**
 * Factory function to create GoalHttpAdapter
 */
export function createGoalHttpAdapter(httpClient: HttpClient): IGoalApiClient {
  return new GoalHttpAdapter(httpClient);
}
