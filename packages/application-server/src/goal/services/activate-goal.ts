/**
 * Activate Goal Service
 *
 * 激活目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';


/**
 * Activate Goal Service
 */
export class ActivateGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}


  /**
   * 获取服务单例
   */
  static getInstance(): ActivateGoal {
    if (!ActivateGoal.instance) {
      ActivateGoal.instance = ActivateGoal.createInstance();
    }
    return ActivateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateGoal.instance = undefined as unknown as ActivateGoal;
  }

  async execute(uuid: string): Promise<GoalResponse> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.activate();
    await this.goalRepository.save(goal);
    await this.publishEvents(goal);

    return {
      goal: goal.toClientDTO(),
    };
  }

  private async publishEvents(goal: Goal): Promise<void> {
    const events = goal.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }
}

/**
 * 便捷函数：激活目标
 */
export const activateGoal = (uuid: string): Promise<GoalResponse> =>
  ActivateGoal.getInstance().execute(uuid);
