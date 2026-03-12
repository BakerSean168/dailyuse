/**
 * Goal HTTP Adapter
 *
 * HTTP implementation of IGoalApiClient using ResultHttpClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalApiClient, IResultHttpClient } from '../types';
import type { GoalId } from '@dailyuse/contracts/primitives';
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
  ProgressBreakdown,
  CreateGoalReq,
  UpdateGoalReq,
  CloneGoalReq,
  QueryGoalsRes,
  AddKeyResultReq,
  UpdateKeyResultReq,
  GetKeyResultsRes,
  CreateGoalReviewReq,
  GetGoalReviewsRes,
  CreateGoalRecordReq,
  GetGoalRecordsRes,
  GetGoalAggregateRes,
} from '@dailyuse/contracts/goal';

export class GoalHttpAdapter implements IGoalApiClient {
  private readonly baseUrl = '/goals';

  constructor(private readonly httpClient: IResultHttpClient) {}

  // ===== Goal CRUD =====

  async createGoal(request: CreateGoalReq): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGoals(params?: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    dirId?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>> {
    const requestParams = {
      ...params,
      includeChildren: params?.includeChildren !== false,
    };
    return this.httpClient.get(this.baseUrl, { params: requestParams });
  }

  async getGoalById(id: string, includeChildren = true): Promise<Result<GoalClientDTO>> {
    return this.httpClient.get(`${this.baseUrl}/${id}?includeChildren=${includeChildren}`);
  }

  async updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/${id}`, request);
  }

  async deleteGoal(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Goal Status =====

  async activateGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/activate`);
  }

  async pauseGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/pause`);
  }

  async completeGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/complete`);
  }

  async archiveGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${id}/archive`);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirId?: string;
  }): Promise<Result<QueryGoalsRes>> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params });
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<KeyResultClientDTO>> {
    const backendRequest: AddKeyResultReq = { goalId: goalId as GoalId, ...request };
    return this.httpClient.post(`${this.baseUrl}/${goalId}/key-results`, backendRequest);
  }

  async getKeyResultsByGoal(goalId: string): Promise<Result<GetKeyResultsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalId}/key-results`);
  }

  async updateKeyResultForGoal(
    goalId: string,
    keyResultId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/${goalId}/key-results/${keyResultId}`, request);
  }

  async deleteKeyResultForGoal(goalId: string, keyResultId: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${goalId}/key-results/${keyResultId}`);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    request: { updates: Array<{ keyResultId: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>> {
    return this.httpClient.put(`${this.baseUrl}/${goalId}/key-results/batch-weight`, request);
  }

  async getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>> {
    return this.httpClient.get(`${this.baseUrl}/${goalId}/progress-breakdown`);
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${goalId}/reviews`, request);
  }

  async getGoalReviewsByGoal(goalId: string): Promise<Result<GetGoalReviewsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalId}/reviews`);
  }

  async updateGoalReview(
    goalId: string,
    reviewId: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.httpClient.put(`${this.baseUrl}/${goalId}/reviews/${reviewId}`, request);
  }

  async deleteGoalReview(goalId: string, reviewId: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${goalId}/reviews/${reviewId}`);
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalId: string,
    keyResultId: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>> {
    return this.httpClient.post(
      `${this.baseUrl}/${goalId}/key-results/${keyResultId}/records`,
      request,
    );
  }

  async getGoalRecordsByKeyResult(
    goalId: string,
    keyResultId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalId}/key-results/${keyResultId}/records`, {
      params,
    });
  }

  async getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalId}/records`, {
      params,
    });
  }

  async deleteGoalRecord(
    goalId: string,
    keyResultId: string,
    recordId: string,
  ): Promise<Result<void>> {
    return this.httpClient.delete(
      `${this.baseUrl}/${goalId}/key-results/${keyResultId}/records/${recordId}`,
    );
  }

  // ===== Aggregate View =====

  async getGoalAggregateView(goalId: string): Promise<Result<GetGoalAggregateRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalId}/aggregate`);
  }

  async cloneGoal(
    goalId: string,
    request: CloneGoalReq,
  ): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${goalId}/clone`, request);
  }

  // ===== AI Generation =====

  async generateKeyResults(request: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }): Promise<
    Result<{
      keyResults: Array<{
        title: string;
        description?: string;
        targetValue?: number;
        unit?: string;
      }>;
      tokenUsage: unknown;
      generatedAt: number;
    }>
  > {
    return this.httpClient.post('/ai/generate/key-results', request);
  }
}
