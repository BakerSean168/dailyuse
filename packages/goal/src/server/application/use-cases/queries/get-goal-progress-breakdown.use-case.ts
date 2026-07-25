/**
 * Get Goal Progress Breakdown Use Case
 *
 * Delegates to the domain aggregate's getProgressBreakdown() method.
 * Replaces the inline weighted-average calculation previously in GoalController.getProgressBreakdown().
 */

import type { IGoalRepository } from '../../../domain';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class GetGoalProgressBreakdownUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(goalId: string, identityId: string): Promise<Result<ProgressBreakdown>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    return ok(goal.getProgressBreakdown());
  }
}
