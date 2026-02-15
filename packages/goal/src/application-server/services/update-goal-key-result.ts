/**
 * Update Goal Key Result Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

export class UpdateGoalKeyResult {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(
    goalUuid: string,
    keyResultUuid: string,
    updates: {
      title?: string;
      description?: string;
      weight?: number;
      targetValue?: number;
      unit?: string;
    },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    const keyResult = goal.keyResults.find((kr) => kr.id === keyResultUuid);
    if (!keyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultUuid}`);
    }

    if (updates.title !== undefined) {
      keyResult.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description);
    }
    if (updates.weight !== undefined) {
      keyResult.updateWeight(updates.weight);
    }
    if (updates.targetValue !== undefined) {
      keyResult.updateTargetValue(updates.targetValue);
    }
    if (updates.unit !== undefined) {
      keyResult.updateUnit(updates.unit);
    }

    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }
}
