/**
 * Complete Goal Service
 *
 * 完成目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO } from '@dailyuse/contracts/goal';

/**
 * Complete Goal Service
 */
export class CompleteGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(uuid: string): Promise<{ goal: GoalServerDTO }> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.markAsCompleted();
    await this.goalRepository.save(goal);
    // TODO: 实现领域事件发布

    return {
      goal: goal.toServerDTO(true),
    };
  }
}
