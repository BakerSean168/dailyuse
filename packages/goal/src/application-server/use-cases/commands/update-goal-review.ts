/**
 * Update Goal Review Use Case
 *
 * 更新目标复盘记录
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateGoalReview {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    reviewId: string,
    params: {
      title?: string;
      content?: string;
      rating?: number | null;
      achievements?: string | null;
      challenges?: string | null;
      nextActions?: string | null;
    },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
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
    return ok(goal.toClientDTO(true));
  }
}
