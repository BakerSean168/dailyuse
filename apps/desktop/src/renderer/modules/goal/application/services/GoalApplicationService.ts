/**
 * Goal Application Service - Renderer
 *
 * 目标应用服务 - 渲染进程
 * 
 * EPIC-015 重构: 添加 DTO→Entity 转换
 * - 所有返回值使用 Entity 类型
 * - 使用 Entity.fromClientDTO() 进行转换
 */

import {
  // Goal Use Cases
  ListGoals,
  GetGoal,
  CreateGoal,
  UpdateGoal,
  DeleteGoal,
  ActivateGoal,
  PauseGoal,
  CompleteGoal,
  ArchiveGoal,
  CloneGoal,
  SearchGoals,
  // Key Result Use Cases
  GetKeyResults,
  CreateKeyResult,
  UpdateKeyResult,
  DeleteKeyResult,
  // Folder Use Cases
  ListGoalFolders,
  GetGoalFolder,
  CreateGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  // Record Use Cases
  GetGoalRecordsByGoal,
  CreateGoalRecord,
  DeleteGoalRecord,
  // Review Use Cases
  GetGoalReviews,
  CreateGoalReview,
  UpdateGoalReview,
  DeleteGoalReview,
} from '@dailyuse/application-client';
import type {
  CreateGoalRequest,
  UpdateGoalRequest,
  CreateGoalFolderRequest,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  UpdateGoalFolderRequest,
  CreateGoalRecordRequest,
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
} from '@dailyuse/contracts/goal';

/** Clone goal options (inline type matching CloneGoal service) */
type CloneGoalOptions = {
  name?: string;
  description?: string;
  includeKeyResults?: boolean;
  includeRecords?: boolean;
};

/** Search goals input (inline type matching SearchGoals service) */
type SearchGoalsInput = {
  keywords?: string;
  status?: string;
  dirUuid?: string;
  page?: number;
  limit?: number;
};
import { 
  Goal, 
  GoalFolder,
  KeyResult,
  GoalRecord,
  GoalReview,
} from '@dailyuse/domain-client/goal';

/**
 * Goal Application Service
 */
export class GoalApplicationService {
  private static instance: GoalApplicationService;

  private constructor() {}

  static getInstance(): GoalApplicationService {
    if (!GoalApplicationService.instance) {
      GoalApplicationService.instance = new GoalApplicationService();
    }
    return GoalApplicationService.instance;
  }

  // ===== Goal Operations =====

  async listGoals(): Promise<{ goals: Goal[] }> {
    const response = await ListGoals.getInstance().execute();
    return {
      goals: response.goals.map(dto => Goal.fromClientDTO(dto)),
    };
  }

  async getGoal(goalId: string): Promise<Goal | null> {
    try {
      const dto = await GetGoal.getInstance().execute(goalId);
      return Goal.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  async createGoal(input: CreateGoalRequest): Promise<Goal> {
    const dto = await CreateGoal.getInstance().execute(input);
    return Goal.fromClientDTO(dto);
  }

  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<Goal> {
    const dto = await UpdateGoal.getInstance().execute(uuid, request);
    return Goal.fromClientDTO(dto);
  }

  async deleteGoal(goalId: string): Promise<void> {
    return DeleteGoal.getInstance().execute(goalId);
  }

  async activateGoal(goalId: string): Promise<Goal> {
    const dto = await ActivateGoal.getInstance().execute(goalId);
    return Goal.fromClientDTO(dto);
  }

  async pauseGoal(goalId: string): Promise<Goal> {
    const dto = await PauseGoal.getInstance().execute(goalId);
    return Goal.fromClientDTO(dto);
  }

  async completeGoal(goalId: string): Promise<Goal> {
    const dto = await CompleteGoal.getInstance().execute(goalId);
    return Goal.fromClientDTO(dto);
  }

  async archiveGoal(goalId: string): Promise<Goal> {
    const dto = await ArchiveGoal.getInstance().execute(goalId);
    return Goal.fromClientDTO(dto);
  }

  async cloneGoal(goalUuid: string, options?: CloneGoalOptions): Promise<Goal> {
    const dto = await CloneGoal.getInstance().execute(goalUuid, options || {});
    return Goal.fromClientDTO(dto);
  }

  async searchGoals(input: SearchGoalsInput): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    const response = await SearchGoals.getInstance().execute(input);
    return {
      goals: response.goals,
      pagination: response.pagination,
    };
  }

  // ===== Key Result Operations =====

  async getKeyResults(goalId: string): Promise<KeyResult[]> {
    const response = await GetKeyResults.getInstance().execute(goalId);
    return response.keyResults.map(dto => KeyResult.fromServerDTO(dto));
  }

  async createKeyResult(goalUuid: string, request: Omit<AddKeyResultRequest, 'goalUuid'>): Promise<KeyResult> {
    const dto = await CreateKeyResult.getInstance().execute(goalUuid, request);
    return KeyResult.fromClientDTO(dto);
  }

  async updateKeyResult(goalUuid: string, keyResultUuid: string, request: UpdateKeyResultRequest): Promise<KeyResult> {
    const dto = await UpdateKeyResult.getInstance().execute(goalUuid, keyResultUuid, request);
    return KeyResult.fromClientDTO(dto);
  }

  async deleteKeyResult(goalUuid: string, keyResultUuid: string): Promise<void> {
    return DeleteKeyResult.getInstance().execute(goalUuid, keyResultUuid);
  }

  // ===== Folder Operations =====

  async listFolders(): Promise<GoalFolder[]> {
    const dtos = await ListGoalFolders.getInstance().execute();
    return dtos.map(dto => GoalFolder.fromClientDTO(dto));
  }

  async getFolder(folderId: string): Promise<GoalFolder | null> {
    try {
      const dto = await GetGoalFolder.getInstance().execute(folderId);
      return GoalFolder.fromClientDTO(dto);
    } catch {
      return null;
    }
  }

  async createFolder(input: CreateGoalFolderRequest): Promise<GoalFolder> {
    const dto = await CreateGoalFolder.getInstance().execute(input);
    return GoalFolder.fromClientDTO(dto);
  }

  async updateFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
    const dto = await UpdateGoalFolder.getInstance().execute(uuid, request);
    return GoalFolder.fromClientDTO(dto);
  }

  async deleteFolder(folderId: string): Promise<void> {
    return DeleteGoalFolder.getInstance().execute(folderId);
  }

  // ===== Record Operations =====

  async getRecordsByGoal(goalId: string, params?: { page?: number; limit?: number; dateRange?: { start?: string; end?: string } }): Promise<{ records: GoalRecord[]; total: number }> {
    const response = await GetGoalRecordsByGoal.getInstance().execute(goalId, params);
    return {
      records: response.records.map(dto => GoalRecord.fromClientDTO(dto)),
      total: response.total,
    };
  }

  async createRecord(goalUuid: string, keyResultUuid: string, request: CreateGoalRecordRequest): Promise<GoalRecord> {
    const dto = await CreateGoalRecord.getInstance().execute(goalUuid, keyResultUuid, request);
    return GoalRecord.fromClientDTO(dto);
  }

  async deleteRecord(goalUuid: string, keyResultUuid: string, recordUuid: string): Promise<void> {
    return DeleteGoalRecord.getInstance().execute(goalUuid, keyResultUuid, recordUuid);
  }

  // ===== Review Operations =====

  async getReviews(goalUuid: string): Promise<GoalReview[]> {
    const response = await GetGoalReviews.getInstance().execute(goalUuid);
    // 转换为 Entity 类型
    return (response.reviews as any[]).map(dto => GoalReview.fromClientDTO(dto));
  }

  async createReview(goalUuid: string, request: CreateGoalReviewRequest): Promise<GoalReview> {
    const dto = await CreateGoalReview.getInstance().execute(goalUuid, request);
    return GoalReview.fromClientDTO(dto as any);
  }

  async updateReview(goalUuid: string, reviewUuid: string, request: UpdateGoalReviewRequest): Promise<GoalReview> {
    const dto = await UpdateGoalReview.getInstance().execute(goalUuid, reviewUuid, request);
    return GoalReview.fromClientDTO(dto as any);
  }

  async deleteReview(goalUuid: string, reviewUuid: string): Promise<void> {
    return DeleteGoalReview.getInstance().execute(goalUuid, reviewUuid);
  }
}

// 导出单例
export const goalApplicationService = GoalApplicationService.getInstance();
