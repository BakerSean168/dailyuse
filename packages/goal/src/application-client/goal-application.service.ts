/**
 * Goal Application Service
 *
 * Smart Container + Application Service Pattern
 * Framework-agnostic orchestration layer for goal management
 *
 * ✅ Centralized in packages - no duplication
 * ✅ Direct import from apps/web and apps/desktop
 * ✅ Handles cross-module coordination
 * ✅ Adapts to different containers
 *
 * @module application-client/goal
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';
import {
  // Goal Management Use Cases
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ActivateGoal,
  PauseGoal,
  CompleteGoal,
  ArchiveGoal,
  SearchGoals,
  GetGoalAggregateView,
  CloneGoal,
  // Key Result Use Cases
  CreateKeyResult,
  GetKeyResults,
  UpdateKeyResult,
  DeleteKeyResult,
  BatchUpdateKeyResultWeights,
  GetProgressBreakdown,
  GenerateKeyResults,
  // Goal Record Use Cases
  CreateGoalRecord,
  GetGoalRecordsByKeyResult,
  GetGoalRecordsByGoal,
  DeleteGoalRecord,
  // Goal Review Use Cases
  CreateGoalReview,
  GetGoalReviews,
  UpdateGoalReview,
  DeleteGoalReview,
  // Goal Folder Use Cases
  CreateGoalFolder,
  ListGoalFolders,
  GetGoalFolder,
  UpdateGoalFolder,
  DeleteGoalFolder,
  // Focus Session Use Cases
  StartFocusSession,
  PauseFocusSession,
  ResumeFocusSession,
  StopFocusSession,
  GetFocusStatus,
  GetFocusHistory,
  GetFocusStatistics,
} from './services';

import type {
  CreateGoalReq,
  UpdateGoalReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
  UpdateGoalReviewReq,
  StartFocusReq,
  GetFocusHistoryReq,
  ProgressBreakdown,
  FocusSessionClientDTO,
  GetFocusStatusRes,
  GetFocusHistoryRes,
  GetFocusStatisticsRes,
} from '@dailyuse/contracts/goal';

import type { Goal, GoalFolder, KeyResult } from '@/domain-client';

/**
 * Goal Application Service - Smart Container
 *
 * Orchestrates all goal-related use cases with a unified API.
 * Framework-agnostic: works with Vue Composables and React Hooks equally.
 *
 * @example
 * // In Vue Composable
 * import { goalApplicationService } from '@/'
 * const goal = await goalApplicationService.createGoal(request)
 *
 * @example
 * // In React Hook (identical!)
 * import { goalApplicationService } from '@/'
 * const goal = await goalApplicationService.createGoal(request)
 */
export class GoalApplicationService {
  private static instance: GoalApplicationService;
  private container: typeof GoalContainer;

  private constructor() {
    this.container = GoalContainer;
  }

  /**
   * Get singleton instance
   * Lazy initialization - creates once, reuses everywhere
   */
  static getInstance(): GoalApplicationService {
    if (!GoalApplicationService.instance) {
      GoalApplicationService.instance = new GoalApplicationService();
    }
    return GoalApplicationService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    GoalApplicationService.instance = undefined as unknown as GoalApplicationService;
  }

  // ===== Goal Management Use Cases =====

  /**
   * Create a new goal
   */
  async createGoal(request: CreateGoalReq): Promise<Goal> {
    return CreateGoal.getInstance().execute(request);
  }

  /**
   * Get a single goal by UUID
   */
  async getGoal(uuid: string): Promise<Goal | null> {
    return GetGoal.getInstance().execute(uuid);
  }

  /**
   * List all goals for current user
   */
  async listGoals(params?: { page?: number; limit?: number; status?: string; dirUuid?: string; startDate?: string; endDate?: string }): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    return ListGoals.getInstance().execute(params);
  }

  /**
   * Update a goal
   */
  async updateGoal(uuid: string, request: UpdateGoalReq): Promise<Goal> {
    return UpdateGoal.getInstance().execute(uuid, request);
  }

  /**
   * Delete a goal
   */
  async deleteGoal(uuid: string): Promise<void> {
    return DeleteGoal.getInstance().execute(uuid);
  }

  /**
   * Activate a goal
   */
  async activateGoal(uuid: string): Promise<Goal> {
    return (ActivateGoal as any).getInstance().execute(uuid);
  }

  /**
   * Pause a goal
   */
  async pauseGoal(uuid: string): Promise<Goal> {
    return PauseGoal.getInstance().execute(uuid);
  }

  /**
   * Complete a goal
   */
  async completeGoal(uuid: string): Promise<Goal> {
    return CompleteGoal.getInstance().execute(uuid);
  }

  /**
   * Archive a goal
   */
  async archiveGoal(uuid: string): Promise<Goal> {
    return ArchiveGoal.getInstance().execute(uuid);
  }

  /**
   * Search goals by query
   */
  async searchGoals(params?: { keywords?: string; status?: string; dirUuid?: string; page?: number; limit?: number }): Promise<{ goals: Goal[]; pagination: { page: number; limit: number; total: number } }> {
    return SearchGoals.getInstance().execute(params);
  }

  /**
   * Get aggregate view of a goal (with all related data)
   */
  async getGoalAggregateView(uuid: string): Promise<any> {
    return GetGoalAggregateView.getInstance().execute(uuid);
  }

  /**
   * Clone a goal
   */
  async cloneGoal(uuid: string): Promise<Goal> {
    return CloneGoal.getInstance().execute(uuid);
  }

  // ===== Key Result Use Cases =====

  /**
   * Create a key result for a goal
   */
  async createKeyResult(goalUuid: string, request: AddKeyResultReq): Promise<KeyResult> {
    return CreateKeyResult.getInstance().execute(goalUuid, request);
  }

  /**
   * Get key results for a goal
   */
  async getKeyResults(goalUuid: string): Promise<{ keyResults: KeyResult[] }> {
    return GetKeyResults.getInstance().execute(goalUuid);
  }

  /**
   * Update a key result
   */
  async updateKeyResult(
    goalUuid: string,
    krUuid: string,
    request: UpdateKeyResultReq,
  ): Promise<KeyResult> {
    return UpdateKeyResult.getInstance().execute(goalUuid, krUuid, request);
  }

  /**
   * Delete a key result
   */
  async deleteKeyResult(goalUuid: string, krUuid: string): Promise<void> {
    return DeleteKeyResult.getInstance().execute(goalUuid, krUuid);
  }

  /**
   * Batch update key result weights
   */
  async batchUpdateKeyResultWeights(
    goalUuid: string,
    updates: Array<{ keyResultUuid: string; weight: number }>,
  ): Promise<any> {
    return BatchUpdateKeyResultWeights.getInstance().execute(goalUuid, updates);
  }

  /**
   * Get progress breakdown for goal
   */
  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return GetProgressBreakdown.getInstance().execute(goalUuid);
  }

  /**
   * Generate key results using AI
   */
  async generateKeyResults(params: { goalTitle: string; goalDescription?: string; startDate: number; endDate: number; goalContext?: string }): Promise<any> {
    return GenerateKeyResults.getInstance().execute(params);
  }

  // ===== Goal Record Use Cases =====

  /**
   * Create a goal record
   */
  async createGoalRecord(goalUuid: string, keyResultUuid: string, request: CreateGoalRecordReq): Promise<any> {
    return CreateGoalRecord.getInstance().execute(goalUuid, keyResultUuid, request);
  }

  /**
   * Get goal records by key result
   */
  async getGoalRecordsByKeyResult(goalUuid: string, krUuid: string, params?: { page?: number; limit?: number }): Promise<any> {
    return GetGoalRecordsByKeyResult.getInstance().execute(goalUuid, krUuid, params);
  }

  /**
   * Get goal records by goal
   */
  async getGoalRecordsByGoal(goalUuid: string, params?: { page?: number; limit?: number }): Promise<{ records: any[]; total: number }> {
    return GetGoalRecordsByGoal.getInstance().execute(goalUuid, params);
  }

  /**
   * Delete a goal record
   */
  async deleteGoalRecord(goalUuid: string, krUuid: string, recordUuid: string): Promise<void> {
    return DeleteGoalRecord.getInstance().execute(goalUuid, krUuid, recordUuid);
  }

  // ===== Goal Review Use Cases =====

  /**
   * Create a goal review
   */
  async createGoalReview(goalUuid: string, request: CreateGoalReviewReq): Promise<any> {
    return CreateGoalReview.getInstance().execute(goalUuid, request);
  }

  /**
   * Get goal reviews
   */
  async getGoalReviews(goalUuid: string): Promise<{ reviews: any[] }> {
    return GetGoalReviews.getInstance().execute(goalUuid);
  }

  /**
   * Update a goal review
   */
  async updateGoalReview(goalUuid: string, reviewUuid: string, request: UpdateGoalReviewReq): Promise<any> {
    return UpdateGoalReview.getInstance().execute(goalUuid, reviewUuid, request);
  }

  /**
   * Delete a goal review
   */
  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    return DeleteGoalReview.getInstance().execute(goalUuid, reviewUuid);
  }

  // ===== Goal Folder Use Cases =====

  /**
   * Create a goal folder
   */
  async createGoalFolder(request: CreateGoalFolderReq): Promise<GoalFolder> {
    return CreateGoalFolder.getInstance().execute(request);
  }

  /**
   * List all goal folders
   */
  async listGoalFolders(): Promise<GoalFolder[]> {
    return ListGoalFolders.getInstance().execute();
  }

  /**
   * Get a goal folder
   */
  async getGoalFolder(uuid: string): Promise<GoalFolder | null> {
    return GetGoalFolder.getInstance().execute(uuid);
  }

  /**
   * Update a goal folder
   */
  async updateGoalFolder(uuid: string, request: UpdateGoalFolderReq): Promise<GoalFolder> {
    return UpdateGoalFolder.getInstance().execute(uuid, request);
  }

  /**
   * Delete a goal folder
   */
  async deleteGoalFolder(uuid: string): Promise<void> {
    return DeleteGoalFolder.getInstance().execute(uuid);
  }

  // ===== Focus Session Use Cases =====

  /**
   * Start a focus session
   */
  async startFocusSession(request: StartFocusReq): Promise<FocusSessionClientDTO> {
    return StartFocusSession.getInstance().execute(request);
  }

  /**
   * Pause current focus session
   */
  async pauseFocusSession(): Promise<FocusSessionClientDTO> {
    return PauseFocusSession.getInstance().execute();
  }

  /**
   * Resume paused focus session
   */
  async resumeFocusSession(): Promise<FocusSessionClientDTO> {
    return ResumeFocusSession.getInstance().execute();
  }

  /**
   * Stop current focus session
   */
  async stopFocusSession(notes?: string): Promise<FocusSessionClientDTO | null> {
    return StopFocusSession.getInstance().execute(notes);
  }

  /**
   * Get current focus status
   */
  async getFocusStatus(): Promise<GetFocusStatusRes> {
    return GetFocusStatus.getInstance().execute();
  }

  /**
   * Get focus history with optional range filter
   *
   * @example
   * // Get today's history
   * const history = await goalApplicationService.getFocusHistory({ range: 'today' })
   *
   * @example
   * // Get week history for specific goal
   * const history = await goalApplicationService.getFocusHistory({ range: 'week', goalUuid })
   */
  async getFocusHistory(
    request?: GetFocusHistoryReq & { range?: 'today' | 'week' },
  ): Promise<GetFocusHistoryRes> {
    if (!request) {
      return GetFocusHistory.getInstance().execute();
    }

    const { range, ...params } = request;

    // Support convenience range shortcuts
    if (range === 'today') {
      return GetFocusHistory.getInstance().getTodayHistory(params.goalUuid);
    }

    if (range === 'week') {
      return GetFocusHistory.getInstance().getWeekHistory(params.goalUuid);
    }

    return GetFocusHistory.getInstance().execute(params as GetFocusHistoryReq);
  }

  /**
   * Get focus statistics
   */
  async getFocusStatistics(goalUuid?: string): Promise<GetFocusStatisticsRes> {
    return GetFocusStatistics.getInstance().execute(goalUuid);
  }
}

/**
 * Singleton export - Use everywhere
 *
 * @example
 * // Vue Composable
 * import { goalApplicationService } from '@/'
 * const goal = await goalApplicationService.createGoal(request)
 *
 * @example
 * // React Hook
 * import { goalApplicationService } from '@/'
 * const goal = await goalApplicationService.createGoal(request)
 */
export const goalApplicationService = GoalApplicationService.getInstance();
