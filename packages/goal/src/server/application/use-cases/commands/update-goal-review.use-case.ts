/**
 * Update Goal Review Use Case
 *
 * 更新目标复盘记录
 */

import { GoalPolicy, GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import type { GoalMutationReceipt } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

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
      expectedVersion: number;
      title?: string;
      content?: string;
      rating?: number | null;
      achievements?: string | null;
      challenges?: string | null;
      nextActions?: string | null;
    },
  ): Promise<Result<GoalMutationReceipt>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }
    if (params.expectedVersion !== goal.version) {
      return error('CONFLICT', 'Goal has been modified by another client');
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);

    goal.updateReview(reviewId, {
      rating: params.rating ?? undefined,
      summary: params.content,
      achievements: params.achievements ?? undefined,
      challenges: params.challenges ?? undefined,
      improvements: params.nextActions ?? undefined,
    });

    const review = goal.goalReviews.find((item) => item.id === reviewId);
    if (!review) {
      return error('NOT_FOUND', `Goal review not found: ${reviewId}`);
    }
    goal.advanceVersion();
    try {
      await this.goalRepository.saveRootWithExpectedVersion(goal, params.expectedVersion);
    } catch (cause) {
      if (cause instanceof GoalVersionConflictError) return error('CONFLICT', cause.message);
      throw cause;
    }
    return ok(createGoalMutationReceipt(goal, { reviewIds: [review.id] }));
  }
}
