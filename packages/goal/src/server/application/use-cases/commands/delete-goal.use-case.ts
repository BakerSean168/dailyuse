/**
 * Delete Goal Use Case
 *
 * 删除目标（软删除）的应用服务
 */

import { GoalPolicy, GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import type { GoalMutationReceipt } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

/**
 * Delete Goal Use Case
 *
 * 实际执行的是软删除操作，目标进入"已删除"视图。
 */
export class DeleteGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  /**
   * 检查目标依赖项
   */
  async checkDependencies(
    id: string,
    identityId: string,
  ): Promise<
    Result<{
      hasKeyResults: boolean;
      keyResultCount: number;
      hasReviews: boolean;
      reviewCount: number;
      hasTaskLinks: boolean;
      canDelete: boolean;
      warnings: string[];
    }>
  > {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, id, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    const keyResults = goal.keyResults || [];
    const goalReviews = goal.goalReviews || [];
    const keyResultCount = keyResults.length;
    const reviewCount = goalReviews.length;

    const warnings: string[] = [];

    if (keyResultCount > 0) {
      warnings.push(`该目标包含 ${keyResultCount} 个关键结果`);
    }

    if (reviewCount > 0) {
      warnings.push(`该目标包含 ${reviewCount} 条复盘记录`);
    }

    return ok({
      hasKeyResults: keyResultCount > 0,
      keyResultCount,
      hasReviews: reviewCount > 0,
      reviewCount,
      hasTaskLinks: false,
      canDelete: true,
      warnings,
    });
  }

  /**
   * 执行软删除
   */
  async execute(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, id, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }
    if (expectedVersion !== goal.version) {
      return error('CONFLICT', 'Goal has been modified by another client');
    }

    goal.softDelete();
    goal.advanceVersion();
    try {
      await this.goalRepository.saveRootWithExpectedVersion(goal, expectedVersion);
    } catch (cause) {
      if (cause instanceof GoalVersionConflictError) return error('CONFLICT', cause.message);
      throw cause;
    }
    return ok(createGoalMutationReceipt(goal));
  }
}
