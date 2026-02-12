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

/**
 * HTTP Client interface (Result-returning).
 * Satisfied by ResultHttpClient from @dailyuse/http-client at the App level.
 */
export interface IResultHttpClient {
  get<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<Result<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<Result<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<Result<T>>;
  patch<T = unknown>(url: string, data?: unknown, config?: { params?: Record<string, unknown> }): Promise<Result<T>>;
  delete<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<Result<T>>;
}

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
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>>;
  getGoalById(uuid: string, includeChildren?: boolean): Promise<Result<GoalClientDTO>>;
  updateGoal(uuid: string, request: UpdateGoalReq): Promise<Result<GoalClientDTO>>;
  deleteGoal(uuid: string): Promise<Result<void>>;

  // Goal Status
  activateGoal(uuid: string): Promise<Result<GoalClientDTO>>;
  pauseGoal(uuid: string): Promise<Result<GoalClientDTO>>;
  completeGoal(uuid: string): Promise<Result<GoalClientDTO>>;
  archiveGoal(uuid: string): Promise<Result<GoalClientDTO>>;

  // Search
  searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<Result<QueryGoalsRes>>;

  // KeyResult Management (via Goal Aggregate)
  addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultReq, 'goalUuid'>,
  ): Promise<Result<KeyResultClientDTO>>;
  getKeyResultsByGoal(goalUuid: string): Promise<Result<GetKeyResultsRes>>;
  updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>>;
  deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<Result<void>>;
  batchUpdateKeyResultWeights(
    goalUuid: string,
    request: { updates: Array<{ keyResultUuid: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>>;
  getProgressBreakdown(goalUuid: string): Promise<Result<ProgressBreakdown>>;

  // GoalReview Management
  createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>>;
  getGoalReviewsByGoal(goalUuid: string): Promise<Result<GetGoalReviewsRes>>;
  updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>>;
  deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<Result<void>>;

  // GoalRecord Management
  createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>>;
  getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>>;
  getGoalRecordsByGoal(
    goalUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>>;
  deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<Result<void>>;

  // Aggregate View
  getGoalAggregateView(goalUuid: string): Promise<Result<GetGoalAggregateRes>>;
  cloneGoal(
    goalUuid: string,
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
    parentUuid?: string | null;
  }): Promise<Result<QueryGoalFoldersRes>>;
  getGoalFolderById(uuid: string): Promise<Result<GoalFolderClientDTO>>;
  updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>>;
  deleteGoalFolder(uuid: string): Promise<Result<void>>;
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
  getStatistics(goalUuid?: string): Promise<Result<GetFocusStatisticsRes>>;

  // Convenience
  isActive(): Promise<Result<boolean>>;
  getTodayHistory(goalUuid?: string): Promise<Result<GetFocusHistoryRes>>;
  getWeekHistory(goalUuid?: string): Promise<Result<GetFocusHistoryRes>>;
}
