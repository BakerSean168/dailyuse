/**
 * Activate Goal Use Case
 *
 * 激活目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * Activate Goal Use Case
 */
export class ActivateGoal {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(uuid: string): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(uuid);
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${uuid}`);
    }

    this.goalPolicy.ensureGoalCanBeActivated(goal);
    goal.activate();
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO());
  }
}
