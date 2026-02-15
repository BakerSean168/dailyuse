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

  async getGoal(uuid: string): Promise<Result<Goal>> {
    const result = await this.goalApi.getGoalById(uuid);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async listGoals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>> {
    const result = await this.goalApi.getGoals(params);
    return mapResult(result, (data: QueryGoalsRes) => ({
      goals: data.data.map((dto) => Goal.fromDTO(dto)),
      pagination: data.pagination,
    }));
  }

  async updateGoal(uuid: string, request: UpdateGoalReq): Promise<Result<Goal>> {
    const result = await this.goalApi.updateGoal(uuid, request);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async deleteGoal(uuid: string): Promise<Result<void>> {
    return this.goalApi.deleteGoal(uuid);
  }

  async activateGoal(uuid: string): Promise<Result<Goal>> {
    const result = await this.goalApi.activateGoal(uuid);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async pauseGoal(uuid: string): Promise<Result<Goal>> {
    const result = await this.goalApi.pauseGoal(uuid);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async completeGoal(uuid: string): Promise<Result<Goal>> {
    const result = await this.goalApi.completeGoal(uuid);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async archiveGoal(uuid: string): Promise<Result<Goal>> {
    const result = await this.goalApi.archiveGoal(uuid);
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  async searchGoals(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    dirUuid?: string;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>> {
    const result = await this.goalApi.searchGoals(params);
    return mapResult(result, (data: QueryGoalsRes) => ({
      goals: data.data.map((dto) => Goal.fromDTO(dto)),
      pagination: data.pagination,
    }));
  }

  async getGoalAggregateView(uuid: string): Promise<Result<GetGoalAggregateRes>> {
    return this.goalApi.getGoalAggregateView(uuid);
  }

  async cloneGoal(uuid: string): Promise<Result<Goal>> {
    const result = await this.goalApi.cloneGoal(uuid, {});
    return mapResult(result, (dto) => Goal.fromDTO(dto));
  }

  // ===== Key Result Use Cases =====

  async createKeyResult(
    goalUuid: string,
    request: Omit<AddKeyResultReq, 'goalUuid'>,
  ): Promise<Result<KeyResult>> {
    const result = await this.goalApi.addKeyResultForGoal(goalUuid, request);
    return mapResult(result, (dto) => KeyResult.fromDTO(dto));
  }

  async getKeyResults(goalUuid: string): Promise<Result<{ keyResults: KeyResult[] }>> {
    const result = await this.goalApi.getKeyResultsByGoal(goalUuid);
    return mapResult(result, (data: GetKeyResultsRes) => ({
      keyResults: data.data.map((dto) => KeyResult.fromDTO(dto as any)),
    }));
  }

  async updateKeyResult(
    goalUuid: string,
    krUuid: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResult>> {
    const result = await this.goalApi.updateKeyResultForGoal(goalUuid, krUuid, request);
    return mapResult(result, (dto) => KeyResult.fromDTO(dto));
  }

  async deleteKeyResult(goalUuid: string, krUuid: string): Promise<Result<void>> {
    return this.goalApi.deleteKeyResultForGoal(goalUuid, krUuid);
  }

  async batchUpdateKeyResultWeights(
    goalUuid: string,
    updates: Array<{ keyResultUuid: string; weight: number }>,
  ): Promise<Result<{ keyResults: KeyResult[] }>> {
    const result = await this.goalApi.batchUpdateKeyResultWeights(goalUuid, { updates });
    return mapResult(result, (data: GetKeyResultsRes) => ({
      keyResults: data.data.map((dto) => KeyResult.fromDTO(dto as any)),
    }));
  }

  async getProgressBreakdown(goalUuid: string): Promise<Result<ProgressBreakdown>> {
    return this.goalApi.getProgressBreakdown(goalUuid);
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
    goalUuid: string,
    keyResultUuid: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note'>,
  ): Promise<Result<GoalRecord>> {
    const result = await this.goalApi.createGoalRecord(goalUuid, keyResultUuid, request);
    return mapResult(result, (dto) => GoalRecord.fromDTO(dto));
  }

  async getGoalRecordsByKeyResult(
    goalUuid: string,
    krUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>> {
    const result = await this.goalApi.getGoalRecordsByKeyResult(goalUuid, krUuid, params);
    return mapResult(result, (data: GetGoalRecordsRes) => ({
      records: data.data.map((dto) => GoalRecord.fromDTO(dto)),
      total: data.total,
    }));
  }

  async getGoalRecordsByGoal(
    goalUuid: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>> {
    const result = await this.goalApi.getGoalRecordsByGoal(goalUuid, params);
    return mapResult(result, (data: GetGoalRecordsRes) => ({
      records: data.data.map((dto) => GoalRecord.fromDTO(dto)),
      total: data.total,
    }));
  }

  async deleteGoalRecord(
    goalUuid: string,
    krUuid: string,
    recordUuid: string,
  ): Promise<Result<void>> {
    return this.goalApi.deleteGoalRecord(goalUuid, krUuid, recordUuid);
  }

  // ===== Goal Review Use Cases =====

  async createGoalReview(
    goalUuid: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReview>> {
    const result = await this.goalApi.createGoalReview(goalUuid, request);
    return mapResult(result, (dto) => GoalReview.fromDTO(dto));
  }

  async getGoalReviews(goalUuid: string): Promise<Result<{ reviews: GoalReview[] }>> {
    const result = await this.goalApi.getGoalReviewsByGoal(goalUuid);
    return mapResult(result, (data: GetGoalReviewsRes) => ({
      reviews: data.data.map((dto) => GoalReview.fromDTO(dto as any)),
    }));
  }

  async updateGoalReview(
    goalUuid: string,
    reviewUuid: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReview>> {
    const result = await this.goalApi.updateGoalReview(goalUuid, reviewUuid, request);
    return mapResult(result, (dto) => GoalReview.fromDTO(dto));
  }

  async deleteGoalReview(goalUuid: string, reviewUuid: string): Promise<Result<void>> {
    return this.goalApi.deleteGoalReview(goalUuid, reviewUuid);
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

  async getGoalFolder(uuid: string): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.getGoalFolderById(uuid);
    return mapResult(result, (dto) => GoalFolder.fromDTO(dto));
  }

  async updateGoalFolder(
    uuid: string,
    request: UpdateGoalFolderReq,
  ): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.updateGoalFolder(uuid, request);
    return mapResult(result, (dto) => GoalFolder.fromDTO(dto));
  }

  async deleteGoalFolder(uuid: string): Promise<Result<void>> {
    return this.folderApi.deleteGoalFolder(uuid);
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
      return api.getTodayHistory(params.goalUuid);
    }

    if (range === 'week') {
      return api.getWeekHistory(params.goalUuid);
    }

    return api.getHistory(params as GetFocusHistoryReq);
  }

  async getFocusStatistics(goalUuid?: string): Promise<Result<GetFocusStatisticsRes>> {
    return this.requireFocusApi().getStatistics(goalUuid);
  }
}
