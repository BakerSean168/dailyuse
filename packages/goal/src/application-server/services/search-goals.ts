/**
 * Search Goals Use Case
 *
 * 搜索目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { GoalsResponse } from '../types';

/**
 * Search Goals Use Case
 */
export class SearchGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(accountUuid: string, query: string): Promise<Result<GoalsResponse>> {
    const allGoals = await this.goalRepository.findByIdentityId(accountUuid, {});

    const filteredGoals = allGoals.filter(
      (g) =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.description?.toLowerCase().includes(query.toLowerCase()),
    );

    return ok({
      goals: filteredGoals.map((g: Goal) => g.toClientDTO()),
      total: filteredGoals.length,
      page: 1,
      pageSize: filteredGoals.length,
    });
  }
}
