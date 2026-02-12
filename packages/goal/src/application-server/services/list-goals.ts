/**
 * List Goals Use Case
 *
 * 获取用户目标列表的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { QueryGoalsReq } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { GoalsResponse } from '../types';

/**
 * List Goals Use Case
 */
export class ListGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(input: QueryGoalsReq): Promise<Result<GoalsResponse>> {
    const goals = await this.goalRepository.findByAccountUuid(input.accountUuid, {
      includeChildren: input.includeKeyResults,
      status: input.status?.[0],
      folderUuid: input.folderUuid,
    });

    return ok({
      goals: goals.map((g: Goal) => g.toClientDTO(true)),
      total: goals.length,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? goals.length,
    });
  }
}
