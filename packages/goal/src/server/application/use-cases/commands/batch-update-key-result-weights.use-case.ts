/**
 * Batch Update Key Result Weights Use Case
 *
 * Sequentially updates key result weights with short-circuit on failure.
 * Returns the updated goal aggregate on success.
 * Replaces the inline workflow previously in GoalController.batchUpdateKeyResultWeights().
 */

import type { IGoalRepository } from '../../../domain';
import type { GetGoalRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { UpdateGoalKeyResultUseCase } from './update-goal-key-result.use-case';

export interface KeyResultWeightUpdate {
  keyResultId: string;
  weight: number;
}

export class BatchUpdateKeyResultWeightsUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly updateKeyResult: UpdateGoalKeyResultUseCase,
  ) {}

  async execute(
    goalId: string,
    updates: KeyResultWeightUpdate[],
  ): Promise<Result<GetGoalRes>> {
    for (const { keyResultId, weight } of updates) {
      const result = await this.updateKeyResult.execute(goalId, keyResultId, { weight });
      if (!result.ok) return result;
    }

    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return { ok: false, error: { code: 'NOT_FOUND', message: `Goal not found: ${goalId}` } };
    }

    return ok(goal.toClientDTO(true));
  }
}
