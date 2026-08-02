/**
 * Update Goal Use Case
 *
 * 更新目标基本信息的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import { Goal, GoalVersionConflictError, type IGoalRepository } from '../../../domain';
import { GoalPolicy } from '../../../domain';
import type { UpdateGoalReq, UpdateGoalRes } from '@memoflow/contracts/goal';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { GoalFolderId, GoalId } from '../../../domain';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

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
    if (input.expectedVersion !== goal.version) {
      return error('CONFLICT', 'Goal has been modified by another client');
    }

    const existingKeyResultIds = new Set(
      goal.getAllKeyResults().map((keyResult) => String(keyResult.id)),
    );
    const desiredKeyResultIds = new Set<string>();
    if (input.keyResults !== undefined) {
      for (const keyResult of input.keyResults) {
        if (!keyResult.id) continue;
        const id = String(keyResult.id);
        if (!existingKeyResultIds.has(id)) {
          return error('VALIDATION_ERROR', `Key result does not belong to goal: ${id}`);
        }
        if (desiredKeyResultIds.has(id)) {
          return error('VALIDATION_ERROR', `Duplicate key result: ${id}`);
        }
        desiredKeyResultIds.add(id);
      }
    }

    let parentGoalId: GoalId | null | undefined;
    if (input.parentGoalId !== undefined) {
      parentGoalId = input.parentGoalId ? (input.parentGoalId as unknown as GoalId) : null;
      if (parentGoalId === goal.id) {
        return error('VALIDATION_ERROR', 'A goal cannot be its own parent');
      }
      if (parentGoalId) {
        const parent = await this.goalRepository.findByIdForIdentity(
          identityId,
          String(parentGoalId),
        );
        if (!parent) return error('NOT_FOUND', `Parent goal not found: ${parentGoalId}`);
        if (
          await this.goalRepository.isAncestor(identityId, String(goal.id), String(parentGoalId))
        ) {
          return error('VALIDATION_ERROR', 'A descendant goal cannot become its parent');
        }
        Goal.validateParentGoal(parent);
      }
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
    if (parentGoalId !== undefined) goal.moveToParent(parentGoalId);

    // 7. 更新提醒配置
    if (input.reminderConfig !== undefined) {
      goal.updateReminderConfig(input.reminderConfig ?? null);
    }

    // 8. Reconcile child entities in memory and persist the aggregate once. This makes
    // root and KR edits one optimistic-lock transaction instead of a sequence of writes.
    if (input.keyResults !== undefined) {
      for (const keyResult of input.keyResults) {
        if (keyResult.id) {
          const id = String(keyResult.id);
          goal.updateKeyResult(id, {
            title: keyResult.title,
            description: keyResult.description,
            valueType: keyResult.valueType,
            aggregationMethod: keyResult.calculationMethod,
            startValue: keyResult.startValue ?? 0,
            currentValue: keyResult.currentValue ?? 0,
            targetValue: keyResult.targetValue,
            unit: keyResult.unit ?? null,
            weight: keyResult.weight,
          });
          continue;
        }

        goal.createAndAddKeyResult({
          title: keyResult.title,
          description: keyResult.description,
          valueType: keyResult.valueType,
          aggregationMethod: keyResult.calculationMethod,
          startValue: keyResult.startValue,
          currentValue: keyResult.currentValue,
          targetValue: keyResult.targetValue,
          unit: keyResult.unit,
          weight: keyResult.weight,
        });
      }

      for (const existingId of existingKeyResultIds) {
        if (!desiredKeyResultIds.has(existingId)) goal.removeKeyResult(existingId);
      }

      goal.reorderKeyResults(goal.getAllKeyResults().map((keyResult) => String(keyResult.id)));
    }

    // 9. 持久化
    goal.advanceVersion();
    try {
      await this.goalRepository.saveRootWithExpectedVersion(goal, input.expectedVersion);
    } catch (cause) {
      if (cause instanceof GoalVersionConflictError) {
        return error('CONFLICT', cause.message);
      }
      throw cause;
    }

    // 10. 返回 Result
    return ok(createGoalMutationReceipt(goal));
  }
}
