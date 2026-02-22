/**
 * Permanently Delete Goal Use Case
 *
 * 永久删除目标的应用服务。
 * 只有已归档的目标才能被永久删除。
 * 永久删除是不可逆操作，会级联删除所有子实体。
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * PermanentlyDeleteGoal Use Case
 *
 * 前置条件：
 * - 目标必须已归档（archivedAt !== null）
 *
 * 执行结果：
 * - 物理删除目标及其所有子实体（KeyResult, GoalReview, WeightSnapshot）
 */
export class PermanentlyDeleteGoal {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  /**
   * 永久删除已归档的目标
   *
   * @param id - 目标 ID
   * @returns 成功返回被删除的目标 ID
   */
  async execute(id: string): Promise<Result<{ id: string }>> {
    const goal = await this.goalRepository.findById(id, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    // 业务规则：只有已归档的目标才能被永久删除
    this.goalPolicy.ensureGoalCanBePermanentlyDeleted(goal);

    // 执行物理删除（级联删除所有子实体）
    await this.goalRepository.delete(id);

    return ok({ id });
  }
}
