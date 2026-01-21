/**
 * List Goals Service
 *
 * 获取用户目标列表的应用服务
 */

import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { QueryGoalsRequest, GoalsResponse } from '@dailyuse/contracts/goal';

/**
 * List Goals Service
 */
export class ListGoals {
  private static instance: ListGoals;

  private constructor(private readonly goalRepository: IGoalRepository) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(goalRepository: IGoalRepository): ListGoals {
    ListGoals.instance = new ListGoals(goalRepository);
    return ListGoals.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ListGoals {
    if (!ListGoals.instance) {
      throw new Error('ListGoals instance not initialized. Call createInstance(repository) first.');
    }
    return ListGoals.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ListGoals.instance = undefined as unknown as ListGoals;
  }

  async execute(input: QueryGoalsRequest): Promise<GoalsResponse> {
    const goals = await this.goalRepository.findByAccountUuid(input.accountUuid, {
      includeChildren: input.includeKeyResults,
      status: input.status?.[0],
      folderUuid: input.folderUuid,
    });

    return {
      goals: goals.map((g: Goal) => g.toClientDTO(true)),
      total: goals.length,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? goals.length,
    };
  }
}

/**
 * 便捷函数：列出目标
 */
export const listGoals = (input: QueryGoalsRequest): Promise<GoalsResponse> =>
  ListGoals.getInstance().execute(input);
