/**
 * Update Goal Key Result Progress Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateGoalKeyResultProgress {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    keyResultId: string,
    currentValue: number,
    note?: string,
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.updateKeyResultProgress(keyResultId, currentValue, note);
    await this.goalRepository.save(goal);

    return ok(goal.toClientDTO(true));
  }
}
