/**
 * Search Goals Service
 *
 * 搜索目标的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalsResponse } from '@dailyuse/contracts/goal';


/**
 * Search Goals Service
 */
export class SearchGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}


  /**
   * 获取服务单例
   */
  static getInstance(): SearchGoals {
    if (!SearchGoals.instance) {
      SearchGoals.instance = SearchGoals.createInstance();
    }
    return SearchGoals.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SearchGoals.instance = undefined as unknown as SearchGoals;
  }

  async execute(accountUuid: string, query: string): Promise<GoalsResponse> {
    const allGoals = await this.goalRepository.findByAccountUuid(accountUuid, {});

    const filteredGoals = allGoals.filter(
      (g) =>
        g.title.toLowerCase().includes(query.toLowerCase()) ||
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

/**
 * 便捷函数：搜索目标
 */
export const searchGoals = (accountUuid: string, query: string): Promise<GoalsResponse> =>
  SearchGoals.getInstance().execute(accountUuid, query);
