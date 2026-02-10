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
  CreateGoalRequest,
  UpdateGoalRequest,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  CreateGoalFolderRequest,
  UpdateGoalFolderRequest,
  CreateGoalRecordRequest,
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
  StartFocusRequest,
  GetFocusHistoryRequest,
  ProgressBreakdown,
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
  FocusStatisticsDTO,
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
  async createGoal(request: CreateGoalRequest): Promise<Goal> {
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
  async listGoals(): Promise<Goal[]> {
    return ListGoals.getInstance().execute();
  }

  /**
   * Update a goal
   */
  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<Goal> {
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
    return ActivateGoal.getInstance().execute(uuid);
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
  async searchGoals(query: string): Promise<Goal[]> {
    return SearchGoals.getInstance().execute(query);
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
  async createKeyResult(goalUuid: string, request: AddKeyResultRequest): Promise<KeyResult> {
    return CreateKeyResult.getInstance().execute(goalUuid, request);
  }

  /**
   * Get key results for a goal
   */
  async getKeyResults(goalUuid: string): Promise<KeyResult[]> {
    return GetKeyResults.getInstance().execute(goalUuid);
  }

  /**
   * Update a key result
   */
  async updateKeyResult(
    goalUuid: string,
    krUuid: string,
    request: UpdateKeyResultRequest,
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
    weights: Record<string, number>,
  ): Promise<KeyResult[]> {
    return BatchUpdateKeyResultWeights.getInstance().execute(goalUuid, weights);
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
  async generateKeyResults(goalUuid: string): Promise<KeyResult[]> {
    return GenerateKeyResults.getInstance().execute(goalUuid);
  }

  // ===== Goal Record Use Cases =====

  /**
   * Create a goal record
   */
  async createGoalRecord(request: CreateGoalRecordRequest): Promise<any> {
    return CreateGoalRecord.getInstance().execute(request);
  }

  /**
   * Get goal records by key result
   */
  async getGoalRecordsByKeyResult(krUuid: string): Promise<any[]> {
    return GetGoalRecordsByKeyResult.getInstance().execute(krUuid);
  }

  /**
   * Get goal records by goal
   */
  async getGoalRecordsByGoal(goalUuid: string): Promise<any[]> {
    return GetGoalRecordsByGoal.getInstance().execute(goalUuid);
  }

  /**
   * Delete a goal record
   */
  async deleteGoalRecord(uuid: string): Promise<void> {
    return DeleteGoalRecord.getInstance().execute(uuid);
  }

  // ===== Goal Review Use Cases =====

  /**
   * Create a goal review
   */
  async createGoalReview(request: CreateGoalReviewRequest): Promise<any> {
    return CreateGoalReview.getInstance().execute(request);
  }

  /**
   * Get goal reviews
   */
  async getGoalReviews(goalUuid: string): Promise<any[]> {
    return GetGoalReviews.getInstance().execute(goalUuid);
  }

  /**
   * Update a goal review
   */
  async updateGoalReview(uuid: string, request: UpdateGoalReviewRequest): Promise<any> {
    return UpdateGoalReview.getInstance().execute(uuid, request);
  }

  /**
   * Delete a goal review
   */
  async deleteGoalReview(uuid: string): Promise<void> {
    return DeleteGoalReview.getInstance().execute(uuid);
  }

  // ===== Goal Folder Use Cases =====

  /**
   * Create a goal folder
   */
  async createGoalFolder(request: CreateGoalFolderRequest): Promise<GoalFolder> {
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
  async updateGoalFolder(uuid: string, request: UpdateGoalFolderRequest): Promise<GoalFolder> {
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
  async startFocusSession(request: StartFocusRequest): Promise<FocusSessionClientDTO> {
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
  async getFocusStatus(): Promise<FocusStatusDTO> {
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
    request?: GetFocusHistoryRequest & { range?: 'today' | 'week' },
  ): Promise<FocusHistoryDTO> {
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

    return GetFocusHistory.getInstance().execute(params as GetFocusHistoryRequest);
  }

  /**
   * Get focus statistics
   */
  async getFocusStatistics(goalUuid?: string): Promise<FocusStatisticsDTO> {
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
