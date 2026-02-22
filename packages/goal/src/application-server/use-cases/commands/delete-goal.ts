/**
 * Delete Goal Use Case
 *
 * 删除目标（归档）的应用服务
 * 归档后的目标不会在列表中显示，但数据保留。
 * 如需永久删除，请使用 PermanentlyDeleteGoal。
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { DeleteGoalRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Delete Goal Use Case
 * 
 * 实际执行的是归档操作（archive），而非物理删除。
 */
export class DeleteGoal {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  /**
   * 检查目标依赖项
   */
  async checkDependencies(id: string): Promise<Result<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean;
    canDelete: boolean;
    warnings: string[];
  }>> {
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
   * 执行归档（原"软删除"）
   */
  async execute(id: string): Promise<Result<DeleteGoalRes>> {
    const goal = await this.goalRepository.findById(id, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    this.goalPolicy.ensureGoalCanBeArchived(goal);

    const dto = goal.toClientDTO(true);
    goal.archive();
    await this.goalRepository.save(goal);
    return ok(dto);
  }
}
