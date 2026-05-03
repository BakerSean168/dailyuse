/**
 * Update Goal Key Result Progress Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { KeyResultClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateGoalKeyResultProgressUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    keyResultId: string,
    currentValue: number,
    note?: string,
  ): Promise<Result<KeyResultClientDTO>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.updateKeyResultProgress(keyResultId, currentValue, note);
    await this.goalRepository.save(goal);

    const keyResult = goal.getKeyResult(keyResultId);
    if (!keyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultId}`);
    }

    return ok(keyResult.toClientDTO());
  }
}
