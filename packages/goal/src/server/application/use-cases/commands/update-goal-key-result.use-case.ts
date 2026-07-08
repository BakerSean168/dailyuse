/**
 * Update Goal Key Result Use Case
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { KeyResultClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateGoalKeyResultUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    keyResultId: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      startValue?: number;
      currentValue?: number;
      targetValue?: number;
      unit?: string;
    },
  ): Promise<Result<KeyResultClientDTO>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
    if (!keyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultId}`);
    }

    goal.updateKeyResult(keyResultId, {
      title: updates.title,
      description: updates.description,
      weight: updates.weight,
      startValue: updates.startValue,
      currentValue: updates.currentValue,
      targetValue: updates.targetValue,
      unit: updates.unit,
    });

    await this.goalRepository.save(goal);

    return ok(keyResult.toClientDTO());
  }
}
