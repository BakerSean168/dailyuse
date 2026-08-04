import type {
  ActivateFocusModeRequest,
  CloneGoalReq,
  CreateGoalFolderReq,
  CreateGoalReq,
  FocusModeDTO,
  GetGoalAggregateRes,
  GetGoalRes,
  GoalMutationReceipt,
  GoalFolderClientDTO,
  ListGoalFoldersQuery,
  ListGoalsQuery,
  ProgressBreakdown,
  QueryGoalFoldersRes,
  QueryGoalsRes,
  UpdateGoalFolderReq,
  UpdateGoalFolderRes,
  UpdateGoalReq,
  UpdateGoalRes,
} from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IdentityId } from '@memoflow/domain-shared';
import type {
  ListGoalRecordsParams,
  ListGoalRecordsResult,
} from './use-cases/queries/list-goal-records.use-case';
import type { ListGoalReviewsResult } from './use-cases/queries/list-goal-reviews.use-case';

/** Transport-neutral callable application surface. */
export interface GoalApplicationPort {
  createGoal(input: CreateGoalReq, cx: ExecutionContext): Promise<Result<GoalMutationReceipt>>;
  getGoal(id: string, identityId: string, includeChildren?: boolean): Promise<Result<GetGoalRes>>;
  listGoals(input: ListGoalsQuery): Promise<Result<QueryGoalsRes>>;
  updateGoal(id: string, identityId: string, input: UpdateGoalReq): Promise<Result<UpdateGoalRes>>;
  deleteGoal(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;
  permanentlyDeleteGoal(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<{ id: string }>>;
  archiveGoal(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;
  archiveExpiredGoals(identityId: string): Promise<Result<{ archivedCount: number }>>;
  activateGoal(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;
  completeGoal(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;
  searchGoals(
    identityId: string,
    query: string,
    systemView?: string,
  ): Promise<Result<QueryGoalsRes>>;

  listGoalFolders(input: ListGoalFoldersQuery): Promise<Result<QueryGoalFoldersRes>>;
  createGoalFolder(
    identityId: IdentityId,
    input: CreateGoalFolderReq,
  ): Promise<Result<GoalFolderClientDTO>>;
  getGoalFolder(id: string, identityId: string): Promise<Result<GoalFolderClientDTO>>;
  updateGoalFolder(
    id: string,
    identityId: string,
    input: UpdateGoalFolderReq,
  ): Promise<Result<UpdateGoalFolderRes>>;
  deleteGoalFolder(id: string, identityId: string): Promise<Result<void>>;

  addKeyResult(
    goalId: string,
    identityId: string,
    keyResult: {
      title: string;
      valueType: string;
      aggregationMethod?: string;
      startValue?: number;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
      expectedVersion: number;
    },
  ): Promise<Result<GoalMutationReceipt>>;
  updateKeyResult(
    goalId: string,
    identityId: string,
    keyResultId: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      startValue?: number;
      currentValue?: number;
      targetValue?: number;
      unit?: string;
      expectedVersion: number;
    },
  ): Promise<Result<GoalMutationReceipt>>;
  updateKeyResultProgress(
    goalId: string,
    identityId: string,
    keyResultId: string,
    currentValue: number,
    expectedVersion: number,
    note?: string,
  ): Promise<Result<GoalMutationReceipt>>;
  deleteKeyResult(
    goalId: string,
    identityId: string,
    keyResultId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;

  addReview(
    goalId: string,
    identityId: string,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
      expectedVersion: number;
    },
  ): Promise<Result<GoalMutationReceipt>>;
  listReviews(goalId: string, identityId: string): Promise<Result<ListGoalReviewsResult>>;
  updateReview(
    goalId: string,
    identityId: string,
    reviewId: string,
    params: {
      title?: string;
      content?: string;
      rating?: number | null;
      achievements?: string | null;
      challenges?: string | null;
      nextActions?: string | null;
      expectedVersion: number;
    },
  ): Promise<Result<GoalMutationReceipt>>;
  deleteReview(
    goalId: string,
    identityId: string,
    reviewId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;

  createRecord(
    goalId: string,
    keyResultId: string,
    params: { value: number; note?: string; expectedVersion: number },
    identityId: string,
  ): Promise<Result<GoalMutationReceipt>>;
  listRecords(params: ListGoalRecordsParams): Promise<Result<ListGoalRecordsResult>>;
  deleteRecord(
    goalId: string,
    keyResultId: string,
    recordId: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>>;

  activateFocusMode(
    identityId: string,
    input: ActivateFocusModeRequest,
  ): Promise<Result<FocusModeDTO>>;
  deactivateFocusMode(identityId: string): Promise<Result<FocusModeDTO | null>>;
  extendFocusMode(identityId: string, newEndTime: number): Promise<Result<FocusModeDTO>>;
  getCurrentFocusMode(identityId: string): Promise<Result<FocusModeDTO | null>>;

  getGoalAggregate(goalId: string, identityId: string): Promise<Result<GetGoalAggregateRes>>;
  getGoalProgressBreakdown(goalId: string, identityId: string): Promise<Result<ProgressBreakdown>>;
  cloneGoal(
    goalId: string,
    params: CloneGoalReq,
    cx: ExecutionContext,
  ): Promise<Result<GoalMutationReceipt>>;
  batchUpdateKeyResultWeights(
    goalId: string,
    identityId: string,
    expectedVersion: number,
    updates: Array<{ keyResultId: string; weight: number }>,
  ): Promise<Result<GoalMutationReceipt>>;
}
