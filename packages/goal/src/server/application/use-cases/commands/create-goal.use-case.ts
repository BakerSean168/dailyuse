/**
 * Create Goal Use Case
 *
 * 创建新目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '../../../domain';
import { Goal, GoalPolicy, GoalReminderConfig } from '../../../domain';
import { IdentityId } from '@dailyuse/domain-shared';
import type { CreateGoalReq, CreateGoalRes } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { GoalId, GoalFolderId } from '../../../domain';
/**
 * Create Goal Use Case
 */
export class CreateGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(input: CreateGoalReq, cx: ExecutionContext): Promise<Result<CreateGoalRes>> {
    // 1. 验证输入
    if (!input.name?.trim()) {
      return error('VALIDATION_ERROR', 'Name is required');
    }
    if (!cx.identityId?.trim()) {
      return error('UNAUTHORIZED', 'Identity ID is required');
    }

    // 2. 如果有父目标，先查询
    let parentGoal: Goal | undefined;
    if (input.parentGoalId) {
      const found = await this.goalRepository.findByIdForIdentity(
        cx.identityId,
        input.parentGoalId,
      );
      if (!found) {
        return error('NOT_FOUND', `Parent goal not found: ${input.parentGoalId}`);
      }
      parentGoal = found;
    }

    // 3. 领域策略校验
    this.goalPolicy.ensureParentGoalValid(parentGoal ?? null);

    // 4. 创建目标聚合根（直接使用工厂方法）
    const goal = Goal.create(
      {
        identityId: IdentityId.of(cx.identityId),
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? '#3B82F6',
        feasibilityAnalysis: input.feasibilityAnalysis ?? null,
        motivation: input.motivation ?? null,
        importance: (input.importance ?? 'medium') as ImportanceLevel,
        category: input.category ?? null,
        tags: input.tags ?? [],
        startDate: input.startDate ? new Date(input.startDate) : null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        folderId: input.folderId ? (input.folderId as unknown as GoalFolderId) : null,
        parentGoalId: input.parentGoalId ? (input.parentGoalId as unknown as GoalId) : null,
        reminderConfig: input.reminderConfig ? GoalReminderConfig.fromDTO(input.reminderConfig) : null,
      },
      parentGoal,
    );

    // 5. 持久化
    await this.goalRepository.save(goal);

    // 6. 返回 Result
    return ok(goal.toClientDTO(true));
  }
}
