/**
 * Goal HTTP Adapter
 *
 * HTTP implementation of IGoalApiClient using ResultHttpClient.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalApiClient, IResultHttpClient } from '../types';
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
  ProgressBreakdown,
  CreateGoalReq,
  UpdateGoalReq,
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
    status?: string;
    dirUuid?: string;
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

  async getGoalById(
    uuid: string,
    includeChildren = true,
  ): Promise<Result<GoalClientDTO>> {
    return this.httpClient.get(
      `${this.baseUrl}/${uuid}?includeChildren=${includeChildren}`,
    );
  }

  async updateGoal(
    uuid: string,
    request: UpdateGoalReq,
  ): Promise<Result<GoalClientDTO>> {
    return this.httpClient.patch(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteGoal(uuid: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/activate`);
  }

  async pauseGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/pause`);
  }

  async completeGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/complete`);
  }

  async archiveGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/archive`);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<Result<QueryGoalsRes>> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params });
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultReq, 'goalUuid'>,
  ): Promise<Result<KeyResultClientDTO>> {
    const backendRequest: AddKeyResultReq = { goalUuid, ...request };
    return this.httpClient.post(
      `${this.baseUrl}/${goalUuid}/key-results`,
      backendRequest,
    );
  }

  async getKeyResultsByGoal(
    goalUuid: string,
  ): Promise<Result<GetKeyResultsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/key-results`);
  }

  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.httpClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`,
      request,
    );
  }

  async deleteKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<Result<void>> {
    return this.httpClient.delete(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`,
    );
  }

  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: { updates: Array<{ keyResultUuid: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>> {
    return this.httpClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/batch-weight`,
      request,
    );
  }

  async getProgressBreakdown(
    goalUuid: string,
  ): Promise<Result<ProgressBreakdown>> {
    return this.httpClient.get(
      `${this.baseUrl}/${goalUuid}/progress-breakdown`,
    );
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.httpClient.post(
      `${this.baseUrl}/${goalUuid}/reviews`,
      request,
    );
  }

  async getGoalReviewsByGoal(
    goalUuid: string,
  ): Promise<Result<GetGoalReviewsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/reviews`);
  }

  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.httpClient.put(
      `${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`,
      request,
    );
  }

  async deleteGoalReview(
    goalUuid: string,
    reviewUuid: string,
  ): Promise<Result<void>> {
    return this.httpClient.delete(
      `${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`,
    );
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>> {
    return this.httpClient.post(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      request,
    );
  }

  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.httpClient.get(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      { params },
    );
  }

  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/records`, {
      params,
    });
  }

  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<Result<void>> {
    return this.httpClient.delete(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records/${recordUuid}`,
    );
  }

  // ===== Aggregate View =====

  async getGoalAggregateView(
    goalUuid: string,
  ): Promise<Result<GetGoalAggregateRes>> {
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
  ): Promise<Result<GoalClientDTO>> {
    return this.httpClient.post(`${this.baseUrl}/${goalUuid}/clone`, request);
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
