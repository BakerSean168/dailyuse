/**
 * Goal IPC Adapter
 *
 * IPC implementation of IGoalApiClient using ResultIpcClient.
 * Communicates with Electron main process for data operations.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import { AIChannels, GoalChannels } from '@dailyuse/contracts/electron';
import type { IGoalApiClient, IResultIpcClient } from '../types';
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

export class GoalIpcAdapter implements IGoalApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Goal CRUD =====

  async createGoal(request: CreateGoalReq): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.CREATE, request);
  }

  async getGoals(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
    startDate?: number;
    endDate?: number;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>> {
    return this.ipcClient.invoke(GoalChannels.LIST, params);
  }

  async getGoalById(id: string, includeChildren = true): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.GET, id, includeChildren);
  }

  async updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.UPDATE, id, request);
  }

  async deleteGoal(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(GoalChannels.DELETE, id);
  }

  async archiveExpiredGoals(): Promise<Result<{ archivedCount: number }>> {
    return this.ipcClient.invoke(GoalChannels.ARCHIVE_EXPIRED);
  }

  // ===== Goal Status =====

  async activateGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.ACTIVATE, id);
  }

  async completeGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.COMPLETE, id);
  }

  async archiveGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.ARCHIVE, id);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    pageSize?: number;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
  }): Promise<Result<QueryGoalsRes>> {
    return this.ipcClient.invoke(GoalChannels.SEARCH, params);
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.KEY_RESULT_ADD, goalId, request);
  }

  async getKeyResultsByGoal(goalId: string): Promise<Result<GetKeyResultsRes>> {
    return this.ipcClient.invoke(GoalChannels.KEY_RESULT_LIST, goalId);
  }

  async updateKeyResultForGoal(
    goalId: string,
    keyResultId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.KEY_RESULT_UPDATE, goalId, keyResultId, request);
  }

  async deleteKeyResultForGoal(goalId: string, keyResultId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(GoalChannels.KEY_RESULT_DELETE, goalId, keyResultId);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    request: { updates: Array<{ keyResultId: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>> {
    return this.ipcClient.invoke(GoalChannels.KEY_RESULT_BATCH_UPDATE_WEIGHTS, goalId, request);
  }

  async getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>> {
    return this.ipcClient.invoke(GoalChannels.PROGRESS_BREAKDOWN, goalId);
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.REVIEW_CREATE, goalId, request);
  }

  async getGoalReviewsByGoal(goalId: string): Promise<Result<GetGoalReviewsRes>> {
    return this.ipcClient.invoke(GoalChannels.REVIEW_LIST, goalId);
  }

  async updateGoalReview(
    goalId: string,
    reviewId: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.REVIEW_UPDATE, goalId, reviewId, request);
  }

  async deleteGoalReview(goalId: string, reviewId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(GoalChannels.REVIEW_DELETE, goalId, reviewId);
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalId: string,
    keyResultId: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.RECORD_CREATE, goalId, keyResultId, request);
  }

  async getGoalRecordsByKeyResult(
    goalId: string,
    keyResultId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.ipcClient.invoke(
      GoalChannels.RECORD_LIST_BY_KEY_RESULT,
      goalId,
      keyResultId,
      params,
    );
  }

  async getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.ipcClient.invoke(GoalChannels.RECORD_LIST_BY_GOAL, goalId, params);
  }

  async deleteGoalRecord(
    goalId: string,
    keyResultId: string,
    recordId: string,
  ): Promise<Result<void>> {
    return this.ipcClient.invoke(GoalChannels.RECORD_DELETE, goalId, keyResultId, recordId);
  }

  // ===== Aggregate View =====

  async getGoalAggregateView(goalId: string): Promise<Result<GetGoalAggregateRes>> {
    return this.ipcClient.invoke(GoalChannels.AGGREGATE, goalId);
  }

  async cloneGoal(goalId: string, request: CloneGoalReq): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(GoalChannels.CLONE, goalId, request);
  }

  // ===== AI Generation =====

  async generateKeyResults(request: {
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
  > {
    const result = await this.ipcClient.invoke<{
      goal: { title: string; description?: string };
      keyResults?: Array<{
        title: string;
        description?: string;
        targetValue?: number;
        unit?: string;
      }>;
      tokenUsage: unknown;
      generatedAt: number;
    }>(AIChannels.GOAL_GENERATE, {
      idea: [request.goalTitle, request.goalDescription, request.goalContext]
        .filter(Boolean)
        .join('\n\n'),
      includeKeyResults: true,
    });

    if (!result.ok) {
      return fail(result.error);
    }

    return {
      ok: true,
      data: {
        keyResults: result.data.keyResults ?? [],
        tokenUsage: result.data.tokenUsage,
        generatedAt: result.data.generatedAt,
      },
    };
  }
}
