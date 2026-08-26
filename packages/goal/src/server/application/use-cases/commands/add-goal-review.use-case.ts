import { GoalPolicy, GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import type { GoalMutationReceipt } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import { GoalReviewContextBuilder } from '../../services/goal-review-context-builder';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

const DAY_MS = 24 * 60 * 60 * 1000;

export class AddGoalReviewUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
    private readonly contextBuilder: GoalReviewContextBuilder,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(
    goalId: string,
    identityId: string,
    params: {
      expectedVersion: number;
      reflection: string;
      challenges?: string | null;
      adjustments?: string | null;
      windowDays?: number;
    },
  ): Promise<Result<GoalMutationReceipt>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) return error('NOT_FOUND', `Goal not found: ${goalId}`);
    if (params.expectedVersion !== goal.version) {
      return error('CONFLICT', 'Goal has been modified by another client');
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    const windowEndAt = this.now();
    const windowDays = params.windowDays ?? 7;
    const systemContext = await this.contextBuilder.build(goal, {
      windowStartAt: windowEndAt - windowDays * DAY_MS,
      windowEndAt,
    });
    const review = goal.createAndAddReview({
      reflection: params.reflection,
      challenges: params.challenges,
      adjustments: params.adjustments,
      systemContext,
    });
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
