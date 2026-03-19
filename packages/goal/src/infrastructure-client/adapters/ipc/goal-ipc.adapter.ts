/**
 * Goal IPC Adapter
 *
 * IPC implementation of IGoalApiClient using ResultIpcClient.
 * Communicates with Electron main process for data operations.
 */

import type { Result } from '@dailyuse/contracts/result';
import { fail } from '@dailyuse/contracts/result';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { IGoalApiClient, IResultIpcClient } from '../types';
import type {
  GoalClientDTO,
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
  private readonly channel = 'goal';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  // ===== Goal CRUD =====

  async createGoal(request: CreateGoalReq): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getGoals(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string[];
    folderId?: string;
    startDate?: number;
    endDate?: number;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGoalById(id: string, includeChildren = true): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:get`, id, includeChildren);
  }

  async updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:update`, id, request);
  }

  async deleteGoal(id: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:delete`, id);
  }

  // ===== Goal Status =====

  async activateGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:activate`, id);
  }

  async completeGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:complete`, id);
  }

  async archiveGoal(id: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:archive`, id);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    pageSize?: number;
    status?: string[];
    folderId?: string;
  }): Promise<Result<QueryGoalsRes>> {
    return this.ipcClient.invoke(`${this.channel}:search`, params);
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:add`, goalId, request);
  }

  async getKeyResultsByGoal(goalId: string): Promise<Result<GetKeyResultsRes>> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:list`, goalId);
  }

  async updateKeyResultForGoal(
    goalId: string,
    keyResultId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:update`, goalId, keyResultId, request);
  }

  async deleteKeyResultForGoal(goalId: string, keyResultId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:delete`, goalId, keyResultId);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    request: { updates: Array<{ keyResultId: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:batchUpdateWeights`, goalId, request);
  }

  async getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>> {
    return this.ipcClient.invoke(`${this.channel}:progressBreakdown`, goalId);
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:review:create`, goalId, request);
  }

  async getGoalReviewsByGoal(goalId: string): Promise<Result<GetGoalReviewsRes>> {
    return this.ipcClient.invoke(`${this.channel}:review:list`, goalId);
  }

  async updateGoalReview(
    goalId: string,
    reviewId: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:review:update`, goalId, reviewId, request);
  }

  async deleteGoalReview(goalId: string, reviewId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:review:delete`, goalId, reviewId);
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalId: string,
    keyResultId: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:record:create`, goalId, keyResultId, request);
  }

  async getGoalRecordsByKeyResult(
    goalId: string,
    keyResultId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:record:listByKeyResult`,
      goalId,
      keyResultId,
      params,
    );
  }

  async getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.ipcClient.invoke(`${this.channel}:record:listByGoal`, goalId, params);
  }

  async deleteGoalRecord(
    goalId: string,
    keyResultId: string,
    recordId: string,
  ): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:record:delete`, goalId, keyResultId, recordId);
  }

  // ===== Aggregate View =====

  async getGoalAggregateView(goalId: string): Promise<Result<GetGoalAggregateRes>> {
    return this.ipcClient.invoke(`${this.channel}:aggregate`, goalId);
  }

  async cloneGoal(goalId: string, request: CloneGoalReq): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:clone`, goalId, request);
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
