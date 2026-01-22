/**
 * Get Goal Service
 *
 * 获取单个目标详情的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import type { GoalResponse } from '@dailyuse/contracts/goal';

/**
 * Get Goal Service
 */
export class GetGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(uuid: string, includeChildren?: boolean): Promise<GoalResponse | null> {
    const goal = await this.goalRepository.findById(uuid, {
      includeChildren,
    });

    if (!goal) {
      return null;
    }

    return {
      goal: goal.toClientDTO(true),
    };
  }
}
