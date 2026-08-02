/**
 * Complete Goal Use Case
 *
 * 完成目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import { GoalPolicy, GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import type { GoalMutationReceipt } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

/**
 * Complete Goal Use Case
 */
export class CompleteGoalUseCase {
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
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }
    if (expectedVersion !== goal.version) {
      return error('CONFLICT', 'Goal has been modified by another client');
    }

    if (goal.completedAt && goal.archivedAt) {
      return ok(createGoalMutationReceipt(goal));
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.markAsCompleted();
    goal.advanceVersion();
    try {
      await this.goalRepository.saveRootWithExpectedVersion(goal, expectedVersion);
    } catch (cause) {
      if (cause instanceof GoalVersionConflictError) return error('CONFLICT', cause.message);
      throw cause;
    }
    // Domain events are published by the repository layer (via EventBusAdapter)

    return ok(createGoalMutationReceipt(goal));
  }
}
