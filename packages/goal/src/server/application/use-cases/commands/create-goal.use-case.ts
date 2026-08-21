/**
 * Create Goal Use Case
 *
 * 创建新目标的应用服务
 * 遵循 governance 模块 Result<T> 规范
 */

import type { IGoalRepository } from '../../../domain';
import { Goal, GoalId, GoalPolicy, GoalReminderConfig, KeyResultId } from '../../../domain';
import { IdentityId } from '@memoflow/domain-shared';
import type { CreateGoalReq, GoalMutationReceipt } from '@memoflow/contracts/goal';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { createGoalMutationReceipt } from './goal-mutation-receipt';
import { createLogger } from '@memoflow/utils/logger';
/**
 * Create Goal Use Case
 */
export class CreateGoalUseCase {
  private readonly logger = createLogger('CreateGoalUseCase');

  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalPolicy: GoalPolicy,
  ) {}

  async execute(input: CreateGoalReq, cx: ExecutionContext): Promise<Result<GoalMutationReceipt>> {
    // 1. 验证输入
    if (!input.name?.trim()) {
      return error('VALIDATION_ERROR', 'Name is required');
    }
    if (!cx.identityId?.trim()) {
      return error('UNAUTHORIZED', 'Identity ID is required');
    }

    // 2. Caller-supplied IDs are the durable idempotency seam used by Mastra
    // workflows and local-first clients. Replaying the same create after a
    // disconnect/restart returns the existing aggregate instead of creating a
    // second business fact.
    if (input.id) {
      const existing = await this.goalRepository.findByIdForIdentity(cx.identityId, input.id, {
        includeChildren: true,
      });
      if (existing) {
        return ok(
          createGoalMutationReceipt(existing, {
            keyResultIds: existing.keyResults.map((keyResult) => keyResult.id),
          }),
        );
      }
    }

    try {
      // 3. 如果有父目标，先查询
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

      // 4. 领域策略校验
      this.goalPolicy.ensureParentGoalValid(parentGoal ?? null);

      // 5. 创建目标聚合根（直接使用工厂方法）
      const goal = Goal.create(
        {
          id: input.id ? GoalId.of(input.id) : undefined,
          identityId: IdentityId.of(cx.identityId),
          name: input.name,
          description: input.description ?? null,
          color: input.color ?? '#3B82F6',
          feasibilityAnalysis: input.feasibilityAnalysis ?? null,
          motivation: input.motivation ?? null,
          importance: (input.importance ?? 'medium') as ImportanceLevel,
          category: input.category ?? null,
          tags: input.tags ?? [],
          startDate: input.startDate ?? null,
          targetDate: input.targetDate ?? null,
          folderId: input.folderId ?? null,
          parentGoalId: input.parentGoalId ?? null,
          reminderConfig: input.reminderConfig
            ? GoalReminderConfig.fromDTO(input.reminderConfig)
            : null,
        },
        parentGoal,
      );

      for (const keyResult of input.initialKeyResults ?? []) {
        goal.createAndAddKeyResult({
          ...keyResult,
          id: keyResult.id ? KeyResultId.of(keyResult.id) : undefined,
          aggregationMethod: keyResult.calculationMethod,
        });
      }

      // 6. 持久化
      await this.goalRepository.save(goal);

      // 7. 返回 Result
      return ok(
        createGoalMutationReceipt(goal, {
          keyResultIds: goal.keyResults.map((keyResult) => keyResult.id),
        }),
      );
    } catch (caughtError) {
      // The concurrent-create window is closed outside the failed transaction:
      // two applies can both pass the pre-check (step 2) before either saves.
      // The slower worker's save then hits the aggregate's unique constraint and
      // would otherwise throw an exception that escapes the Result contract and
      // breaks the durable workflow into `failed`. If the caller supplied a
      // deterministic id and another attempt committed the same aggregate first,
      // surface that durable fact as an idempotent replay.
      if (input.id) {
        try {
          const existing = await this.goalRepository.findByIdForIdentity(
            cx.identityId,
            input.id,
            { includeChildren: true },
          );
          if (existing) {
            return ok(
              createGoalMutationReceipt(existing, {
                keyResultIds: existing.keyResults.map((keyResult) => keyResult.id),
              }),
            );
          }
        } catch (replayError) {
          // Preserve the original create error if the replay lookup itself is unavailable.
          this.logger.error('Failed to replay goal during create', { error: replayError });
        }
      }

      this.logger.error('Failed to create goal', { error: caughtError });
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
      return error('INTERNAL_ERROR', message);
    }
  }
}
