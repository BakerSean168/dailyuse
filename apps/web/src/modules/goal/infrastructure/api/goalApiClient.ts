import { apiClient } from '@/shared/api/instances';
import { GoalStatus } from '@dailyuse/contracts/goal';
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

/**
 * Goal API 客户端
 */
export class GoalApiClient {
  private readonly baseUrl = '/goals';

  // ===== Goal CRUD =====

  /**
   * 创建目标
   */
  async createGoal(request: CreateGoalRequest): Promise<GoalClientDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取目标列表
   */
  async getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<GoalsResponse> {
    // 默认包含子实体（KeyResults）
    const requestParams = {
      ...params,
      includeChildren: params?.includeChildren !== false, // 默认为 true
    };
    console.log('[goalApiClient.getGoals] 请求参数:', requestParams);
    const data = await apiClient.get(this.baseUrl, { params: requestParams });
    console.log('[goalApiClient.getGoals] 响应数据:', data);
    console.log('[goalApiClient.getGoals] Goals数量:', data.goals?.length || 0);
    console.log('[goalApiClient.getGoals] 第一个Goal的KeyResults:', data.goals?.[0]?.keyResults);
    return data;
  }

  /**
   * 获取目标详情
   */
  async getGoalById(uuid: string, includeChildren = true): Promise<GoalClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}?includeChildren=${includeChildren}`);
    return data;
  }

  /**
   * 更新目标
   */
  async updateGoal(
    uuid: string,
    request: UpdateGoalRequest,
  ): Promise<GoalClientDTO> {
    const data = await apiClient.patch(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除目标
   */
  async deleteGoal(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Goal 状态管理 =====

  /**
   * 激活目标
   */
  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return data;
  }

  /**
   * 暂停目标
   */
  async pauseGoal(uuid: string): Promise<GoalClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return data;
  }

  /**
   * 完成目标
   */
  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/complete`);
    return data;
  }

  /**
   * 归档目标
   */
  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/archive`);
    return data;
  }

  // ===== 搜索和过滤 =====

  /**
   * 搜索目标
   */
  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalsResponse> {
    const data = await apiClient.get(`${this.baseUrl}/search`, { params });
    return data;
  }

  // ===== DDD聚合根控制：KeyResult管理 =====

  /**
   * 为目标添加关键结果
   */
  async addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    // 构建完整的 AddKeyResultRequest
    const backendRequest: AddKeyResultRequest = {
      goalUuid,
      ...request,
    };

    const data = await apiClient.post(`${this.baseUrl}/${goalUuid}/key-results`, backendRequest);
    return data;
  }

  /**
   * 获取目标的所有关键结果
   */
  async getKeyResultsByGoal(goalUuid: string): Promise<KeyResultsResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${goalUuid}/key-results`);
    return data;
  }

  /**
   * 通过Goal聚合根更新关键结果
   */
  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResultClientDTO> {
    const data = await apiClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`,
      request,
    );
    return data;
  }

  /**
   * 通过Goal聚合根删除关键结果
   */
  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}`);
  }

  /**
   * 获取目标进度分解详情
   *
   * 返回目标进度的详细计算信息，包括每个关键结果的贡献度
   *
   * @param goalUuid - 目标 UUID
   * @returns 进度分解详情
   */
  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    const data = await apiClient.get(`${this.baseUrl}/${goalUuid}/progress-breakdown`);
    return data;
  }

  // ===== DDD聚合根控制：GoalReview管理 =====

  /**
   * 通过Goal聚合根创建目标复盘
   */
  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${goalUuid}/reviews`, request);
    return data;
  }

  /**
   * 获取目标的所有复盘
   */
  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalReviewsResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${goalUuid}/reviews`);
    return data;
  }

  /**
   * 通过Goal聚合根更新目标复盘
   */
  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<GoalReviewClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`, request);
    return data;
  }

  /**
   * 通过Goal聚合根删除目标复盘
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${goalUuid}/reviews/${reviewUuid}`);
  }

  // ===== DDD聚合根完整视图 =====

  /**
   * 获取Goal聚合根的完整视图
   * 包含目标、关键结果、记录、复盘等所有子实体
   */
  async getGoalAggregateView(goalUuid: string): Promise<GoalAggregateViewResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${goalUuid}/aggregate`);
    return data;
  }

  /**
   * 批量更新关键结果权重
   */
  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: {
      updates: Array<{
        keyResultUuid: string;
        weight: number;
      }>;
    },
  ): Promise<KeyResultsResponse> {
    const data = await apiClient.put(
      `${this.baseUrl}/${goalUuid}/key-results/batch-weight`,
      request,
    );
    return data;
  }

  /**
   * 克隆Goal聚合根
   */
  async cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<GoalClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${goalUuid}/clone`, request);
    return data;
  }

  // ===== AI Generation =====

  /**
   * AI 生成关键结果
   * Epic 2 API: 使用 startDate/endDate 替代 category/importance (urgency 已移除，priority 由后端计算)
   */
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
    const data = await apiClient.post('/ai/generate/key-results', request);
    return data;
  }

  // ===== GoalRecord 管理 =====

  /**
   * 创建目标记录
   */
  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    const data = await apiClient.post(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      request,
    );
    return data;
  }

  /**
   * 获取关键结果的所有记录
   */
  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    const data = await apiClient.get(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records`,
      { params },
    );
    return data;
  }

  /**
   * 获取目标的所有记录
   */
  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    const data = await apiClient.get(`${this.baseUrl}/${goalUuid}/records`, { params });
    return data;
  }

  /**
   * 删除目标记录
   */
  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    await apiClient.delete(
      `${this.baseUrl}/${goalUuid}/key-results/${keyResultUuid}/records/${recordUuid}`,
    );
  }
}

/**
 * GoalFolder API 客户端
 */
export class GoalFolderApiClient {
  private readonly baseUrl = '/goal-folders';

  // ===== GoalFolder CRUD =====

  /**
   * 创建目标目录
   */
  async createGoalFolder(
    request: CreateGoalFolderRequest,
  ): Promise<GoalFolderClientDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 获取目标目录列表
   */
  async getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentUuid?: string | null;
  }): Promise<GoalFolderListResponse> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取目标目录详情
   */
  async getGoalFolderById(uuid: string): Promise<GoalFolderClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新目标目录
   */
  async updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderRequest,
  ): Promise<GoalFolderClientDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除目标目录
   */
  async deleteGoalFolder(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }
}

// 导出单例实例
export const goalApiClient = new GoalApiClient();
export const goalFolderApiClient = new GoalFolderApiClient();




