/**
 * Goal API Client Port Interface
 *
 * Defines the contract for Goal API operations.
 * Implementations: GoalHttpAdapter (web), GoalIpcAdapter (desktop)
 */

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
 * Goal API Client Interface
 */
export interface IGoalApiClient {
  // ===== Goal CRUD =====

  /** 创建目标 */
  createGoal(request: CreateGoalRequest): Promise<GoalClientDTO>;

  /** 获取目标列表 */
  getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<GoalsResponse>;

  /** 获取目标详情 */
  getGoalById(uuid: string, includeChildren?: boolean): Promise<GoalClientDTO>;

  /** 更新目标 */
  updateGoal(uuid: string, request: UpdateGoalRequest): Promise<GoalClientDTO>;

  /** 删除目标 */
  deleteGoal(uuid: string): Promise<void>;

  // ===== Goal Status =====

  /** 激活目标 */
  activateGoal(uuid: string): Promise<GoalClientDTO>;

  /** 暂停目标 */
  pauseGoal(uuid: string): Promise<GoalClientDTO>;

  /** 完成目标 */
  completeGoal(uuid: string): Promise<GoalClientDTO>;

  /** 归档目标 */
  archiveGoal(uuid: string): Promise<GoalClientDTO>;

  // ===== Search =====

  /** 搜索目标 */
  searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalsResponse>;

  // ===== KeyResult Management (via Goal Aggregate) =====

  /** 为目标添加关键结果 */
  addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO>;

  /** 获取目标的所有关键结果 */
  getKeyResultsByGoal(goalUuid: string): Promise<KeyResultsResponse>;

  /** 更新关键结果 */
  updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResultClientDTO>;

  /** 删除关键结果 */
  deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void>;

  /** 批量更新关键结果权重 */
  batchUpdateKeyResultWeights(
    goalUuid: string,
    request: {
      updates: Array<{
        keyResultUuid: string;
        weight: number;
      }>;
    },
  ): Promise<KeyResultsResponse>;

  /** 获取目标进度分解详情 */
  getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown>;

  // ===== GoalReview Management =====

  /** 创建目标复盘 */
  createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO>;

  /** 获取目标的所有复盘 */
  getGoalReviewsByGoal(goalUuid: string): Promise<GoalReviewsResponse>;

  /** 更新目标复盘 */
  updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<GoalReviewClientDTO>;

  /** 删除目标复盘 */
  deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void>;

  // ===== GoalRecord Management =====

  /** 创建目标记录 */
  createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO>;

  /** 获取关键结果的所有记录 */
  getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse>;

  /** 获取目标的所有记录 */
  getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse>;

  /** 删除目标记录 */
  deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void>;

  // ===== DDD Aggregate View =====

  /** 获取Goal聚合根的完整视图 */
  getGoalAggregateView(goalUuid: string): Promise<GoalAggregateViewResponse>;

  /** 克隆Goal聚合根 */
  cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<GoalClientDTO>;

  // ===== AI Generation =====

  /** AI 生成关键结果 */
  generateKeyResults(request: {
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
  }>;
}
