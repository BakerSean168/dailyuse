/**
 * Search Goals Service
 *
 * 搜索目标的应用服务
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { GoalsResponse } from '@dailyuse/contracts/goal';

/**
 * Search Goals Service
 */
export class SearchGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 获取服务单例
   */

  async execute(accountUuid: string, query: string): Promise<GoalsResponse> {
    const allGoals = await this.goalRepository.findByAccountUuid(accountUuid, {});

    const filteredGoals = allGoals.filter(
      (g) =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.description?.toLowerCase().includes(query.toLowerCase()),
    );

    return {
      goals: filteredGoals.map((g: Goal) => g.toClientDTO()),
      total: filteredGoals.length,
      page: 1,
      pageSize: filteredGoals.length,
    };
  }
}
