/**
 * Goal IPC Adapter
 *
 * IPC implementation of IGoalApiClient using ResultIpcClient.
 * Communicates with Electron main process for data operations.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IGoalApiClient, IResultIpcClient } from '../types';
import type {
  GoalClientDTO,
  KeyResultClientDTO,
  GoalReviewClientDTO,
  GoalRecordClientDTO,
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
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
    includeChildren?: boolean;
  }): Promise<Result<QueryGoalsRes>> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGoalById(
    uuid: string,
    includeChildren = true,
  ): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:get`,
      uuid,
      includeChildren,
    );
  }

  async updateGoal(
    uuid: string,
    request: UpdateGoalReq,
  ): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:update`, uuid, request);
  }

  async deleteGoal(uuid: string): Promise<Result<void>> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:activate`, uuid);
  }

  async pauseGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:pause`, uuid);
  }

  async completeGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:complete`, uuid);
  }

  async archiveGoal(uuid: string): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(`${this.channel}:archive`, uuid);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<Result<QueryGoalsRes>> {
    return this.ipcClient.invoke(`${this.channel}:search`, params);
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultReq, 'goalUuid'>,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:keyResult:add`,
      goalUuid,
      request,
    );
  }

  async getKeyResultsByGoal(
    goalUuid: string,
  ): Promise<Result<GetKeyResultsRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:keyResult:list`,
      goalUuid,
    );
  }

  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResultClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:keyResult:update`,
      goalUuid,
      keyResultUuid,
      request,
    );
  }

  async deleteKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
  ): Promise<Result<void>> {
    return this.ipcClient.invoke(
      `${this.channel}:keyResult:delete`,
      goalUuid,
      keyResultUuid,
    );
  }

  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: { updates: Array<{ keyResultUuid: string; weight: number }> },
  ): Promise<Result<GetKeyResultsRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:keyResult:batchUpdateWeights`,
      goalUuid,
      request,
    );
  }

  async getProgressBreakdown(
    goalUuid: string,
  ): Promise<Result<ProgressBreakdown>> {
    return this.ipcClient.invoke(
      `${this.channel}:progressBreakdown`,
      goalUuid,
    );
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:review:create`,
      goalUuid,
      request,
    );
  }

  async getGoalReviewsByGoal(
    goalUuid: string,
  ): Promise<Result<GetGoalReviewsRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:review:list`,
      goalUuid,
    );
  }

  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReviewClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:review:update`,
      goalUuid,
      reviewUuid,
      request,
    );
  }

  async deleteGoalReview(
    goalUuid: string,
    reviewUuid: string,
  ): Promise<Result<void>> {
    return this.ipcClient.invoke(
      `${this.channel}:review:delete`,
      goalUuid,
      reviewUuid,
    );
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecordClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:record:create`,
      goalUuid,
      keyResultUuid,
      request,
    );
  }

  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:record:listByKeyResult`,
      goalUuid,
      keyResultUuid,
      params,
    );
  }

  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<GetGoalRecordsRes>> {
    return this.ipcClient.invoke(
      `${this.channel}:record:listByGoal`,
      goalUuid,
      params,
    );
  }

  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<Result<void>> {
    return this.ipcClient.invoke(
      `${this.channel}:record:delete`,
      goalUuid,
      keyResultUuid,
      recordUuid,
    );
  }

  // ===== Aggregate View =====

  async getGoalAggregateView(
    goalUuid: string,
  ): Promise<Result<GetGoalAggregateRes>> {
    return this.ipcClient.invoke(`${this.channel}:aggregate`, goalUuid);
  }

  async cloneGoal(
    goalUuid: string,
    request: {
      name?: string;
      description?: string;
      includeKeyResults?: boolean;
      includeRecords?: boolean;
    },
  ): Promise<Result<GoalClientDTO>> {
    return this.ipcClient.invoke(
      `${this.channel}:clone`,
      goalUuid,
      request,
    );
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
    return this.ipcClient.invoke('ai:generateKeyResults', request);
  }
}
