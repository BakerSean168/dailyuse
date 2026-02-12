/**
 * Create Goal Use Case
 *
 * 创建新目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '@/domain-server';
import { Goal } from '@/domain-server';
import { IdentityId } from '@dailyuse/domain-shared';
import type { CreateGoalReq, CreateGoalRes } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { GoalEventPublisher } from './goal-event-publisher';
import type { ExecutionContext } from '../types';

/**
 * Create Goal Use Case
 */
export class CreateGoal {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(input: CreateGoalReq, context: ExecutionContext): Promise<Result<CreateGoalRes>> {
    // 1. 验证输入
    if (!input.title?.trim()) {
      return error('VALIDATION_ERROR', 'Title is required');
    }
    if (!context.identityId?.trim()) {
      return error('UNAUTHORIZED', 'Identity ID is required');
    }

    // 2. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (input.parentGoalUuid) {
      const found = await this.goalRepository.findById(input.parentGoalUuid);
      if (!found) {
        return error('NOT_FOUND', `Parent goal not found: ${input.parentGoalUuid}`);
      }
      parentGoal = found;
    }

    // 3. 创建目标聚合根（直接使用工厂方法）
    const goal = Goal.create(
      {
        identityId: IdentityId.of(context.identityId),
        name: input.title,
        description: input.description ?? null,
        color: input.color ?? '#3B82F6',
        feasibilityAnalysis: input.feasibilityAnalysis ?? null,
        motivation: input.motivation ?? null,
        importance: (input.importance ?? 'medium') as ImportanceLevel,
        category: input.category ?? null,
        tags: input.tags ?? [],
        startDate: input.startDate ? new Date(input.startDate) : null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        folderId: input.folderUuid ? (input.folderUuid as any) : null,
        parentGoalId: input.parentGoalUuid ? (input.parentGoalUuid as any) : null,
        reminderConfig: null,
      },
      parentGoal,
    );

    // 4. 持久化
    await this.goalRepository.save(goal);

    // 5. 发布领域事件
    await GoalEventPublisher.publishGoalEvents(goal);

    // 6. 返回 Result
    return ok(goal.toClientDTO(true));
  }
}
