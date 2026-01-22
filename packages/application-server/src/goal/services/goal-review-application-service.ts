import type { IGoalRepository } from '@dailyuse/domain-server/goal';

import { GoalDomainService } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalClientDTO, KeyResultServerDTO } from '@dailyuse/contracts/goal';
import { GoalEventPublisher } from './GoalEventPublisher';

/**
 * GoalReview 应用服务
 * 负责目标回顾的管理
 *
 * 职责：
 * - 添加目标回顾
 * - 查询目标回顾历史
 * - 更新回顾内容
 * - 删除回顾
 */
export class GoalReviewApplicationService {
  private domainService: GoalDomainService;
  private goalRepository: IGoalRepository;

  constructor(goalRepository: IGoalRepository) {
    this.domainService = new GoalDomainService();
    this.goalRepository = goalRepository;
  }

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
  ): Promise<GoalClientDTO> {
    // 1. 查询目标（包含子实体）
    const goal = await this.goalRepository.findById(goalUuid, { includeChildren: true });
    if (!goal) {
      throw new Error(`Goal not found: ${goalUuid}`);
    }

    // 2. 委托领域服务添加回顾
    this.domainService.addReviewToGoal(goal, params);

    // 3. 持久化
    await this.goalRepository.save(goal);

    // 4. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 5. 返回 ClientDTO
    return goal.toClientDTO();
  }
}
