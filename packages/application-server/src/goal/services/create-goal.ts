/**
 * Create Goal Service
 *
 * 创建新目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { GoalDomainService, Goal } from '@dailyuse/domain-server/goal';
import type { CreateGoalRequest, GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';

/**
 * Create Goal Service
 */
export class CreateGoal {
  private readonly domainService: GoalDomainService;

  constructor(private readonly goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
  }

  async execute(accountUuid: string, input: CreateGoalRequest): Promise<GoalResponse> {
    // 1. 验证输入
    this.validateInput(accountUuid, input);

    // 2. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (input.parentGoalUuid) {
      const found = await this.goalRepository.findById(input.parentGoalUuid);
      if (!found) {
        throw new Error(`Parent goal not found: ${input.parentGoalUuid}`);
      }
      parentGoal = found;
    }

    // 3. 委托领域服务创建聚合根
    const goal = this.domainService.createGoal({ accountUuid, ...input }, parentGoal);

    // 4. 如果有 keyResults，添加到目标中
    // if (input.keyResults && input.keyResults.length > 0) {
    //   for (const krParams of input.keyResults) {
    //     this.domainService.addKeyResultToGoal(goal, {
    //       title: krParams.title,
    //       description: krParams.description,
    //       valueType: krParams.valueType || 'INCREMENTAL',
    //       targetValue: krParams.targetValue ?? 100,
    //       unit: krParams.unit,
    //       weight: krParams.weight ?? 5,
    //     });
    //   }
    // }

    // 5. 持久化
    await this.goalRepository.save(goal);

    // 6. 发布领域事件
    await this.publishEvents(goal);

    // 7. 返回结果
    return {
      goal: goal.toClientDTO(true),
    };
  }

  private validateInput(accountUuid: string, input: CreateGoalRequest): void {
    if (!input.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!accountUuid?.trim()) {
      throw new Error('Account UUID is required');
    }
  }

  private async publishEvents(goal: Goal): Promise<void> {
    const events = goal.getUncommittedDomainEvents();
    for (const event of events) {
      await eventBus.emit(event.eventType, event);
    }
  }
}
