/**
 * List Goals Use Case
 *
 * 获取用户目标列表的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import type { QueryGoalsReq, QueryGoalsRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * List Goals Use Case
 */
export class ListGoals {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(input: QueryGoalsReq): Promise<Result<QueryGoalsRes>> {
    console.log('[ListGoals] execute input', {
      identityId: input.identityId,
      includeKeyResults: input.includeKeyResults,
      page: input.page,
      pageSize: input.pageSize,
      status: input.status,
      folderId: input.folderId,
    });

    const goals = await this.goalRepository.findByIdentityId(input.identityId, {
      includeChildren: input.includeKeyResults,
      status: input.status?.[0],
      folderId: input.folderId,
    });

    const dtoPreview = goals.slice(0, 5).map((g: Goal) => {
      const dto = g.toClientDTO(Boolean(input.includeKeyResults));
      return {
        id: dto.id,
        keyResultsLen: dto.keyResults?.length ?? 0,
        totalKeyResults: dto.totalKeyResults,
        completedKeyResults: dto.completedKeyResults,
      };
    });
    console.log('[ListGoals] dto preview', dtoPreview);

    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? goals.length;
    const total = goals.length;

    return ok({
      data: goals.map((g: Goal) => g.toClientDTO(Boolean(input.includeKeyResults))),
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
        totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
      },
    });
  }
}
