/**
 * Complete Goal Service
 *
 * 完成目标的应用服务
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalServerDTO } from '@dailyuse/contracts/goal';

/**
 * Complete Goal Service
 */
export class CompleteGoal {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(id: string): Promise<{ goal: GoalServerDTO }> {
    const goal = await this.goalRepository.findById(id);
    if (!goal) {
      throw new Error(`Goal not found: ${id}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.markAsCompleted();
    await this.goalRepository.save(goal);
    // TODO: 实现领域事件发布

    return {
      goal: goal.toServerDTO(true),
    };
  }
}
