/**
 * Update Goal Use Case
 *
 * 更新目标基本信息的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { UpdateGoalReq, UpdateGoalRes } from '@memoflow/contracts/goal';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { GoalFolderId } from '../../../domain';

/**
 * Update Goal Use Case
 */
export class UpdateGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(
    id: string,
    identityId: string,
    input: UpdateGoalReq,
  ): Promise<Result<UpdateGoalRes>> {
    // 1. 查询目标（身份隔离）
    const goal = await this.goalRepository.findByIdForIdentity(identityId, id, {
      includeChildren: true,
    });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${id}`);
    }

    // 2. 领域策略校验
    this.goalPolicy.ensureGoalCanBeModified(goal);

    // 3. 使用聚合根方法更新基本信息
    goal.updateBasicInfo({
      name: input.name,
      description: input.description,
      importance: input.importance as ImportanceLevel | undefined,
      category: input.category,
      color: input.color ?? undefined,
      feasibilityAnalysis: input.feasibilityAnalysis,
      motivation: input.motivation,
    });

    // 4. 更新标签
    if (input.tags !== undefined) {
      goal.updateTags(input.tags ?? []);
    }

    // 5. 更新时间范围
    if (input.startDate !== undefined || input.targetDate !== undefined) {
      goal.updateTimeRange({
        startDate: input.startDate !== undefined ? (input.startDate ?? null) : undefined,
        targetDate: input.targetDate !== undefined ? (input.targetDate ?? null) : undefined,
      });
    }

    // 6. 更新文件夹
    if (input.folderId !== undefined) {
      goal.moveToFolder(input.folderId ? (input.folderId as unknown as GoalFolderId) : null);
    }

    // 7. 更新提醒配置
    if (input.reminderConfig !== undefined) {
      goal.updateReminderConfig(input.reminderConfig ?? null);
    }

    // 8. 持久化
    await this.goalRepository.save(goal);

    // 9. 返回 Result
    return ok(goal.toClientDTO(true));
  }
}
