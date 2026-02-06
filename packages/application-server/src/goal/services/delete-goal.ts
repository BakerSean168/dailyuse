/**
 * Delete Goal Service
 *
 * 删除目标（软删除）的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';

/**
 * Delete Goal Service
 */
export class DeleteGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 获取服务单例
   */

  /**
   * 检查目标依赖项
   */
  async checkDependencies(uuid: string): Promise<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean;
    canDelete: boolean;
    warnings: string[];
  }> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
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

    return {
      hasKeyResults: keyResultCount > 0,
      keyResultCount,
      hasReviews: reviewCount > 0,
      reviewCount,
      hasTaskLinks: false, // TODO: Check task links
      canDelete: true,
      warnings,
    };
  }

  /**
   * 执行软删除
   */
  async execute(uuid: string): Promise<void> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.softDelete();
    await this.goalRepository.save(goal);
    // TODO: 实现领域事件发布
  }
}
