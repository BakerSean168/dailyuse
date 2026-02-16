/**
 * Goal Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Goal API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * All methods return Result<T> for consistent error handling.
 * Types imported from @dailyuse/contracts/goal.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {

  GoalClientDTO,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
  GoalFolderClientDTO,
  FocusSessionClientDTO,
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
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  QueryGoalFoldersRes,
  StartFocusReq,
  GetFocusHistoryReq,
  GetFocusStatusRes,
  GetFocusHistoryRes,
  GetFocusStatisticsRes,
} from '@dailyuse/contracts/goal';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client
export type { IResultHttpClient };

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

// ============ Goal API Client ============

export interface IGoalApiClient {
  // Goal CRUD
  createGoal(request: CreateGoalReq): Promise<Result<GoalClientDTO>>;
  getGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirId?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>>;
  getGoalById(id: string, includeChildren?: boolean): Promise<Result<GoalClientDTO>>;
  updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalClientDTO>>;
  deleteGoal(id: string): Promise<Result<void>>;

  // Goal Status
  activateGoal(id: string): Promise<Result<GoalClientDTO>>;
  pauseGoal(id: string): Promise<Result<GoalClientDTO>>;
  completeGoal(id: string): Promise<Result<GoalClientDTO>>;
  archiveGoal(id: string): Promise<Result<GoalClientDTO>>;

  // Search
  searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirId?: string;
  }): Promise<Result<QueryGoalsRes>>;

  // KeyResult Management (via Goal Aggregate)
  addKeyResultForGoal(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<KeyResultClientDTO>>;
  getKeyResultsByGoal(goalId: string): Promise<Result<GetKeyResultsRes>>;
  updateKeyResultForGoal(
    goalId: string,
    keyResultId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>>;
  deleteKeyResultForGoal(goalId: string, keyResultId: string): Promise<Result<void>>;
  batchUpdateKeyResultWeights(
    goalId: string,
    request: { updates: Array<{ keyResultId: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>>;
  getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>>;

  // GoalReview Management
  createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>>;
  getGoalReviewsByGoal(goalId: string): Promise<Result<GetGoalReviewsRes>>;
  updateGoalReview(
    goalId: string,
    reviewId: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>>;
  deleteGoalReview(goalId: string, reviewId: string): Promise<Result<void>>;

  // GoalRecord Management
  createGoalRecord(
    goalId: string,
    keyResultId: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>>;
  getGoalRecordsByKeyResult(
    goalId: string,
    keyResultId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>>;
  getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>>;
  deleteGoalRecord(
    goalId: string,
    keyResultId: string,
    recordId: string,
  ): Promise<Result<void>>;

  // Aggregate View
  getGoalAggregateView(goalId: string): Promise<Result<GetGoalAggregateRes>>;
  cloneGoal(
    goalId: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<Result<GoalClientDTO>>;

  // AI Generation
  generateKeyResults(request: {
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
  >;
}

// ============ Goal Folder API Client ============

export interface IGoalFolderApiClient {
  createGoalFolder(request: CreateGoalFolderReq): Promise<Result<GoalFolderClientDTO>>;
  getGoalFolders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    parentId?: string | null;
  }): Promise<Result<QueryGoalFoldersRes>>;
  getGoalFolderById(id: string): Promise<Result<GoalFolderClientDTO>>;
  updateGoalFolder(
    id: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>>;
  deleteGoalFolder(id: string): Promise<Result<void>>;
}

// ============ Goal Focus API Client ============

export interface IGoalFocusApiClient {
  // Session Management
  startSession(request: StartFocusReq): Promise<Result<FocusSessionClientDTO>>;
  pauseSession(): Promise<Result<FocusSessionClientDTO>>;
  resumeSession(): Promise<Result<FocusSessionClientDTO>>;
  stopSession(notes?: string): Promise<Result<FocusSessionClientDTO | null>>;

  // Status & History
  getStatus(): Promise<Result<GetFocusStatusRes>>;
  getHistory(request: GetFocusHistoryReq): Promise<Result<GetFocusHistoryRes>>;
  getStatistics(goalId?: string): Promise<Result<GetFocusStatisticsRes>>;

  // Convenience
  isActive(): Promise<Result<boolean>>;
  getTodayHistory(goalId?: string): Promise<Result<GetFocusHistoryRes>>;
  getWeekHistory(goalId?: string): Promise<Result<GetFocusHistoryRes>>;
}
