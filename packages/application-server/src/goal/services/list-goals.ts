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
  constructor(private readonly goalRepository: IGoalRepository) {}

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
