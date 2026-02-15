/**
 * @deprecated Extract operations to individual use-case files following DDD patterns.
 * Each business operation should have its own use-case service.
 */

import type { IGoalRepository } from '@/domain-server';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';

/**
 * GoalReview 应用服务
 * 负责目标回顾的管理
 * 遵循 governance 模块 Result<T> 规范
 *
 * 职责：
 * - 添加目标回顾
 * - 查询目标回顾历史
 * - 更新回顾内容
 * - 删除回顾
 */
export class GoalReviewApplicationService {
  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 添加目标回顾
   */
  async addReview(
    goalUuid: string,
    params: {
      title: string;
      content: string;
      reviewType: string;
      rating?: number;
      achievements?: string;
      challenges?: string;
      nextActions?: string;
    },
  ): Promise<Result<GoalClientDTO>> {
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalUuid}`);
    }

    goal.createAndAddReview(params);
    await this.goalRepository.save(goal);
    await GoalEventPublisher.publishGoalEvents(goal);

    return ok(goal.toClientDTO());
  }
}
