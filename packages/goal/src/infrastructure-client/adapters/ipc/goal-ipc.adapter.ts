/**
 * Goal IPC Adapter
 *
 * IPC implementation of IGoalApiClient for Electron desktop.
 * Communicates with main process which handles actual data operations.
 */

import type { IGoalApiClient } from '../../ports/goal-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  GoalClientDTO,
  GoalsResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  KeyResultClientDTO,
  KeyResultsResponse,
  AddKeyResultRequest,
  UpdateKeyResultRequest,
  ProgressBreakdown,
  GoalReviewClientDTO,
  GoalReviewsResponse,
  CreateGoalReviewRequest,
  GoalRecordClientDTO,
  GoalRecordsResponse,
  CreateGoalRecordRequest,
  GoalAggregateViewResponse,
} from '@dailyuse/contracts/goal';

/**
 * Goal IPC Adapter
 *
 * Uses Electron IPC to communicate with main process.
 * Main process handles database operations directly.
 */
export class GoalIpcAdapter implements IGoalApiClient {
  private readonly channel = 'goal';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Goal CRUD =====

  async createGoal(request: CreateGoalRequest): Promise<GoalClientDTO> {
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
  }): Promise<GoalsResponse> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGoalById(uuid: string, includeChildren = true): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid, includeChildren);
  }

  async updateGoal(uuid: string, request: UpdateGoalRequest): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:update`, uuid, request);
  }

  async deleteGoal(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }

  // ===== Goal Status =====

  async activateGoal(uuid: string): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:activate`, uuid);
  }

  async pauseGoal(uuid: string): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:pause`, uuid);
  }

  async completeGoal(uuid: string): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:complete`, uuid);
  }

  async archiveGoal(uuid: string): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:archive`, uuid);
  }

  // ===== Search =====

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<GoalsResponse> {
    return this.ipcClient.invoke(`${this.channel}:search`, params);
  }

  // ===== KeyResult Management =====

  async addKeyResultForGoal(
    goalUuid: string,
    request: Omit<AddKeyResultRequest, 'goalUuid'>,
  ): Promise<KeyResultClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:add`, goalUuid, request);
  }

  async getKeyResultsByGoal(goalUuid: string): Promise<KeyResultsResponse> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:list`, goalUuid);
  }

  async updateKeyResultForGoal(
    goalUuid: string,
    keyResultUuid: string,
    request: UpdateKeyResultRequest,
  ): Promise<KeyResultClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:update`, goalUuid, keyResultUuid, request);
  }

  async deleteKeyResultForGoal(goalUuid: string, keyResultUuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:delete`, goalUuid, keyResultUuid);
  }

  async batchUpdateKeyResultWeights(
    goalUuid: string,
    request: {
      updates: Array<{
        keyResultUuid: string;
        weight: number;
      }>;
    },
  ): Promise<KeyResultsResponse> {
    return this.ipcClient.invoke(`${this.channel}:keyResult:batchUpdateWeights`, goalUuid, request);
  }

  async getProgressBreakdown(goalUuid: string): Promise<ProgressBreakdown> {
    return this.ipcClient.invoke(`${this.channel}:progressBreakdown`, goalUuid);
  }

  // ===== GoalReview Management =====

  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewRequest,
  ): Promise<GoalReviewClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:review:create`, goalUuid, request);
  }

  async getGoalReviewsByGoal(goalUuid: string): Promise<GoalReviewsResponse> {
    return this.ipcClient.invoke(`${this.channel}:review:list`, goalUuid);
  }

  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<GoalReviewClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:review:update`, goalUuid, reviewUuid, request);
  }

  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:review:delete`, goalUuid, reviewUuid);
  }

  // ===== GoalRecord Management =====

  async createGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    request: CreateGoalRecordRequest,
  ): Promise<GoalRecordClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:record:create`, goalUuid, keyResultUuid, request);
  }

  async getGoalRecordsByKeyResult(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.ipcClient.invoke(`${this.channel}:record:listByKeyResult`, goalUuid, keyResultUuid, params);
  }

  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.ipcClient.invoke(`${this.channel}:record:listByGoal`, goalUuid, params);
  }

  async deleteGoalRecord(
    goalUuid: string,
    keyResultUuid: string,
    recordUuid: string,
  ): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:record:delete`, goalUuid, keyResultUuid, recordUuid);
  }

  // ===== DDD Aggregate View =====

  async getGoalAggregateView(goalUuid: string): Promise<GoalAggregateViewResponse> {
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
  ): Promise<GoalClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:clone`, goalUuid, request);
  }

  // ===== AI Generation =====

  async generateKeyResults(request: {
    goalTitle: string;
    goalDescription?: string;
    startDate: number;
    endDate: number;
    goalContext?: string;
  }): Promise<{
    keyResults: Array<{
      title: string;
      description?: string;
      targetValue?: number;
      unit?: string;
    }>;
    tokenUsage: unknown;
    generatedAt: number;
  }> {
    return this.ipcClient.invoke('ai:generateKeyResults', request);
  }
}

/**
 * Factory function to create GoalIpcAdapter
 */
export function createGoalIpcAdapter(ipcClient: IpcClient): IGoalApiClient {
  return new GoalIpcAdapter(ipcClient);
}
