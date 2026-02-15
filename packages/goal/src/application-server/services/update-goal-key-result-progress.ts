/**
 * Update Goal Key Result Progress Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

export class UpdateGoalKeyResultProgress {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(
    goalUuid: string,
    keyResultUuid: string,
    currentValue: number,
    note?: string,
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    goal.updateKeyResultProgress(keyResultUuid, currentValue, note);
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }
}
