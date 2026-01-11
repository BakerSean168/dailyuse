/**
 * Complete Goal Service
 *
 * 完成目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Complete Goal Service
 */
export class CompleteGoal {
  private static instance: CompleteGoal;

  private constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository?: IGoalRepository): CompleteGoal {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    CompleteGoal.instance = new CompleteGoal(repo);
    return CompleteGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CompleteGoal {
    if (!CompleteGoal.instance) {
      CompleteGoal.instance = CompleteGoal.createInstance();
    }
    return CompleteGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CompleteGoal.instance = undefined as unknown as CompleteGoal;
  }

  async execute(uuid: string): Promise<GoalResponse> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.complete();
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
 * 便捷函数：完成目标
 */
export const completeGoal = (uuid: string): Promise<GoalResponse> =>
  CompleteGoal.getInstance().execute(uuid);
