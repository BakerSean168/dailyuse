import type { GoalReviewSystemContext } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { IGoalRepository } from '../../../domain';
import { GoalReviewContextBuilder } from '../../services/goal-review-context-builder';

const DAY_MS = 24 * 60 * 60 * 1000;

export class GetGoalReviewContextUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly contextBuilder: GoalReviewContextBuilder,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async execute(
    goalId: string,
    identityId: string,
    windowDays: number = 7,
  ): Promise<Result<GoalReviewSystemContext>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) return error('NOT_FOUND', `Goal not found: ${goalId}`);
    const windowEndAt = this.now();
    return ok(
      await this.contextBuilder.build(goal, {
        windowStartAt: windowEndAt - windowDays * DAY_MS,
        windowEndAt,
      }),
    );
  }
}
