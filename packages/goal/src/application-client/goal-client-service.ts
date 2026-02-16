/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 * Example: create-goal.ts, update-goal.ts, delete-goal.ts, list-goals.ts
 */

/**
 * Goal Client Service
 *
 * Constructor-injected application service for goal management.
 * Uses port interfaces (IGoalApiClient, IGoalFolderApiClient) directly,
 * returning Result<T> types throughout.
 *
 * @module application-client/goal-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import { map as mapResult } from '@dailyuse/contracts/result';
import type {
  CreateGoalReq,
  UpdateGoalReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
  GoalReviewClientDTO,
  QueryGoalsRes,
  GetKeyResultsRes,
  GetGoalRecordsRes,
  GetGoalReviewsRes,
  GetGoalAggregateRes,
  ProgressBreakdown,
  FocusSessionClientDTO,
  StartFocusReq,
  GetFocusHistoryReq,
  GetFocusStatusRes,
  GetFocusHistoryRes,
  GetFocusStatisticsRes,
} from '@dailyuse/contracts/goal';
import type {
  IGoalApiClient,
  IGoalFolderApiClient,
  IGoalFocusApiClient,
} from '@/infrastructure-client/adapters/types';
import { Goal, GoalFolder, KeyResult, GoalReview, GoalRecord } from '@/domain-client';

export class GoalClientService {
  constructor(
    private readonly goalApi: IGoalApiClient,
    private readonly folderApi: IGoalFolderApiClient,
    private readonly focusApi?: IGoalFocusApiClient,
  ) {}

  // ===== Goal Management =====

  async createGoal(request: CreateGoalReq): Promise<Result<Goal>> {
    const result = await this.goalApi.createGoal(request);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async getGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.getGoalById(id);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async listGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>> {
    const result = await this.goalApi.getGoals(params);
    return mapResult(result, (data: QueryGoalsRes) => ({
      goals: data.data.map((dto) => Goal.fromDTO(dto)),
      pagination: data.pagination,
    }));
  }

  async updateGoal(id: string, request: UpdateGoalReq): Promise<Result<Goal>> {
    const result = await this.goalApi.updateGoal(id, request);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async deleteGoal(id: string): Promise<Result<void>> {
    return this.goalApi.deleteGoal(id);
  }

  async activateGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.activateGoal(id);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async pauseGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.pauseGoal(id);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async completeGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.completeGoal(id);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async archiveGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.archiveGoal(id);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirId?: string;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>> {
    const result = await this.goalApi.searchGoals(params);
    return mapResult(result, (data: QueryGoalsRes) => ({
      goals: data.data.map((dto) => Goal.fromDTO(dto)),
      pagination: data.pagination,
    }));
  }

  async getGoalAggregateView(id: string): Promise<Result<GetGoalAggregateRes>> {
    return this.goalApi.getGoalAggregateView(id);
  }

  async cloneGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.cloneGoal(id, {});
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  // ===== Key Result Use Cases =====

  async createKeyResult(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<KeyResult>> {
    const result = await this.goalApi.addKeyResultForGoal(goalId, request);
    return mapResult(result, (dto) => KeyResult.fromDTO(dto));
  }

  async getKeyResults(goalId: string): Promise<Result<{ keyResults: KeyResult[] }>> {
    const result = await this.goalApi.getKeyResultsByGoal(goalId);
    return mapResult(result, (data: GetKeyResultsRes) => ({
      keyResults: data.data.map((dto) => KeyResult.fromDTO(dto as any)),
    }));
  }

  async updateKeyResult(
    goalId: string,
    krId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResult>> {
    const result = await this.goalApi.updateKeyResultForGoal(goalId, krId, request);
    return mapResult(result, (dto) => KeyResult.fromDTO(dto));
  }

  async deleteKeyResult(goalId: string, krId: string): Promise<Result<void>> {
    return this.goalApi.deleteKeyResultForGoal(goalId, krId);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    updates: Array<{ keyResultId: string; weight: number }>,
  ): Promise<Result<{ keyResults: KeyResult[] }>> {
    const result = await this.goalApi.batchUpdateKeyResultWeights(goalId, { updates });
    return mapResult(result, (data: GetKeyResultsRes) => ({
      keyResults: data.data.map((dto) => KeyResult.fromDTO(dto as any)),
    }));
  }

  async getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>> {
    return this.goalApi.getProgressBreakdown(goalId);
  }

  async generateKeyResults(params: {
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
    return this.goalApi.generateKeyResults(params);
  }

  // ===== Goal Record Use Cases =====

  async createGoalRecord(
    goalId: string,
    keyResultId: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecord>> {
    const result = await this.goalApi.createGoalRecord(goalId, keyResultId, request);
    return mapResult(result, (dto) => GoalRecord.fromDTO(dto));
  }

  async getGoalRecordsByKeyResult(
    goalId: string,
    krId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>> {
    const result = await this.goalApi.getGoalRecordsByKeyResult(goalId, krId, params);
    return mapResult(result, (data: GetGoalRecordsRes) => ({
      records: data.data.map((dto) => GoalRecord.fromDTO(dto)),
      total: data.total,
    }));
  }

  async getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>> {
    const result = await this.goalApi.getGoalRecordsByGoal(goalId, params);
    return mapResult(result, (data: GetGoalRecordsRes) => ({
      records: data.data.map((dto) => GoalRecord.fromDTO(dto)),
      total: data.total,
    }));
  }

  async deleteGoalRecord(
    goalId: string,
    krId: string,
    recordId: string,
  ): Promise<Result<void>> {
    return this.goalApi.deleteGoalRecord(goalId, krId, recordId);
  }

  // ===== Goal Review Use Cases =====

  async createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReview>> {
    const result = await this.goalApi.createGoalReview(goalId, request);
    return mapResult(result, (dto) => GoalReview.fromDTO(dto));
  }

  async getGoalReviews(goalId: string): Promise<Result<{ reviews: GoalReview[] }>> {
    const result = await this.goalApi.getGoalReviewsByGoal(goalId);
    return mapResult(result, (data: GetGoalReviewsRes) => ({
      reviews: data.data.map((dto) => GoalReview.fromDTO(dto as any)),
    }));
  }

  async updateGoalReview(
    goalId: string,
    reviewId: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReview>> {
    const result = await this.goalApi.updateGoalReview(goalId, reviewId, request);
    return mapResult(result, (dto) => GoalReview.fromDTO(dto));
  }

  async deleteGoalReview(goalId: string, reviewId: string): Promise<Result<void>> {
    return this.goalApi.deleteGoalReview(goalId, reviewId);
  }

  // ===== Goal Folder Use Cases =====

  async createGoalFolder(request: CreateGoalFolderReq): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.createGoalFolder(request);
    return mapResult(result, (dto) => GoalFolder.fromDTO(dto));
  }

  async listGoalFolders(): Promise<Result<GoalFolder[]>> {
    const result = await this.folderApi.getGoalFolders();
    return mapResult(result, (data) => data.data.map((dto) => GoalFolder.fromDTO(dto)));
  }

  async getGoalFolder(id: string): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.getGoalFolderById(id);
    return mapResult(result, (dto) => GoalFolder.fromDTO(dto));
  }

  async updateGoalFolder(
    id: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.updateGoalFolder(id, request);
    return mapResult(result, (dto) => GoalFolder.fromDTO(dto));
  }

  async deleteGoalFolder(id: string): Promise<Result<void>> {
    return this.folderApi.deleteGoalFolder(id);
  }

  // ===== Focus Session Use Cases =====

  private requireFocusApi(): IGoalFocusApiClient {
    if (!this.focusApi) {
      throw new Error('GoalClientService: focusApi is required for focus session operations');
    }
    return this.focusApi;
  }

  async startFocusSession(request: StartFocusReq): Promise<Result<FocusSessionClientDTO>> {
    return this.requireFocusApi().startSession(request);
  }

  async pauseFocusSession(): Promise<Result<FocusSessionClientDTO>> {
    return this.requireFocusApi().pauseSession();
  }

  async resumeFocusSession(): Promise<Result<FocusSessionClientDTO>> {
    return this.requireFocusApi().resumeSession();
  }

  async stopFocusSession(notes?: string): Promise<Result<FocusSessionClientDTO | null>> {
    return this.requireFocusApi().stopSession(notes);
  }

  async getFocusStatus(): Promise<Result<GetFocusStatusRes>> {
    return this.requireFocusApi().getStatus();
  }

  async getFocusHistory(
    request?: GetFocusHistoryReq & { range?: 'today' | 'week' },
  ): Promise<Result<GetFocusHistoryRes>> {
    const api = this.requireFocusApi();

    if (!request) {
      return api.getHistory({} as GetFocusHistoryReq);
    }

    const { range, ...params } = request;

    if (range === 'today') {
      return api.getTodayHistory(params.goalId);
    }

    if (range === 'week') {
      return api.getWeekHistory(params.goalId);
    }

    return api.getHistory(params as GetFocusHistoryReq);
  }

  async getFocusStatistics(goalId?: string): Promise<Result<GetFocusStatisticsRes>> {
    return this.requireFocusApi().getStatistics(goalId);
  }
}
