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

import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import {
  CreateGoalSchema,
  UpdateGoalSchema,
  CloneGoalSchema,
  ListGoalFiltersSchema,
  AddKeyResultSchema,
  UpdateKeyResultSchema,
  UpdateKeyResultProgressSchema,
  CreateGoalReviewSchema,
  CreateGoalRecordSchema,
  UpdateGoalReviewSchema,
  GetGoalRecordsSchema,
  ActivateFocusModeSchema,
  ExtendFocusModeSchema,
} from '@dailyuse/contracts/goal';
import type {
  CreateGoalReq,
  GoalClientDTO,
  GetGoalAggregateRes,
  ProgressBreakdown,
  CloneGoalReq,
  UpdateGoalReq,
  ListGoalFilters,
  ListGoalsQuery,
  AddKeyResultReq,
  UpdateKeyResultReq,
  UpdateKeyResultProgressReq,
  CreateGoalReviewReq,
} from '@dailyuse/contracts/goal';
import type { Context } from '@dailyuse/contracts/shared';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { formatZodErrors } from '@dailyuse/utils/result';
import { createLogger } from '@dailyuse/utils';
import type {
  CreateGoal,
  GetGoal,
  ListGoals,
  UpdateGoal,
  DeleteGoal,
  ArchiveGoal,
  ActivateGoal,
  SearchGoals,
  AddGoalKeyResult,
  UpdateGoalKeyResult,
  UpdateGoalKeyResultProgress,
  DeleteGoalKeyResult,
  AddGoalReview,
  ListGoalReviews,
  UpdateGoalReview,
  DeleteGoalReview,
  CreateGoalRecord,
  ListGoalRecords,
  DeleteGoalRecord,
  CompleteGoal,
  ArchiveExpiredGoals,
  ActivateFocusMode,
  DeactivateFocusMode,
  ExtendFocusMode,
  GetCurrentFocusMode,
} from '../application-server';

// ============ Use Case Port ============

export interface GoalUseCases {
  createGoal: CreateGoal;
  getGoal: GetGoal;
  listGoals: ListGoals;
  updateGoal: UpdateGoal;
  deleteGoal: DeleteGoal;
  archiveExpiredGoals: ArchiveExpiredGoals;
  archiveGoal: ArchiveGoal;
  activateGoal: ActivateGoal;
  completeGoal: CompleteGoal;
  searchGoals: SearchGoals;
  addKeyResult: AddGoalKeyResult;
  updateKeyResult: UpdateGoalKeyResult;
  updateKeyResultProgress: UpdateGoalKeyResultProgress;
  deleteKeyResult: DeleteGoalKeyResult;
  addReview: AddGoalReview;
  listReviews: ListGoalReviews;
  updateReview: UpdateGoalReview;
  deleteReview: DeleteGoalReview;
  createRecord: CreateGoalRecord;
  listRecords: ListGoalRecords;
  deleteRecord: DeleteGoalRecord;
  activateFocusMode: ActivateFocusMode;
  deactivateFocusMode: DeactivateFocusMode;
  extendFocusMode: ExtendFocusMode;
  getCurrentFocusMode: GetCurrentFocusMode;
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

  private toGoalClientDTO(data: unknown): GoalClientDTO {
    return data as GoalClientDTO;
  }

  // ==================== Goal CRUD ====================

  async create(input: unknown, ctx: Context): Promise<Result<unknown>> {
    const parsed = CreateGoalSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.createGoal.execute(parsed.data, ctx);
  }

  async list(filters: unknown, ctx: Context): Promise<Result<unknown>> {
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
      identityId: ctx.identityId as IdentityId,
    };
    return this.useCases.listGoals.execute(query);
  }

  async search(query: string, ctx: Context, systemView?: string): Promise<Result<unknown>> {
    if (!query.trim()) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Search query (query) is required',
      });
    }
    return this.useCases.searchGoals.execute(ctx.identityId, query, systemView as any);
  }

  async get(id: string, includeChildren = true): Promise<Result<unknown>> {
    return this.useCases.getGoal.execute(id, includeChildren);
  }

  async update(id: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateGoalSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateGoal.execute(id, parsed.data);
  }

  async delete(id: string): Promise<Result<unknown>> {
    return this.useCases.deleteGoal.execute(id);
  }

  async archiveExpired(ctx: Context): Promise<Result<unknown>> {
    return this.useCases.archiveExpiredGoals.execute(ctx.identityId);
  }

  // ==================== Goal Status Operations ====================

  async archive(id: string): Promise<Result<unknown>> {
    return this.useCases.archiveGoal.execute(id);
  }

  async activate(id: string): Promise<Result<unknown>> {
    return this.useCases.activateGoal.execute(id);
  }

  async complete(id: string): Promise<Result<unknown>> {
    try {
      const result = await this.useCases.completeGoal.execute(id);
      return ok(result.goal);
    } catch (e: any) {
      return fail({ code: 'INTERNAL_ERROR', message: e.message ?? 'Failed to complete goal' });
    }
  }

  async getAggregate(goalId: string): Promise<Result<GetGoalAggregateRes>> {
    const goalResult = await this.useCases.getGoal.execute(goalId, true);
    if (!goalResult.ok) return goalResult;

    const goal = this.toGoalClientDTO(goalResult.data);
    const recordsResult = await this.useCases.listRecords.execute({ goalId });
    const records = recordsResult.ok ? recordsResult.data.data : [];
    const reviews = goal.reviews ?? [];
    const keyResults = goal.keyResults ?? [];

    return ok({
      goal,
      keyResults,
      records,
      reviews,
      statistics: {
        totalKeyResults: keyResults.length,
        completedKeyResults: 0,
        totalRecords: records.length,
        totalReviews: reviews.length,
        overallProgress: 0,
      },
    });
  }

  async getProgressBreakdown(goalId: string): Promise<Result<ProgressBreakdown>> {
    const goalResult = await this.useCases.getGoal.execute(goalId, true);
    if (!goalResult.ok) return goalResult;

    const goal = this.toGoalClientDTO(goalResult.data);
    const keyResults = goal.keyResults ?? [];
    const totalWeight = keyResults.reduce(
      (sum, kr) => sum + (typeof kr.weight === 'number' ? kr.weight : 0),
      0,
    );

    return ok({
      totalProgress: keyResults.length
        ? Math.round(
            keyResults.reduce((sum, kr) => {
              const progressValue =
                typeof kr.progress?.currentValue === 'number' &&
                typeof kr.progress?.targetValue === 'number' &&
                kr.progress.targetValue > kr.progress.initialValue
                  ? ((kr.progress.currentValue - kr.progress.initialValue) /
                      (kr.progress.targetValue - kr.progress.initialValue)) *
                    100
                  : typeof kr.progress?.targetValue === 'number' && kr.progress.targetValue > 0
                    ? (kr.progress.currentValue / kr.progress.targetValue) * 100
                    : 0;
              const weight = typeof kr.weight === 'number' ? kr.weight : 0;
              return sum + progressValue * weight;
            }, 0) / (totalWeight || keyResults.length),
          ) / 100
        : 0,
      calculationMode: 'WeightedAverage' as const,
      krContributions: keyResults.map((kr) => {
        const progress =
          typeof kr.progress?.currentValue === 'number' &&
          typeof kr.progress?.targetValue === 'number' &&
          kr.progress.targetValue > kr.progress.initialValue
            ? Math.round(
                ((kr.progress.currentValue - kr.progress.initialValue) /
                  (kr.progress.targetValue - kr.progress.initialValue)) *
                  10000,
              ) / 100
            : typeof kr.progress?.targetValue === 'number' && kr.progress.targetValue > 0
              ? Math.round((kr.progress.currentValue / kr.progress.targetValue) * 10000) / 100
              : 0;
        const weight = typeof kr.weight === 'number' ? kr.weight : 0;
        return {
          keyResultId: kr.id,
          keyResultName: kr.title,
          progress,
          weight,
          contribution:
            totalWeight > 0 ? Math.round(((progress * weight) / totalWeight) * 100) / 100 : 0,
        };
      }),
      lastUpdateTime: typeof goal.updatedAt === 'number' ? goal.updatedAt : Date.now(),
      updateTrigger: '自动计算',
    });
  }

  async cloneGoal(goalId: string, params: unknown, ctx: Context): Promise<Result<GoalClientDTO>> {
    const parsedParams = CloneGoalSchema.safeParse(params ?? {});
    if (!parsedParams.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsedParams.error.issues),
      });
    }

    // Get original goal
    const goalResult = await this.useCases.getGoal.execute(goalId, true);
    if (!goalResult.ok) return goalResult;

    const original = this.toGoalClientDTO(goalResult.data);
    const createData = toCreateGoalReqFromCloneSource(original, parsedParams.data);

    return this.useCases.createGoal.execute(createData, ctx);
  }

  async batchUpdateKeyResultWeights(
    goalId: string,
    updates: Array<{ keyResultId: string; weight: number }>,
  ): Promise<Result<unknown>> {
    // Update weights one by one
    for (const { keyResultId, weight } of updates) {
      const result = await this.useCases.updateKeyResult.execute(goalId, keyResultId, { weight });
      if (!result.ok) return result;
    }
    // Return updated goal
    return this.useCases.getGoal.execute(goalId, true);
  }

  // ==================== Key Results ====================

  async getKeyResults(goalId: string): Promise<Result<unknown>> {
    const result = await this.useCases.getGoal.execute(goalId, true);
    if (!result.ok) return result;
    const goal = result.data as unknown as Record<string, unknown>;
    const keyResults = (goal.keyResults as unknown[]) ?? [];
    return ok({
      data: keyResults,
      total: keyResults.length,
    });
  }

  async addKeyResult(goalId: string, input: unknown): Promise<Result<unknown>> {
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
    return this.useCases.addKeyResult.execute(goalId, {
      title: parsed.data.title,
      valueType: parsed.data.valueType,
      aggregationMethod: parsed.data.calculationMethod,
      startValue: parsed.data.startValue,
      targetValue: parsed.data.targetValue,
      currentValue: parsed.data.currentValue,
      unit: parsed.data.unit,
      weight: parsed.data.weight,
    });
  }

  async updateKeyResult(goalId: string, krId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateKeyResultSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateKeyResult.execute(goalId, krId, {
      title: parsed.data.title,
      description: parsed.data.description ?? undefined,
      weight: parsed.data.weight,
      startValue: parsed.data.startValue,
      currentValue: parsed.data.currentValue,
      targetValue: parsed.data.targetValue,
      unit: parsed.data.unit ?? undefined,
    });
  }

  async updateKeyResultProgress(
    goalId: string,
    krId: string,
    input: unknown,
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
    return this.useCases.updateKeyResultProgress.execute(
      goalId,
      krId,
      parsed.data.newValue,
      parsed.data.note,
    );
  }

  async deleteKeyResult(goalId: string, krId: string): Promise<Result<unknown>> {
    return this.useCases.deleteKeyResult.execute(goalId, krId);
  }

  // ==================== Reviews ====================

  async addReview(goalId: string, input: unknown): Promise<Result<unknown>> {
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
    return this.useCases.addReview.execute(goalId, {
      title: parsed.data.title,
      content: parsed.data.content,
      reviewType: parsed.data.reviewType,
      rating: parsed.data.rating,
      achievements: parsed.data.achievements,
      challenges: parsed.data.challenges,
      nextActions: parsed.data.nextActions,
    });
  }

  // ==================== Reviews - List / Update / Delete ====================

  async listReviews(goalId: string): Promise<Result<unknown>> {
    return this.useCases.listReviews.execute(goalId);
  }

  async updateReview(goalId: string, reviewId: string, input: unknown): Promise<Result<unknown>> {
    const parsed = UpdateGoalReviewSchema.safeParse(input);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.updateReview.execute(goalId, reviewId, {
      title: parsed.data.title,
      content: parsed.data.content,
      rating: parsed.data.rating,
      achievements: parsed.data.achievements,
      challenges: parsed.data.challenges,
      nextActions: parsed.data.nextActions,
    });
  }

  async deleteReview(goalId: string, reviewId: string): Promise<Result<unknown>> {
    return this.useCases.deleteReview.execute(goalId, reviewId);
  }

  // ==================== Records ====================

  async createRecord(
    goalId: string,
    keyResultId: string,
    input: unknown,
    ctx: Context,
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
    return this.useCases.createRecord.execute(
      goalId,
      keyResultId,
      {
        value: parsed.data.value,
        note: parsed.data.note,
      },
      ctx.identityId,
    );
  }

  async listRecordsByGoal(
    goalId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<unknown>> {
    return this.useCases.listRecords.execute({
      goalId,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  async listRecordsByKeyResult(
    goalId: string,
    keyResultId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Result<unknown>> {
    return this.useCases.listRecords.execute({
      goalId,
      keyResultId,
      limit: params?.limit,
      offset: params?.offset,
    });
  }

  async deleteRecord(recordId: string): Promise<Result<unknown>> {
    return this.useCases.deleteRecord.execute(recordId);
  }

  // ==================== Focus Mode ====================

  async getCurrentFocusMode(ctx: Context): Promise<Result<unknown>> {
    this.logger.info('获取当前专注模式开始', {
      identityId: ctx.identityId,
    });
    return this.useCases.getCurrentFocusMode.execute(ctx.identityId);
  }

  async activateFocusMode(input: unknown, ctx: Context): Promise<Result<unknown>> {
    this.logger.info('启用专注模式开始', {
      identityId: ctx.identityId,
      input,
    });
    const parsed = ActivateFocusModeSchema.safeParse(input);
    if (!parsed.success) {
      this.logger.info('启用专注模式参数校验失败', {
        identityId: ctx.identityId,
        issues: parsed.error.issues,
      });
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    this.logger.info('启用专注模式参数校验通过', {
      identityId: ctx.identityId,
      focusedGoalIds: parsed.data.focusedGoalIds,
      hiddenGoalsMode: parsed.data.hiddenGoalsMode,
    });
    return this.useCases.activateFocusMode.execute(ctx.identityId, parsed.data);
  }

  async deactivateFocusMode(ctx: Context): Promise<Result<unknown>> {
    this.logger.info('停用专注模式开始', {
      identityId: ctx.identityId,
    });
    return this.useCases.deactivateFocusMode.execute(ctx.identityId);
  }

  async extendFocusMode(input: unknown, ctx: Context): Promise<Result<unknown>> {
    this.logger.info('延长专注模式开始', {
      identityId: ctx.identityId,
      input,
    });
    const parsed = ExtendFocusModeSchema.safeParse(input);
    if (!parsed.success) {
      this.logger.info('延长专注模式参数校验失败', {
        identityId: ctx.identityId,
        issues: parsed.error.issues,
      });
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    this.logger.info('延长专注模式参数校验通过', {
      identityId: ctx.identityId,
      newEndTime: parsed.data.newEndTime,
    });
    return this.useCases.extendFocusMode.execute(ctx.identityId, parsed.data.newEndTime);
  }
}

function toCreateGoalReqFromCloneSource(
  original: GoalClientDTO,
  params: CloneGoalReq,
): CreateGoalReq {
  return CreateGoalSchema.parse({
    name: params.name ?? `${original.name} (Copy)`,
    description: params.description ?? original.description ?? undefined,
    importance: original.importance,
    category: original.category ?? undefined,
    tags: original.tags.length > 0 ? original.tags : undefined,
  });
}
