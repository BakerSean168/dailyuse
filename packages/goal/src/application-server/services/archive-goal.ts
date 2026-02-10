/**
 * Archive Goal Service
 *
 * 归档目标的应用服务
 */

import type { IGoalRepository } from '@/domain-server';
import type { Goal } from '@/domain-server';
import type { GoalResponse } from '@dailyuse/contracts/goal';
import { eventBus } from '@dailyuse/utils';

/**
 * Archive Goal Service
 */
export class ArchiveGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

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
