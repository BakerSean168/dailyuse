/**
 * Delete Goal Review Use Case
 *
 * 删除目标复盘记录
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class DeleteGoalReviewUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(goalId: string, reviewId: string): Promise<Result<void>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);

    const removed = goal.removeReview(reviewId);
    if (!removed) {
      return error('NOT_FOUND', `Review not found: ${reviewId}`);
    }

    await this.goalRepository.save(goal);
    return ok(undefined);
  }
}
