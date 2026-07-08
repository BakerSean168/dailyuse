/**
 * Delete Goal Use Case
 *
 * 删除目标（软删除）的应用服务
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { DeleteGoalRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

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
  async checkDependencies(id: string): Promise<
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
    const goal = await this.goalRepository.findById(id, { includeChildren: true });
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
  async execute(id: string): Promise<Result<DeleteGoalRes>> {
    const goal = await this.goalRepository.findById(id, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    goal.softDelete();
    await this.goalRepository.save(goal);
    return ok(goal.toClientDTO(true));
  }
}
