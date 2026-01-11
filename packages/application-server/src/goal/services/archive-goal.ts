/**
 * Archive Goal Service
 *
 * 归档目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Archive Goal Service
 */
export class ArchiveGoal {
  private static instance: ArchiveGoal;

  private constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository?: IGoalRepository): ArchiveGoal {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    ArchiveGoal.instance = new ArchiveGoal(repo);
    return ArchiveGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ArchiveGoal {
    if (!ArchiveGoal.instance) {
      ArchiveGoal.instance = ArchiveGoal.createInstance();
    }
    return ArchiveGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ArchiveGoal.instance = undefined as unknown as ArchiveGoal;
  }

  async execute(uuid: string): Promise<GoalResponse> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    goal.archive();
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
 * 便捷函数：归档目标
 */
export const archiveGoal = (uuid: string): Promise<GoalResponse> =>
  ArchiveGoal.getInstance().execute(uuid);
