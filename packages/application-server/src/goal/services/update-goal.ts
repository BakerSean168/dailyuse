/**
 * Update Goal Service
 *
 * 更新目标基本信息的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalDomainService, Goal } from '@dailyuse/domain-server/goal';
import type { UpdateGoalRequest, GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * Update Goal Service
 */
export class UpdateGoal {
  private static instance: UpdateGoal;
  private readonly domainService: GoalDomainService;

  private constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository?: IGoalRepository): UpdateGoal {
    const container = GoalContainer.getInstance();
    const repo = goalRepository || container.getGoalRepository();
    UpdateGoal.instance = new UpdateGoal(repo);
    return UpdateGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateGoal {
    if (!UpdateGoal.instance) {
      UpdateGoal.instance = UpdateGoal.createInstance();
    }
    return UpdateGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateGoal.instance = undefined as unknown as UpdateGoal;
  }

  async execute(uuid: string, input: UpdateGoalRequest): Promise<GoalResponse> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      throw new Error(`Goal not found: ${uuid}`);
    }

    // 2. 委托领域服务更新
    this.domainService.updateGoalBasicInfo(goal, input);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await this.publishEvents(goal);

    // 5. 返回结果
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
 * 便捷函数：更新目标
 */
export const updateGoal = (uuid: string, input: UpdateGoalRequest): Promise<GoalResponse> =>
  UpdateGoal.getInstance().execute(uuid, input);
