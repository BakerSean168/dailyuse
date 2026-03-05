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
  QueryGoalsSchema,
  AddKeyResultSchema,
  UpdateKeyResultSchema,
  UpdateKeyResultProgressSchema,
  CreateGoalReviewSchema,
  CreateGoalRecordSchema,
  UpdateGoalReviewSchema,
  GetGoalRecordsSchema,
} from '@dailyuse/contracts/goal';
import type {
  CreateGoalReq,
  UpdateGoalReq,
  QueryGoalsReq,
  AddKeyResultReq,
  UpdateKeyResultReq,
  UpdateKeyResultProgressReq,
  CreateGoalReviewReq,
} from '@dailyuse/contracts/goal';
import type { Context } from '@dailyuse/contracts/shared';
import { formatZodErrors } from '@dailyuse/utils/result';
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
} from '../application-server';

// ============ Use Case Port ============

export interface GoalUseCases {
  createGoal: CreateGoal;
  getGoal: GetGoal;
  listGoals: ListGoals;
  updateGoal: UpdateGoal;
  deleteGoal: DeleteGoal;
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
}

/**
 * Goal Controller
 *
 * Provides validated use-case calls for the Goal module.
 * Used by both expressAdapter (HTTP) and ipcAdapter (IPC).
 */
export class GoalController {
  constructor(private readonly useCases: GoalUseCases) {}

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

  async list(query: unknown): Promise<Result<unknown>> {
    const parsed = QueryGoalsSchema.safeParse(query);
    if (!parsed.success) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        details: formatZodErrors(parsed.error.issues),
      });
    }
    return this.useCases.listGoals.execute(parsed.data);
  }

  async search(query: string, ctx: Context): Promise<Result<unknown>> {
    if (!query.trim()) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Search query (q) is required',
      });
    }
    return this.useCases.searchGoals.execute(ctx.identityId, query);
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

  async getAggregate(goalId: string): Promise<Result<unknown>> {
    const goalResult = await this.useCases.getGoal.execute(goalId, true);
    if (!goalResult.ok) return goalResult;

    const goal = goalResult.data as unknown as Record<string, unknown>;
    const recordsResult = await this.useCases.listRecords.execute({ goalId });
    const records = recordsResult.ok ? (recordsResult.data as any).data : [];
    const reviews = (goal.reviews as unknown[]) ?? [];
    const keyResults = (goal.keyResults as unknown[]) ?? [];

    return ok({
      goal: goalResult.data,
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

  async getProgressBreakdown(goalId: string): Promise<Result<unknown>> {
    const goalResult = await this.useCases.getGoal.execute(goalId, true);
    if (!goalResult.ok) return goalResult;

    const goal = goalResult.data as unknown as Record<string, unknown>;
    const keyResults = ((goal.keyResults as any[]) ?? []).map((kr: any) => ({
      keyResultId: kr.id,
      title: kr.title,
      weight: kr.weight,
      progress: kr.progress,
    }));

    return ok({
      goalId,
      keyResults,
      overallProgress: 0,
    });
  }

  async cloneGoal(
    goalId: string,
    params: { name?: string; description?: string; includeKeyResults?: boolean; includeRecords?: boolean },
    ctx: Context,
  ): Promise<Result<unknown>> {
    // Get original goal
    const goalResult = await this.useCases.getGoal.execute(goalId, true);
    if (!goalResult.ok) return goalResult;

    const original = goalResult.data as unknown as Record<string, unknown>;
    const createData = {
      name: params.name ?? `${original.name} (Copy)`,
      description: params.description ?? (original.description as string | undefined),
      status: 'Active',
      importance: original.importance,
      category: original.category,
      tags: original.tags,
    };

    return this.useCases.createGoal.execute(createData as any, ctx);
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
      valueType: parsed.data.valueType as any,
      aggregationMethod: parsed.data.calculationMethod as any,
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
    return this.useCases.createRecord.execute(goalId, keyResultId, {
      value: parsed.data.value,
      note: parsed.data.note,
    }, ctx.identityId);
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
}
