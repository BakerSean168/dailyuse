import type {
  GoalServerDTO,
  KeyResultServerDTO,
  GoalClientDTO,
  KeyResultClientDTO,
  CreateGoalRequest,
  GoalsResponse,
  UpdateGoalRequest,
  AddKeyResultRequest,
  KeyResultsResponse,
  UpdateKeyResultRequest,
  ProgressBreakdown,
  CreateGoalReviewRequest,
  GoalReviewClientDTO,
  GoalReviewsResponse,
  GoalAggregateViewResponse,
  CreateGoalRecordRequest,
  GoalRecordClientDTO,
  GoalRecordsResponse,
  CreateGoalFolderRequest,
  GoalFolderClientDTO,
  GoalFolderListResponse,
  UpdateGoalFolderRequest,
} from '@dailyuse/contracts/goal';

// 这是一个接口/抽象层 - 具体实现由消费端提供
export interface IHttpClient {
  post<T>(url: string, data?: any): Promise<T>;
  get<T>(url: string, config?: any): Promise<T>;
  put<T>(url: string, data?: any): Promise<T>;
  patch<T>(url: string, data?: any): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

/**
 * Goal API 客户端 - 框架无关版本
 */
export class GoalApiClient {
  private readonly baseUrl = '/goals';

  constructor(private httpClient: IHttpClient) {}

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
    await this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Goal 状态管理 =====

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

  // ===== 搜索和过滤 =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalsResponse> {
    return this.httpClient.get(`${this.baseUrl}/search`, { params });
  }

  // ===== DDD聚合根控制：KeyResult管理 =====

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
    await this.httpClient.delete(`${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`);
  }

  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/progress-breakdown`);
  }

  // ===== DDD聚合根控制：GoalReview管理 =====

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
    await this.httpClient.delete(`${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`);
  }

  // ===== DDD聚合根完整视图 =====

  async getGoalAggregateView(goalUuid: string): Promise<GoalAggregateViewResponse> {
    return this.httpClient.get(`${this.baseUrl}/${goalUuid}/aggregate`);
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
    keyResults: any[];
    tokenUsage: any;
    generatedAt: number;
  }> {
    return this.httpClient.post('/ai/generate/key-results', request);
  }

  // ===== GoalRecord 管理 =====

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
    await this.httpClient.delete(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records/${recordUuid}`,
    );
  }
}

/**
 * GoalFolder API 客户端
 */
export class GoalFolderApiClient {
  private readonly baseUrl = '/goal-folders';

  constructor(private httpClient: IHttpClient) {}

  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolderClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string | null;
  }): Promise<GoalFolderListResponse> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getGoalFolderById(uuid: string): Promise<GoalFolderClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderRequest,
  ): Promise<GoalFolderClientDTO> {
    return this.httpClient.put(`${this.baseUrl}/${uuid}`, request);
  }

  async deleteGoalFolder(uuid: string): Promise<void> {
    await this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }
}
