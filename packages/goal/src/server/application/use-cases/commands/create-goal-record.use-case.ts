/**
 * Create Goal Record Use Case
 *
 * 创建目标进度记录（GoalRecord）
 * - 验证 Goal 和 KeyResult 存在
 * - 创建 GoalRecord 实体
 * - 通过 IGoalRecordRepository 持久化
 */

import type { IGoalRepository, IGoalRecordRepository } from '../../../domain';
import { GoalVersionConflictError } from '../../../domain';
import { GoalRecord } from '../../../domain';
import { KeyResultProgress } from '../../../domain';
import type { GoalMutationReceipt, GoalRecordSource } from '@memoflow/contracts/goal';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { IdentityId, KeyResultId } from '@memoflow/contracts/primitives';
import {
  createInlineGoalWriteTransactionRunner,
  type GoalWriteTransactionRunner,
} from './goal-write-support';
import { createGoalMutationReceipt } from './goal-mutation-receipt';

export class CreateGoalRecordUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalRecordRepository: IGoalRecordRepository,
    private readonly transactionRunner: GoalWriteTransactionRunner = createInlineGoalWriteTransactionRunner(
      { goalRepository, goalRecordRepository },
    ),
  ) {}

  async execute(
    goalId: string,
    keyResultId: string,
    params: {
      value: number;
      note?: string;
    } & (
      | { expectedVersion: number; source?: never }
      | { source: GoalRecordSource; expectedVersion?: never }
    ),
    identityId: string,
  ): Promise<Result<GoalMutationReceipt>> {
    try {
      return await this.transactionRunner.run(async ({ goalRepository, goalRecordRepository }) => {
        // 1. 验证 Goal 存在且属于当前 identity
        const goal = await goalRepository.findByIdForIdentity(identityId, goalId, {
          includeChildren: true,
        });
        if (!goal) {
          return error('NOT_FOUND', `Goal not found: ${goalId}`);
        }
        const expectedVersion = params.expectedVersion ?? goal.version;
        if (expectedVersion !== goal.version) {
          return error('CONFLICT', 'Goal has been modified by another client');
        }

        // 2. 验证 KeyResult 属于该 Goal
        const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
        if (!keyResult) {
          return error('NOT_FOUND', `KeyResult not found: ${keyResultId} in goal ${goalId}`);
        }

        if (params.source) {
          const existing = await goalRecordRepository.findBySource(
            identityId,
            params.source.type,
            params.source.id,
          );
          if (existing) {
            if (String(existing.keyResultId) !== keyResultId || existing.value !== params.value) {
              return error(
                'VALIDATION_ERROR',
                'Goal contribution source is already bound to another value',
              );
            }
            const existingDTO = existing.toClientDTO(goalId, keyResult.progress.currentValue);
            return ok(
              createGoalMutationReceipt(
                goal,
                {
                  keyResultIds: [keyResult.id],
                  recordIds: [existing.id],
                },
                { upserted: [existingDTO], removedIds: [] },
              ),
            );
          }
        }

        const historyBefore = await goalRecordRepository.findByKeyResultId(
          identityId,
          keyResultId,
          {
            orderBy: 'asc',
          },
        );

        // 3. 创建 GoalRecord 实体
        const record = GoalRecord.create({
          keyResultId: keyResultId as KeyResultId,
          identityId: identityId as IdentityId,
          value: params.value,
          note: params.note,
          source: params.source,
        });

        // 4. 持久化
        await goalRecordRepository.save(record);

        // 5. 追加 record 时，基于当前值和既有历史保持隐式基线一致。
        // 这可以避免「手工 currentValue 已有进度，但尚未生成历史 record」时
        // 第一次新增 record 把当前值重置回仅由 history 推导的结果。
        const nextValue = calculateNextValueOnRecordCreate(
          KeyResultProgress.fromDTO(keyResult.progress),
          historyBefore.map((item) => item.value),
          params.value,
        );

        if (nextValue !== keyResult.progress.currentValue) {
          goal.updateKeyResultProgress(keyResultId, nextValue);
        }
        goal.advanceVersion();
        await goalRepository.saveRootWithExpectedVersion(goal, expectedVersion);

        const recordDTO = record.toClientDTO(goalId, nextValue);
        return ok(
          createGoalMutationReceipt(
            goal,
            {
              keyResultIds: [keyResult.id],
              recordIds: [record.id],
            },
            { upserted: [recordDTO], removedIds: [] },
          ),
        );
      });
    } catch (cause) {
      if (cause instanceof GoalVersionConflictError) {
        return error('CONFLICT', cause.message);
      }
      throw cause;
    }
  }
}

function calculateNextValueOnRecordCreate(
  progress: KeyResultProgress,
  historyBefore: number[],
  addedValue: number,
): number {
  if (progress.aggregationMethod === 'Sum') {
    return progress.currentValue + addedValue;
  }

  return progress.recalculateFromHistory([...historyBefore, addedValue]).currentValue;
}
