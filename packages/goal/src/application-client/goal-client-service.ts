/**
 * Goal Client Service
 *
 * Constructor-injected application service for goal management.
 * Uses port interfaces (IGoalApiClient, IGoalFolderApiClient) directly,
 * returning Result<T> types throughout.
 *
 * @module application-client/goal-client-service
 */

import type { Result } from '@memoflow/contracts/result';
import { map as mapResult } from '@memoflow/contracts/result';
import type {
  CreateGoalReq,
  UpdateGoalReq,
  DeleteGoalReq,
  CloneGoalReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  DeleteKeyResultReq,
  CreateGoalFolderReq,
  UpdateGoalFolderReq,
  CreateGoalRecordReq,
  DeleteGoalRecordReq,
  CreateGoalReviewReq,
  UpdateGoalReviewReq,
  DeleteGoalReviewReq,
  GoalReviewClientDTO,
  GoalClientDTO,
  GoalMutationReceipt,
  GoalSystemView,
  GoalFolderClientDTO,
  KeyResultClientDTO,
  GoalRecordClientDTO,
  QueryGoalsRes,
  GetKeyResultsRes,
  GetGoalRecordsRes,
  GetGoalReviewsRes,
  GetGoalAggregateRes,
  ProgressBreakdown,
  FocusModeDTO,
  ActivateFocusModeRequest,
} from '@memoflow/contracts/goal';
import type { IGoalApiClient } from './ports/goal-api-client.port';
import type { IGoalFolderApiClient } from './ports/goal-folder-api-client.port';
import type { IGoalFocusApiClient } from './ports/goal-focus-api-client.port';
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
import { IdentityId } from '@memoflow/domain-shared/shared';

// ===== DTO-to-State Mappers =====

function goalFromDTO(dto: GoalClientDTO): Goal {
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
    startDate: dto.startDate ? dto.startDate : null,
    targetDate: dto.targetDate ? dto.targetDate : null,
    completedAt: dto.completedAt ? dto.completedAt : null,
    archivedAt: dto.archivedAt ? dto.archivedAt : null,
    folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
    parentGoalId: dto.parentGoalId ? GoalId.of(dto.parentGoalId) : null,
    sortOrder: dto.sortOrder,
    reminderConfig: dto.reminderConfig ?? null,
    version: dto.version,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt ?? null,
    keyResults: dto.keyResults?.map((kr) => keyResultFromDTO(kr)) ?? null,
    reviews: dto.reviews?.map((r) => goalReviewFromDTO(r)) ?? null,
    totalKeyResults: dto.totalKeyResults,
    completedKeyResults: dto.completedKeyResults,
    overallProgress: dto.overallProgress,
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
    version: dto.version,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt ?? null,
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
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
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
    reviewedAt: dto.reviewedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
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
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  });
}

// ─── Client Application Port ────────────────────────────────────────────────

/** High-level client-side operations for the goal module. */
export interface GoalClientPort {
  createGoal(request: CreateGoalReq): Promise<Result<GoalMutationReceipt>>;
  getGoal(id: string): Promise<Result<Goal>>;
  listGoals(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>>;
  updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalMutationReceipt>>;
  deleteGoal(id: string, request: DeleteGoalReq): Promise<Result<GoalMutationReceipt>>;
  activateGoal(id: string, expectedVersion: number): Promise<Result<GoalMutationReceipt>>;
  completeGoal(id: string, expectedVersion: number): Promise<Result<GoalMutationReceipt>>;
  archiveGoal(id: string, expectedVersion: number): Promise<Result<GoalMutationReceipt>>;
  searchGoals(params: {
    query: string;
    page?: number;
    pageSize?: number;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
  }): Promise<Result<{ goals: Goal[]; pagination: QueryGoalsRes['pagination'] }>>;
  archiveExpiredGoals(): Promise<Result<{ archivedCount: number }>>;
  getGoalAggregateView(id: string): Promise<Result<GetGoalAggregateRes>>;
  cloneGoal(id: string, request?: CloneGoalReq): Promise<Result<GoalMutationReceipt>>;
  createKeyResult(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<GoalMutationReceipt>>;
  getKeyResults(goalId: string): Promise<Result<{ keyResults: KeyResult[] }>>;
  updateKeyResult(
    goalId: string,
    krId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<GoalMutationReceipt>>;
  deleteKeyResult(
    goalId: string,
    krId: string,
    request: DeleteKeyResultReq,
  ): Promise<Result<GoalMutationReceipt>>;
  batchUpdateKeyResultWeights(
    goalId: string,
    expectedVersion: number,
    updates: Array<{ keyResultId: string; weight: number }>,
  ): Promise<Result<GoalMutationReceipt>>;
  getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>>;
  generateKeyResults(params: {
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
  createGoalRecord(
    goalId: string,
    keyResultId: string,
    request: Pick<CreateGoalRecordReq, 'value' | 'note' | 'expectedVersion'>,
  ): Promise<Result<GoalMutationReceipt>>;
  getGoalRecordsByKeyResult(
    goalId: string,
    krId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>>;
  getGoalRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<{ records: GoalRecord[]; total: number }>>;
  deleteGoalRecord(
    goalId: string,
    krId: string,
    recordId: string,
    request: DeleteGoalRecordReq,
  ): Promise<Result<GoalMutationReceipt>>;
  createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalMutationReceipt>>;
  getGoalReviews(goalId: string): Promise<Result<{ reviews: GoalReview[] }>>;
  updateGoalReview(
    goalId: string,
    reviewId: string,
    request: UpdateGoalReviewReq,
  ): Promise<Result<GoalMutationReceipt>>;
  deleteGoalReview(
    goalId: string,
    reviewId: string,
    request: DeleteGoalReviewReq,
  ): Promise<Result<GoalMutationReceipt>>;
  createGoalFolder(request: CreateGoalFolderReq): Promise<Result<GoalFolder>>;
  listGoalFolders(): Promise<Result<GoalFolder[]>>;
  getGoalFolder(id: string): Promise<Result<GoalFolder>>;
  updateGoalFolder(id: string, request: UpdateGoalFolderReq): Promise<Result<GoalFolder>>;
  deleteGoalFolder(id: string): Promise<Result<void>>;
  getCurrentFocusMode(): Promise<Result<FocusModeDTO | null>>;
  activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeDTO>>;
  deactivateFocusMode(): Promise<Result<FocusModeDTO | null>>;
  extendFocusMode(newEndTime: number): Promise<Result<FocusModeDTO>>;
}

export class GoalClientService implements GoalClientPort {
  constructor(
    private readonly goalApi: IGoalApiClient,
    private readonly folderApi: IGoalFolderApiClient,
    private readonly focusApi?: IGoalFocusApiClient,
  ) {
    this.createGoal = this.createGoal.bind(this);
    this.getGoal = this.getGoal.bind(this);
    this.listGoals = this.listGoals.bind(this);
    this.updateGoal = this.updateGoal.bind(this);
    this.deleteGoal = this.deleteGoal.bind(this);
    this.activateGoal = this.activateGoal.bind(this);
    this.completeGoal = this.completeGoal.bind(this);
    this.archiveGoal = this.archiveGoal.bind(this);
    this.searchGoals = this.searchGoals.bind(this);
    this.archiveExpiredGoals = this.archiveExpiredGoals.bind(this);
    this.getGoalAggregateView = this.getGoalAggregateView.bind(this);
    this.cloneGoal = this.cloneGoal.bind(this);
    this.createKeyResult = this.createKeyResult.bind(this);
    this.getKeyResults = this.getKeyResults.bind(this);
    this.updateKeyResult = this.updateKeyResult.bind(this);
    this.deleteKeyResult = this.deleteKeyResult.bind(this);
    this.batchUpdateKeyResultWeights = this.batchUpdateKeyResultWeights.bind(this);
    this.getProgressBreakdown = this.getProgressBreakdown.bind(this);
    this.generateKeyResults = this.generateKeyResults.bind(this);
    this.createGoalRecord = this.createGoalRecord.bind(this);
    this.getGoalRecordsByKeyResult = this.getGoalRecordsByKeyResult.bind(this);
    this.getGoalRecordsByGoal = this.getGoalRecordsByGoal.bind(this);
    this.deleteGoalRecord = this.deleteGoalRecord.bind(this);
    this.createGoalReview = this.createGoalReview.bind(this);
    this.getGoalReviews = this.getGoalReviews.bind(this);
    this.updateGoalReview = this.updateGoalReview.bind(this);
    this.deleteGoalReview = this.deleteGoalReview.bind(this);
    this.createGoalFolder = this.createGoalFolder.bind(this);
    this.listGoalFolders = this.listGoalFolders.bind(this);
    this.getGoalFolder = this.getGoalFolder.bind(this);
    this.updateGoalFolder = this.updateGoalFolder.bind(this);
    this.deleteGoalFolder = this.deleteGoalFolder.bind(this);
    this.getCurrentFocusMode = this.getCurrentFocusMode.bind(this);
    this.activateFocusMode = this.activateFocusMode.bind(this);
    this.deactivateFocusMode = this.deactivateFocusMode.bind(this);
    this.extendFocusMode = this.extendFocusMode.bind(this);
  }

  // ===== Goal Management =====

  async createGoal(request: CreateGoalReq): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.createGoal(request);
  }

  async getGoal(id: string): Promise<Result<Goal>> {
    const result = await this.goalApi.getGoalById(id);
    return mapResult(result, (dto) => goalFromDTO(dto));
  }

  async listGoals(params?: {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
    startDate?: number;
    endDate?: number;
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

  async updateGoal(id: string, request: UpdateGoalReq): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.updateGoal(id, request);
  }

  async deleteGoal(id: string, request: DeleteGoalReq): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.deleteGoal(id, request);
  }

  async activateGoal(id: string, expectedVersion: number): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.activateGoal(id, expectedVersion);
  }

  async completeGoal(id: string, expectedVersion: number): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.completeGoal(id, expectedVersion);
  }

  async archiveGoal(id: string, expectedVersion: number): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.archiveGoal(id, expectedVersion);
  }

  async searchGoals(params: {
    query: string;
    page?: number;
    pageSize?: number;
    status?: string[];
    systemView?: GoalSystemView;
    folderId?: string;
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

  async archiveExpiredGoals(): Promise<Result<{ archivedCount: number }>> {
    return this.goalApi.archiveExpiredGoals();
  }

  async getGoalAggregateView(id: string): Promise<Result<GetGoalAggregateRes>> {
    return this.goalApi.getGoalAggregateView(id);
  }

  async cloneGoal(id: string, request: CloneGoalReq = {}): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.cloneGoal(id, request);
  }

  // ===== Key Result Use Cases =====

  async createKeyResult(
    goalId: string,
    request: Omit<AddKeyResultReq, 'goalId'>,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.addKeyResultForGoal(goalId, request);
  }

  async getKeyResults(goalId: string): Promise<Result<{ keyResults: KeyResult[] }>> {
    const result = await this.goalApi.getKeyResultsByGoal(goalId);
    return mapResult(result, (data: GetKeyResultsRes) => ({
      keyResults: (data?.data ?? []).map((dto) => keyResultFromDTO(dto)),
    }));
  }

  async updateKeyResult(
    goalId: string,
    krId: string,
    request: UpdateKeyResultReq,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.updateKeyResultForGoal(goalId, krId, request);
  }

  async deleteKeyResult(
    goalId: string,
    krId: string,
    request: DeleteKeyResultReq,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.deleteKeyResultForGoal(goalId, krId, request);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    expectedVersion: number,
    updates: Array<{ keyResultId: string; weight: number }>,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.batchUpdateKeyResultWeights(goalId, {
      expectedVersion,
      updates,
    });
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
    request: Pick<CreateGoalRecordReq, 'value' | 'note' | 'expectedVersion'>,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.createGoalRecord(goalId, keyResultId, request);
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

  async deleteGoalRecord(
    goalId: string,
    krId: string,
    recordId: string,
    request: DeleteGoalRecordReq,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.deleteGoalRecord(goalId, krId, recordId, request);
  }

  // ===== Goal Review Use Cases =====

  async createGoalReview(
    goalId: string,
    request: CreateGoalReviewReq,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.createGoalReview(goalId, request);
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
    request: UpdateGoalReviewReq,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.updateGoalReview(goalId, reviewId, request);
  }

  async deleteGoalReview(
    goalId: string,
    reviewId: string,
    request: DeleteGoalReviewReq,
  ): Promise<Result<GoalMutationReceipt>> {
    return this.goalApi.deleteGoalReview(goalId, reviewId, request);
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

  // ===== Focus Mode Use Cases =====

  private requireFocusApi(): IGoalFocusApiClient {
    if (!this.focusApi) {
      throw new Error('GoalClientService: focusApi is required for focus mode operations');
    }
    return this.focusApi;
  }

  async getCurrentFocusMode(): Promise<Result<FocusModeDTO | null>> {
    return this.requireFocusApi().getCurrentFocusMode();
  }

  async activateFocusMode(request: ActivateFocusModeRequest): Promise<Result<FocusModeDTO>> {
    return this.requireFocusApi().activateFocusMode(request);
  }

  async deactivateFocusMode(): Promise<Result<FocusModeDTO | null>> {
    return this.requireFocusApi().deactivateFocusMode();
  }

  async extendFocusMode(newEndTime: number): Promise<Result<FocusModeDTO>> {
    return this.requireFocusApi().extendFocusMode({ newEndTime });
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/** Create a `GoalClientService` from any transport adapter. */
export function createGoalClientService(
  goalApi: IGoalApiClient,
  folderApi: IGoalFolderApiClient,
  focusApi?: IGoalFocusApiClient,
): GoalClientService {
  return new GoalClientService(goalApi, folderApi, focusApi);
}
