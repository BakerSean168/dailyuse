/**
 * Goal Controller
 *
 * Encapsulates Zod validation and use case orchestration.
 * Shared by both Express (HTTP) and IPC transport layers.
 *
 * Each method:
 * 1. Validates input via Zod schema
 * 2. Delegates to the corresponding use case
 * 3. Returns a Result<T> (transport-agnostic)
 */

import type { Result } from '@memoflow/contracts/result';
import { fail, ok } from '@memoflow/contracts/result';
import {
  CreateGoalSchema,
  UpdateGoalSchema,
  CloneGoalSchema,
  ListGoalFiltersSchema,
  AddKeyResultSchema,
  DeleteKeyResultSchema,
  UpdateKeyResultSchema,
  UpdateKeyResultProgressSchema,
  CreateGoalReviewSchema,
  DeleteGoalReviewSchema,
  CreateGoalRecordSchema,
  DeleteGoalRecordSchema,
  UpdateGoalReviewSchema,
  ActivateFocusModeSchema,
  ExtendFocusModeSchema,
  GoalVersionCommandSchema,
} from '@memoflow/contracts/goal';
import type {
  GoalSystemView,
  GetGoalAggregateRes,
  ProgressBreakdown,
  ListGoalsQuery,
} from '@memoflow/contracts/goal';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { IdentityId } from '@memoflow/contracts/primitives';
import { formatZodErrors } from '@memoflow/utils/result';
import { createLogger } from '@memoflow/utils/logger';
import type {
  CreateGoalUseCase,
  GetGoalUseCase,
  ListGoalsUseCase,
  UpdateGoalUseCase,
  DeleteGoalUseCase,
  ArchiveGoalUseCase,
  ActivateGoalUseCase,
  SearchGoalsUseCase,
  AddGoalKeyResultUseCase,
  UpdateGoalKeyResultUseCase,
  UpdateGoalKeyResultProgressUseCase,
  DeleteGoalKeyResultUseCase,
  AddGoalReviewUseCase,
  ListGoalReviewsUseCase,
  UpdateGoalReviewUseCase,
  DeleteGoalReviewUseCase,
  CreateGoalRecordUseCase,
  ListGoalRecordsUseCase,
  DeleteGoalRecordUseCase,
  CompleteGoalUseCase,
  ArchiveExpiredGoalsUseCase,
  ActivateFocusModeUseCase,
  DeactivateFocusModeUseCase,
  ExtendFocusModeUseCase,
  GetCurrentFocusModeUseCase,
  GetGoalAggregateUseCase,
  GetGoalProgressBreakdownUseCase,
  CloneGoalUseCase,
  BatchUpdateKeyResultWeightsUseCase,
} from '../application';

// ============ Use Case Port ============

export interface GoalUseCases {
  createGoal: CreateGoalUseCase['execute'];
  getGoal: GetGoalUseCase['execute'];
  listGoals: ListGoalsUseCase['execute'];
  updateGoal: UpdateGoalUseCase['execute'];
  deleteGoal: DeleteGoalUseCase['execute'];
  archiveExpiredGoals: ArchiveExpiredGoalsUseCase['execute'];
  archiveGoal: ArchiveGoalUseCase['execute'];
  activateGoal: ActivateGoalUseCase['execute'];
  completeGoal: CompleteGoalUseCase['execute'];
  searchGoals: SearchGoalsUseCase['execute'];
  addKeyResult: AddGoalKeyResultUseCase['execute'];
  updateKeyResult: UpdateGoalKeyResultUseCase['execute'];
  updateKeyResultProgress: UpdateGoalKeyResultProgressUseCase['execute'];
  deleteKeyResult: DeleteGoalKeyResultUseCase['execute'];
  addReview: AddGoalReviewUseCase['execute'];
  listReviews: ListGoalReviewsUseCase['execute'];
  updateReview: UpdateGoalReviewUseCase['execute'];
  deleteReview: DeleteGoalReviewUseCase['execute'];
  createRecord: CreateGoalRecordUseCase['execute'];
  listRecords: ListGoalRecordsUseCase['execute'];
  deleteRecord: DeleteGoalRecordUseCase['execute'];
  activateFocusMode: ActivateFocusModeUseCase['execute'];
  deactivateFocusMode: DeactivateFocusModeUseCase['execute'];
  extendFocusMode: ExtendFocusModeUseCase['execute'];
  getCurrentFocusMode: GetCurrentFocusModeUseCase['execute'];
  getGoalAggregate: GetGoalAggregateUseCase['execute'];
  getGoalProgressBreakdown: GetGoalProgressBreakdownUseCase['execute'];
  cloneGoal: CloneGoalUseCase['execute'];
  batchUpdateKeyResultWeights: BatchUpdateKeyResultWeightsUseCase['execute'];
}

/**
 * Goal Controller
 *
 * Provides validated use-case calls for the Goal module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class GoalController {
  private readonly logger = createLogger('GoalController');

  constructor(private readonly useCases: GoalUseCases) {}

  // ==================== Goal CRUD ====================

  async create(input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = CreateGoalSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createGoal(parsed.data, cx);
  }

  async list(filters: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = ListGoalFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    // Construct internal query with identityId from context
    const query: ListGoalsQuery = {
      ...parsed.data,
      identityId: cx.identityId as IdentityId,
    };
    return this.useCases.listGoals(query);
  }

  async search(query: string, cx: ExecutionContext, systemView?: string): Promise<Result<unknown>> {
    if (!query.trim()) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Search query (query) is required',
      });
    }
    return this.useCases.searchGoals(cx.identityId, query, systemView as GoalSystemView);
  }

  async get(id: string, cx: ExecutionContext, includeChildren = true): Promise<Result<unknown>> {
    return this.useCases.getGoal(id, cx.identityId, includeChildren);
  }

  async update(id: string, input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = UpdateGoalSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateGoal(id, cx.identityId, parsed.data);
  }

  async delete(
    id: string,
    expectedVersion: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = GoalVersionCommandSchema.safeParse({ expectedVersion });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.deleteGoal(id, cx.identityId, parsed.data.expectedVersion);
  }

  async archiveExpired(cx: ExecutionContext): Promise<Result<unknown>> {
    return this.useCases.archiveExpiredGoals(cx.identityId);
  }

  // ==================== Goal Status Operations ====================

  async archive(
    id: string,
    expectedVersion: number,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.archiveGoal(id, cx.identityId, expectedVersion);
  }

  async activate(
    id: string,
    expectedVersion: number,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.activateGoal(id, cx.identityId, expectedVersion);
  }

  async complete(
    id: string,
    expectedVersion: number,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.completeGoal(id, cx.identityId, expectedVersion);
  }

  async getAggregate(goalId: string, cx: ExecutionContext): Promise<Result<GetGoalAggregateRes>> {
    return this.useCases.getGoalAggregate(goalId, cx.identityId);
  }

  async getProgressBreakdown(
    goalId: string,
    cx: ExecutionContext,
  ): Promise<Result<ProgressBreakdown>> {
    return this.useCases.getGoalProgressBreakdown(goalId, cx.identityId);
  }

  async cloneGoal(
    goalId: string,
    params: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsedParams = CloneGoalSchema.safeParse(params ?? {});
    if (!parsedParams.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsedParams.error.issues),
      });
    }

    return this.useCases.cloneGoal(goalId, parsedParams.data, cx);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    request: {
      expectedVersion: number;
      updates: Array<{ keyResultId: string; weight: number }>;
    },
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.batchUpdateKeyResultWeights(
      goalId,
      cx.identityId,
      request.expectedVersion,
      request.updates,
    );
  }

  // ==================== Key Results ====================

  async getKeyResults(goalId: string, cx: ExecutionContext): Promise<Result<unknown>> {
    const result = await this.useCases.getGoal(goalId, cx.identityId, true);
    if (!result.ok) return result;
    const goal = result.data as unknown as Record<string, unknown>;
    const keyResults = (goal.keyResults as unknown[]) ?? [];
    return ok({
      data: keyResults,
      total: keyResults.length,
    });
  }

  async addKeyResult(
    goalId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = AddKeyResultSchema.safeParse({
      ...(input as Record<string, unknown>),
      goalId,
    });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.addKeyResult(goalId, cx.identityId, {
      title: parsed.data.title,
      valueType: parsed.data.valueType,
      aggregationMethod: parsed.data.calculationMethod,
      startValue: parsed.data.startValue,
      targetValue: parsed.data.targetValue,
      currentValue: parsed.data.currentValue,
      unit: parsed.data.unit,
      weight: parsed.data.weight,
      expectedVersion: parsed.data.expectedVersion,
    });
  }

  async updateKeyResult(
    goalId: string,
    krId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = UpdateKeyResultSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateKeyResult(goalId, cx.identityId, krId, {
      title: parsed.data.title,
      description: parsed.data.description ?? undefined,
      weight: parsed.data.weight,
      startValue: parsed.data.startValue,
      currentValue: parsed.data.currentValue,
      targetValue: parsed.data.targetValue,
      unit: parsed.data.unit ?? undefined,
      expectedVersion: parsed.data.expectedVersion,
    });
  }

  async updateKeyResultProgress(
    goalId: string,
    krId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = UpdateKeyResultProgressSchema.safeParse({
      ...(input as Record<string, unknown>),
      keyResultId: krId,
    });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateKeyResultProgress(
      goalId,
      cx.identityId,
      krId,
      parsed.data.newValue,
      parsed.data.expectedVersion,
      parsed.data.note,
    );
  }

  async deleteKeyResult(
    goalId: string,
    krId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = DeleteKeyResultSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.deleteKeyResult(
      goalId,
      cx.identityId,
      krId,
      parsed.data.expectedVersion,
    );
  }

  // ==================== Reviews ====================

  async addReview(goalId: string, input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    const parsed = CreateGoalReviewSchema.safeParse({
      ...(input as Record<string, unknown>),
      goalId,
    });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.addReview(goalId, cx.identityId, {
      title: parsed.data.title,
      content: parsed.data.content,
      reviewType: parsed.data.reviewType,
      rating: parsed.data.rating,
      achievements: parsed.data.achievements,
      challenges: parsed.data.challenges,
      nextActions: parsed.data.nextActions,
      expectedVersion: parsed.data.expectedVersion,
    });
  }

  // ==================== Reviews - List / Update / Delete ====================

  async listReviews(goalId: string, cx: ExecutionContext): Promise<Result<unknown>> {
    return this.useCases.listReviews(goalId, cx.identityId);
  }

  async updateReview(
    goalId: string,
    reviewId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = UpdateGoalReviewSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateReview(goalId, cx.identityId, reviewId, {
      title: parsed.data.title,
      content: parsed.data.content,
      rating: parsed.data.rating,
      achievements: parsed.data.achievements,
      challenges: parsed.data.challenges,
      nextActions: parsed.data.nextActions,
      expectedVersion: parsed.data.expectedVersion,
    });
  }

  async deleteReview(
    goalId: string,
    reviewId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = DeleteGoalReviewSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.deleteReview(
      goalId,
      cx.identityId,
      reviewId,
      parsed.data.expectedVersion,
    );
  }

  // ==================== Records ====================

  async createRecord(
    goalId: string,
    keyResultId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = CreateGoalRecordSchema.safeParse({
      ...(input as Record<string, unknown>),
      keyResultId,
    });
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createRecord(
      goalId,
      keyResultId,
      {
        value: parsed.data.value,
        note: parsed.data.note,
        expectedVersion: parsed.data.expectedVersion,
      },
      cx.identityId,
    );
  }

  async listRecordsByGoal(
    goalId: string,
    params: { limit?: number; offset?: number } | undefined,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.listRecords({
      identityId: cx.identityId,
      goalId,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  async listRecordsByKeyResult(
    goalId: string,
    keyResultId: string,
    params: { limit?: number; offset?: number } | undefined,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    return this.useCases.listRecords({
      identityId: cx.identityId,
      goalId,
      keyResultId,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  async deleteRecord(
    goalId: string,
    keyResultId: string,
    recordId: string,
    input: unknown,
    cx: ExecutionContext,
  ): Promise<Result<unknown>> {
    const parsed = DeleteGoalRecordSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    const result = await this.useCases.deleteRecord(
      goalId,
      keyResultId,
      recordId,
      cx.identityId,
      parsed.data.expectedVersion,
    );
    return result;
  }

  // ==================== Focus Mode ====================

  async getCurrentFocusMode(cx: ExecutionContext): Promise<Result<unknown>> {
    this.logger.info('获取当前专注模式开始', {
      identityId: cx.identityId,
    });
    return this.useCases.getCurrentFocusMode(cx.identityId);
  }

  async activateFocusMode(input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    this.logger.info('启用专注模式开始', {
      identityId: cx.identityId,
      input,
    });
    const parsed = ActivateFocusModeSchema.safeParse(input);
    if (!parsed.success) {
      this.logger.info('启用专注模式参数校验失败', {
        identityId: cx.identityId,
        issues: parsed.error.issues,
      });
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    this.logger.info('启用专注模式参数校验通过', {
      identityId: cx.identityId,
      focusedGoalIds: parsed.data.focusedGoalIds,
      hiddenGoalsMode: parsed.data.hiddenGoalsMode,
    });
    return this.useCases.activateFocusMode(cx.identityId, parsed.data);
  }

  async deactivateFocusMode(cx: ExecutionContext): Promise<Result<unknown>> {
    this.logger.info('停用专注模式开始', {
      identityId: cx.identityId,
    });
    return this.useCases.deactivateFocusMode(cx.identityId);
  }

  async extendFocusMode(input: unknown, cx: ExecutionContext): Promise<Result<unknown>> {
    this.logger.info('延长专注模式开始', {
      identityId: cx.identityId,
      input,
    });
    const parsed = ExtendFocusModeSchema.safeParse(input);
    if (!parsed.success) {
      this.logger.info('延长专注模式参数校验失败', {
        identityId: cx.identityId,
        issues: parsed.error.issues,
      });
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    this.logger.info('延长专注模式参数校验通过', {
      identityId: cx.identityId,
      newEndTime: parsed.data.newEndTime,
    });
    return this.useCases.extendFocusMode(cx.identityId, parsed.data.newEndTime);
  }
}
