/**
 * Complete Goal Service
 *
 * 完成目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';

/**
 * Complete Goal Service
 */
export class CompleteGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

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
