/**
 * Complete Goal Use Case
 *
 * 完成目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { GoalServerDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Complete Goal Use Case
 */
export class CompleteGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(id: string): Promise<Result<{ goal: GoalServerDTO }>> {
    const goal = await this.goalRepository.findById(id);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    if (goal.completedAt && goal.archivedAt) {
      return ok({
        goal: goal.toServerDTO(true),
      });
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.markAsCompleted();
    await this.goalRepository.save(goal);
    // Domain events are published by the repository layer (via EventBusAdapter)

    return ok({
      goal: goal.toServerDTO(true),
    });
  }
}
