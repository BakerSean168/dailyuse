/**
 * Update Goal Review Use Case
 *
 * 更新目标复盘记录
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { GoalReviewClientDTO } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class UpdateGoalReviewUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    identityId: string,
    reviewId: string,
    params: {
      title?: string;
      content?: string;
      rating?: number | null;
      achievements?: string | null;
      challenges?: string | null;
      nextActions?: string | null;
    },
  ): Promise<Result<GoalReviewClientDTO>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);

    goal.updateReview(reviewId, {
      rating: params.rating ?? undefined,
      summary: params.content,
      achievements: params.achievements ?? undefined,
      challenges: params.challenges ?? undefined,
      improvements: params.nextActions ?? undefined,
    });

    await this.goalRepository.save(goal);
    const review = goal.goalReviews.find((item) => item.id === reviewId);
    if (!review) {
      return error('NOT_FOUND', `Goal review not found: ${reviewId}`);
    }
    return ok(review.toClientDTO());
  }
}
