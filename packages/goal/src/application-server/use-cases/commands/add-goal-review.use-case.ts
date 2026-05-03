/**
 * Add Goal Review Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalReviewClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class AddGoalReviewUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
    },
  ): Promise<Result<GoalReviewClientDTO>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    const review = goal.createAndAddReview(params);
    await this.goalRepository.save(goal);

    return ok(review.toClientDTO());
  }
}
