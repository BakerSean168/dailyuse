/**
 * Get Goal Use Case
 *
 * 获取单个目标详情的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import type { GetGoalRes } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Get Goal Use Case
 */
export class GetGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(id: string, includeChildren?: boolean): Promise<Result<GetGoalRes>> {
    const goal = await this.goalRepository.findById(id, {
      includeChildren,
    });

    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    return ok(goal.toClientDTO(true));
  }
}
