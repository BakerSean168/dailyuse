/**
 * Goal Application Service - Renderer
 *
 * 目标应用服务 - 渲染进程
 * 
 * 简化版: application-client 服务已返回 Entity 对象，直接透传即可
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
} from '@dailyuse/application-client/goal';
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
import type { 
  Goal, 
  GoalFolder,
  KeyResult,
  GoalRecord,
  GoalReview,
} from '@dailyuse/domain-client/goal';

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
    return ListGoals.getInstance().execute();
  }

  async getGoal(goalId: string): Promise<Goal | null> {
    try {
      return await GetGoal.getInstance().execute(goalId);
    } catch {
      return null;
    }
  }

  async createGoal(input: CreateGoalRequest): Promise<Goal> {
    return CreateGoal.getInstance().execute(input);
  }

  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<Goal> {
    return UpdateGoal.getInstance().execute(uuid, request);
  }

  async deleteGoal(goalId: string): Promise<void> {
    return DeleteGoal.getInstance().execute(goalId);
  }

  async activateGoal(goalId: string): Promise<Goal> {
    return ActivateGoal.getInstance().execute(goalId);
  }

  async pauseGoal(goalId: string): Promise<Goal> {
    return PauseGoal.getInstance().execute(goalId);
  }

  async completeGoal(goalId: string): Promise<Goal> {
    return CompleteGoal.getInstance().execute(goalId);
  }

  async archiveGoal(goalId: string): Promise<Goal> {
    return ArchiveGoal.getInstance().execute(goalId);
  }

  async cloneGoal(goalUuid: string, options?: CloneGoalOptions): Promise<Goal> {
    return CloneGoal.getInstance().execute(goalUuid, options || {});
  }

  async searchGoals(input: SearchGoalsInput): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    return SearchGoals.getInstance().execute(input);
  }

  // ===== Key Result Operations =====

  async getKeyResults(goalId: string): Promise<KeyResult[]> {
    const response = await GetKeyResults.getInstance().execute(goalId);
    return response.keyResults;
  }

  async createKeyResult(goalUuid: string, request: Omit<AddKeyResultRequest, 'goalUuid'>): Promise<KeyResult> {
    return CreateKeyResult.getInstance().execute(goalUuid, request);
  }

  async updateKeyResult(goalUuid: string, keyResultUuid: string, request: UpdateKeyResultRequest): Promise<KeyResult> {
    return UpdateKeyResult.getInstance().execute(goalUuid, keyResultUuid, request);
  }

  async deleteKeyResult(goalUuid: string, keyResultUuid: string): Promise<void> {
    return DeleteKeyResult.getInstance().execute(goalUuid, keyResultUuid);
  }

  // ===== Folder Operations =====

  async listFolders(): Promise<GoalFolder[]> {
    return ListGoalFolders.getInstance().execute();
  }

  async getFolder(folderId: string): Promise<GoalFolder | null> {
    try {
      return await GetGoalFolder.getInstance().execute(folderId);
    } catch {
      return null;
    }
  }

  async createFolder(input: CreateGoalFolderRequest): Promise<GoalFolder> {
    return CreateGoalFolder.getInstance().execute(input);
  }

  async updateFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
    return UpdateGoalFolder.getInstance().execute(uuid, request);
  }

  async deleteFolder(folderId: string): Promise<void> {
    return DeleteGoalFolder.getInstance().execute(folderId);
  }

  // ===== Record Operations =====

  async getRecordsByGoal(goalId: string, params?: { page?: number; limit?: number; dateRange?: { start?: string; end?: string } }): Promise<{ records: GoalRecord[]; total: number }> {
    return GetGoalRecordsByGoal.getInstance().execute(goalId, params);
  }

  async createRecord(goalUuid: string, keyResultUuid: string, request: CreateGoalRecordRequest): Promise<GoalRecord> {
    return CreateGoalRecord.getInstance().execute(goalUuid, keyResultUuid, request);
  }

  async deleteRecord(goalUuid: string, keyResultUuid: string, recordUuid: string): Promise<void> {
    return DeleteGoalRecord.getInstance().execute(goalUuid, keyResultUuid, recordUuid);
  }

  // ===== Review Operations =====

  async getReviews(goalUuid: string): Promise<GoalReview[]> {
    const response = await GetGoalReviews.getInstance().execute(goalUuid);
    return response.reviews;
  }

  async createReview(goalUuid: string, request: CreateGoalReviewRequest): Promise<GoalReview> {
    return CreateGoalReview.getInstance().execute(goalUuid, request);
  }

  async updateReview(goalUuid: string, reviewUuid: string, request: UpdateGoalReviewRequest): Promise<GoalReview> {
    return UpdateGoalReview.getInstance().execute(goalUuid, reviewUuid, request);
  }

  async deleteReview(goalUuid: string, reviewUuid: string): Promise<void> {
    return DeleteGoalReview.getInstance().execute(goalUuid, reviewUuid);
  }
}

// 导出单例
export const goalApplicationService = GoalApplicationService.getInstance();
