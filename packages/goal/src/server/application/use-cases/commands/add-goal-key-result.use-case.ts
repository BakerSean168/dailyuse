/**
 * Add Goal Key Result Use Case
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { KeyResultClientDTO } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class AddGoalKeyResultUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    identityId: string,
    keyResult: {
      title: string;
      valueType: string;
      aggregationMethod?: string;
      startValue?: number;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<Result<KeyResultClientDTO>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    const addedKeyResult = goal.createAndAddKeyResult(keyResult);
    await this.goalRepository.save(goal);

    return ok(addedKeyResult.toClientDTO());
  }
}
