/**
 * Activate Goal Use Case
 *
 * 激活目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Activate Goal Use Case
 */
export class ActivateGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(id: string, identityId: string): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findByIdForIdentity(identityId, id);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    if (goal.archivedAt || goal.deletedAt) {
      return error('INVALID_STATE', 'Archived or deleted goals cannot be reactivated');
    }

    this.goalPolicy.ensureGoalCanBeActivated(goal);
    goal.activate();
    await this.goalRepository.save(goal);

    return ok(goal.toClientDTO());
  }
}
