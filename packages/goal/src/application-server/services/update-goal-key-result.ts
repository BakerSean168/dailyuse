/**
 * Update Goal Key Result Use Case
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

export class UpdateGoalKeyResult {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

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

    this.goalPolicy.ensureGoalCanBeModified(goal);
    const keyResult = goal.keyResults.find((kr) => kr.id === keyResultUuid);
    if (!keyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultUuid}`);
    }

    goal.updateKeyResult(keyResultUuid, {
      title: updates.title,
      description: updates.description,
      weight: updates.weight,
      targetValue: updates.targetValue,
      unit: updates.unit,
    });

    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO(true));
  }
}
