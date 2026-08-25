import type { GoalMutationReceipt } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import {
  GoalPolicy,
  GoalStatus,
  GoalVersionConflictError,
  type IGoalRepository,
} from '../../../domain';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

/** Explicitly marks a Goal as Abandoned without archiving it. */
export class AbandonGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    id: string,
    identityId: string,
    expectedVersion: number,
  ): Promise<Result<GoalMutationReceipt>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, id, {
      includeChildren: true,
    });
    if (!goal) return error('NOT_FOUND', `Goal not found: ${id}`);

    if (goal.status === GoalStatus.Abandoned) {
      return ok(createGoalMutationReceipt(goal));
    }
    if (expectedVersion !== goal.version) {
      return error('CONFLICT', 'Goal has been modified by another client');
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.abandon();
    goal.advanceVersion();

    try {
      await this.goalRepository.saveRootWithExpectedVersion(goal, expectedVersion);
    } catch (cause) {
      if (cause instanceof GoalVersionConflictError) return error('CONFLICT', cause.message);
      throw cause;
    }

    return ok(createGoalMutationReceipt(goal));
  }
}
