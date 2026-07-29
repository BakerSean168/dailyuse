/**
 * Delete Goal Key Result Use Case
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class DeleteGoalKeyResultUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    identityId: string,
    keyResultId: string,
  ): Promise<Result<void>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, goalId, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    const removedKeyResult = goal.removeKeyResult(keyResultId);
    if (!removedKeyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultId}`);
    }
    await this.goalRepository.save(goal);

    return ok(undefined);
  }
}
