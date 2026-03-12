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
  CloneGoalReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  CreateGoalRecordReq,
  CreateGoalReviewReq,
  GoalReviewClientDTO,
  GoalClientDTO,
  GoalFolderClientDTO,
  KeyResultClientDTO,
  KeyResultServerDTO,
  GoalRecordClientDTO,
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
} from '@dailyuse/contracts/goal';
import type {
  IGoalApiClient,
  IGoalFolderApiClient,
  IGoalFocusApiClient,
} from '../infrastructure-client/adapters/types';
import {
  Goal,
  GoalFolder,
  KeyResult,
  GoalReview,
  GoalRecord,
  GoalId,
  GoalFolderId,
  KeyResultId,
  GoalReviewId,
  GoalRecordId,
} from '../domain-client';
import { IdentityId } from '@dailyuse/domain-shared/shared';

// ===== DTO-to-State Mappers =====

function goalFromDTO(dto: GoalClientDTO): Goal {
  const dtoWithSummary = dto as GoalClientDTO & {
    totalKeyResults?: number;
    completedKeyResults?: number;
  };

  return Goal.load({
    id: GoalId.of(dto.id),
    identityId: IdentityId.of(dto.identityId),
    name: dto.name,
    description: dto.description,
    color: dto.color,
    feasibilityAnalysis: dto.feasibilityAnalysis,
    motivation: dto.motivation,
    status: dto.status,
    importance: dto.importance,
    priority: dto.priority ?? 0,
    category: dto.category,
    tags: dto.tags ?? [],
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
    completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
    archivedAt: dto.archivedAt ? new Date(dto.archivedAt) : null,
    folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
    parentGoalId: dto.parentGoalId ? GoalId.of(dto.parentGoalId) : null,
    sortOrder: dto.sortOrder,
    reminderConfig: dto.reminderConfig ?? null,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    keyResults: dto.keyResults?.map((kr) => keyResultFromDTO(kr)) ?? null,
    reviews: dto.reviews?.map((r) => goalReviewFromDTO(r)) ?? null,
    totalKeyResults: dtoWithSummary.totalKeyResults,
    completedKeyResults: dtoWithSummary.completedKeyResults,
  });
}

function goalFolderFromDTO(dto: GoalFolderClientDTO): GoalFolder {
  return GoalFolder.load({
    id: GoalFolderId.of(dto.id),
    identityId: IdentityId.of(dto.identityId),
    name: dto.name,
    description: dto.description,
    icon: dto.icon,
    color: dto.color,
    parentFolderId: dto.parentFolderId ? GoalFolderId.of(dto.parentFolderId) : null,
    sortOrder: dto.sortOrder,
    isSystemFolder: dto.isSystemFolder,
    folderType: dto.folderType,
    goalCount: dto.goalCount,
    completedGoalCount: dto.completedGoalCount,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

function keyResultFromDTO(dto: KeyResultClientDTO): KeyResult {
  return KeyResult.load({
    id: KeyResultId.of(dto.id),
    title: dto.title,
    description: dto.description,
    progress: dto.progress,
    weight: dto.weight,
    order: dto.order,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

function keyResultFromServerDTO(dto: KeyResultServerDTO): KeyResult {
  return keyResultFromDTO({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    progress: dto.progress,
    weight: dto.weight,
    order: dto.sortOrder,
    version: dto.version,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
  });
}

function goalReviewFromDTO(dto: GoalReviewClientDTO): GoalReview {
  return GoalReview.load({
    id: GoalReviewId.of(dto.id),
    goalId: GoalId.of(dto.goalId),
    type: dto.type,
    rating: dto.rating,
    summary: dto.summary,
    achievements: dto.achievements,
    challenges: dto.challenges,
    improvements: dto.improvements,
    keyResultSnapshots: dto.keyResultSnapshots ?? [],
    version: dto.version,
    reviewedAt: new Date(dto.reviewedAt),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

function goalRecordFromDTO(dto: GoalRecordClientDTO): GoalRecord {
  return GoalRecord.load({
    id: GoalRecordId.of(dto.id),
    keyResultId: KeyResultId.of(dto.keyResultId),
    goalId: GoalId.of(dto.goalId),
    value: dto.value,
    valueAfter: dto.valueAfter,
    comment: dto.comment,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
  });
}

export class GoalClientService {
  constructor(
    private readonly goalApi: IGoalApiClient,
    private readonly folderApi: IGoalFolderApiClient,
    private readonly focusApi?: IGoalFocusApiClient,
  ) {}

  // ===== Goal Management =====

  async createGoal(request: CreateGoalReq): Promise<Result<Goal>> {
    const result = await this.goalApi.createGoal(request);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async getGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.getGoalById(id);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async listGoals(params?: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
    dirId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>> {
    const result = await this.goalApi.getGoals(params);
    return mapResult(result, (data: QueryGoalsRes) => ({
      goals: (data?.data ?? []).map((dto) => goalFromDTO(dto)),
      pagination: data?.pagination ?? {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
        totalPages: 0,
      },
    }));
  }

  async updateGoal(id: string, request: UpdateGoalReq): Promise<Result<Goal>> {
    const result = await this.goalApi.updateGoal(id, request);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async deleteGoal(id: string): Promise<Result<void>> {
    return this.goalApi.deleteGoal(id);
  }

  async activateGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.activateGoal(id);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async pauseGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.pauseGoal(id);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async completeGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.completeGoal(id);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async archiveGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.archiveGoal(id);
    return mapResult(result, (dto) => goalFromDTO(dto));
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
      goals: (data?.data ?? []).map((dto) => goalFromDTO(dto)),
      pagination: data?.pagination ?? {
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
        totalPages: 0,
      },
    }));
  }

  async getGoalAggregateView(id: string): Promise<Result<GetGoalAggregateRes>> {
    return this.goalApi.getGoalAggregateView(id);
  }

  async cloneGoal(id: string, request: CloneGoalReq = {}): Promise<Result<Goal>> {
    const result = await this.goalApi.cloneGoal(id, request);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  // ===== Key Result Use Cases =====

  async createKeyResult(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<KeyResult>> {
    const result = await this.goalApi.addKeyResultForGoal(goalId, request);
    return mapResult(result, (dto) => keyResultFromDTO(dto));
  }

  async getKeyResults(goalId: string): Promise<Result<{ keyResults: KeyResult[] }>> {
    const result = await this.goalApi.getKeyResultsByGoal(goalId);
    return mapResult(result, (data: GetKeyResultsRes) => ({
      keyResults: (data?.data ?? []).map((dto) => keyResultFromServerDTO(dto)),
    }));
  }

  async updateKeyResult(
    goalId: string,
    krId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<KeyResult>> {
    const result = await this.goalApi.updateKeyResultForGoal(goalId, krId, request);
    return mapResult(result, (dto) => keyResultFromDTO(dto));
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
      keyResults: data.data.map((dto) => keyResultFromServerDTO(dto)),
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
    return mapResult(result, (dto) => goalRecordFromDTO(dto));
  }

  async getGoalRecordsByKeyResult(
    goalId: string,
    krId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>> {
    const result = await this.goalApi.getGoalRecordsByKeyResult(goalId, krId, params);
    return mapResult(result, (data: GetGoalRecordsRes) => ({
      records: data.data.map((dto) => goalRecordFromDTO(dto)),
      total: data.total,
    }));
  }

  async getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>> {
    const result = await this.goalApi.getGoalRecordsByGoal(goalId, params);
    return mapResult(result, (data: GetGoalRecordsRes) => ({
      records: data.data.map((dto) => goalRecordFromDTO(dto)),
      total: data.total,
    }));
  }

  async deleteGoalRecord(goalId: string, krId: string, recordId: string): Promise<Result<void>> {
    return this.goalApi.deleteGoalRecord(goalId, krId, recordId);
  }

  // ===== Goal Review Use Cases =====

  async createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalReview>> {
    const result = await this.goalApi.createGoalReview(goalId, request);
    return mapResult(result, (dto) => goalReviewFromDTO(dto));
  }

  async getGoalReviews(goalId: string): Promise<Result<{ reviews: GoalReview[] }>> {
    const result = await this.goalApi.getGoalReviewsByGoal(goalId);
    return mapResult(result, (data: GetGoalReviewsRes) => ({
      reviews: data.data.map((dto) => goalReviewFromDTO(dto as GoalReviewClientDTO)),
    }));
  }

  async updateGoalReview(
    goalId: string,
    reviewId: string,
    request: Partial<GoalReviewClientDTO>,
  ): Promise<Result<GoalReview>> {
    const result = await this.goalApi.updateGoalReview(goalId, reviewId, request);
    return mapResult(result, (dto) => goalReviewFromDTO(dto));
  }

  async deleteGoalReview(goalId: string, reviewId: string): Promise<Result<void>> {
    return this.goalApi.deleteGoalReview(goalId, reviewId);
  }

  // ===== Goal Folder Use Cases =====

  async createGoalFolder(request: CreateGoalFolderReq): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.createGoalFolder(request);
    return mapResult(result, (dto) => goalFolderFromDTO(dto));
  }

  async listGoalFolders(): Promise<Result<GoalFolder[]>> {
    const result = await this.folderApi.getGoalFolders();
    return mapResult(result, (data) => data.data.map((dto) => goalFolderFromDTO(dto)));
  }

  async getGoalFolder(id: string): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.getGoalFolderById(id);
    return mapResult(result, (dto) => goalFolderFromDTO(dto));
  }

  async updateGoalFolder(id: string, request: UpdateGoalFolderReq): Promise<Result<GoalFolder>> {
    const result = await this.folderApi.updateGoalFolder(id, request);
    return mapResult(result, (dto) => goalFolderFromDTO(dto));
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
}
