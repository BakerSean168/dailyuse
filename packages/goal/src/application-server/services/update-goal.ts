/**
 * Update Goal Service
 *
 * 更新目标基本信息的应用服务
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalDomainService, Goal } from '@/domain-server';
import type { UpdateGoalRequest, GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';

/**
 * Update Goal Service
 */
export class UpdateGoal {
  private readonly domainService: GoalDomainService;

  constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
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
