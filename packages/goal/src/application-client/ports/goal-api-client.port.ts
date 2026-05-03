/**
 * Goal API Client Port
 *
 * Transport-agnostic interface for Goal API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * All methods return Result<T> for consistent error handling.
 * Types imported from @dailyuse/contracts/goal.
 */

import type { Result } from '@dailyuse/contracts/result';
import type {
  GoalClientDTO,
  GoalSystemView,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
  ProgressBreakdown,
  CreateGoalReq,
  UpdateGoalReq,
  CloneGoalReq,
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

export interface IGoalApiClient {
  // Goal CRUD
  createGoal(request: CreateGoalReq): Promise<Result<GoalClientDTO>>;
  getGoals(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
    startDate?: number;
    endDate?: number;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>>;
  getGoalById(id: string, includeChildren?: boolean): Promise<Result<GoalClientDTO>>;
  updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalClientDTO>>;
  deleteGoal(id: string): Promise<Result<void>>;
  archiveExpiredGoals(): Promise<Result<{ archivedCount: number }>>;

  // Goal Status
  activateGoal(id: string): Promise<Result<GoalClientDTO>>;
  completeGoal(id: string): Promise<Result<GoalClientDTO>>;
  archiveGoal(id: string): Promise<Result<GoalClientDTO>>;

  // Search
  searchGoals(params: {
    query: string;
    page?: number;
    pageSize?: number;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
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
  deleteGoalRecord(goalId: string, keyResultId: string, recordId: string): Promise<Result<void>>;

  // Aggregate View
  getGoalAggregateView(goalId: string): Promise<Result<GetGoalAggregateRes>>;
  cloneGoal(goalId: string, request: CloneGoalReq): Promise<Result<GoalClientDTO>>;

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
