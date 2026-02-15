/**
 * Delete Goal Use Case
 *
 * 删除目标（软删除）的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { DeleteGoalRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * Delete Goal Use Case
 */
export class DeleteGoal {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  /**
   * 检查目标依赖项
   */
  async checkDependencies(uuid: string): Promise<Result<{
    hasKeyResults: boolean;
    keyResultCount: number;
    hasReviews: boolean;
    reviewCount: number;
    hasTaskLinks: boolean;
    canDelete: boolean;
    warnings: string[];
  }>> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
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
  async execute(uuid: string): Promise<Result<DeleteGoalRes>> {
    const goal = await this.goalRepository.findById(uuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    this.goalPolicy.ensureGoalCanBeDeleted(goal);

    const dto = goal.toClientDTO(true);
    goal.softDelete();
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);
    return ok(dto);
  }
}
