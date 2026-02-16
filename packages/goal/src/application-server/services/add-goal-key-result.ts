/**
 * Add Goal Key Result Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

export class AddGoalKeyResult {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    goalId: string,
    keyResult: {
      title: string;
      valueType: string;
      aggregationMethod?: string;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      weight: number;
    },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    this.goalPolicy.ensureGoalCanBeModified(goal);
    goal.createAndAddKeyResult(keyResult);
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }
}
