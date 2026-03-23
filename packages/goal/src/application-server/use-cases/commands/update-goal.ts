/**
 * Update Goal Use Case
 *
 * 更新目标基本信息的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { GoalPolicy } from '@/domain-server';
import type { UpdateGoalReq, UpdateGoalRes } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Update Goal Use Case
 */
export class UpdateGoal {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(id: string, input: UpdateGoalReq): Promise<Result<UpdateGoalRes>> {
    // 1. 查询目标
    const goal = await this.goalRepository.findById(id, { includeChildren: true });
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
        startDate: input.startDate !== undefined
          ? (input.startDate ? new Date(input.startDate) : null)
          : undefined,
        targetDate: input.targetDate !== undefined
          ? (input.targetDate ? new Date(input.targetDate) : null)
          : undefined,
      });
    }

    // 6. 更新文件夹
    if (input.folderId !== undefined) {
      goal.moveToFolder(input.folderId ? (input.folderId as any) : null);
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
