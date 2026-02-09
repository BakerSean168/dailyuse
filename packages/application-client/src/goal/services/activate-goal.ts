/**
 * Activate Goal
 *
 * 激活目标用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import { Goal } from '@dailyuse/domain-client/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Activate Goal
 */
export class ActivateGoal {
  private static instance: ActivateGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 执行用例
   */
  async execute(id: string): Promise<Goal> {
    const data = await this.apiClient.activateGoal(id);
    return Goal.fromClientDTO(data);
  }
}
