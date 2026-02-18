/**
 * Search Goals Use Case
 *
 * 搜索目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { QueryGoalsRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Search Goals Use Case
 */
export class SearchGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(identityId: string, query: string): Promise<Result<QueryGoalsRes>> {
    const allGoals = await this.goalRepository.findByIdentityId(identityId, {});

    const filteredGoals = allGoals.filter(
      (g) =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.description?.toLowerCase().includes(query.toLowerCase()),
    );

    const total = filteredGoals.length;

    return ok({
      data: filteredGoals.map((g: Goal) => g.toClientDTO()),
      pagination: {
        page: 1,
        pageSize: total,
        total,
        hasMore: false,
        totalPages: total > 0 ? 1 : 0,
      },
    });
  }
}
