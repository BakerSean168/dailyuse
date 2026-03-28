/**
 * Create Goal Record Use Case
 *
 * 创建目标进度记录（GoalRecord）
 * - 验证 Goal 和 KeyResult 存在
 * - 创建 GoalRecord 实体
 * - 通过 IGoalRecordRepository 持久化
 */

import type { IGoalRepository, IGoalRecordRepository } from '@/domain-server';
import { GoalRecord } from '@/domain-server';
import { KeyResultProgress } from '@/domain-shared';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IdentityId, KeyResultId } from '@dailyuse/contracts/primitives';

export class CreateGoalRecord {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalRecordRepository: IGoalRecordRepository,
  ) {}

  async execute(
    goalId: string,
    keyResultId: string,
    params: {
      value: number;
      note?: string;
    },
    identityId: string,
  ): Promise<Result<GoalRecordClientDTO>> {
    // 1. 验证 Goal 存在
    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return error('NOT_FOUND', `Goal not found: ${goalId}`);
    }

    // 2. 验证 KeyResult 属于该 Goal
    const keyResult = goal.keyResults.find((kr) => kr.id === keyResultId);
    if (!keyResult) {
      return error('NOT_FOUND', `KeyResult not found: ${keyResultId} in goal ${goalId}`);
    }

    const historyBefore = await this.goalRecordRepository.findByKeyResultId(keyResultId, {
      orderBy: 'asc',
    });

    // 3. 创建 GoalRecord 实体
    const record = GoalRecord.create({
      keyResultId: keyResultId as KeyResultId,
      identityId: identityId as IdentityId,
      value: params.value,
      note: params.note,
    });

    // 4. 持久化
    await this.goalRecordRepository.save(record);

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
      await this.goalRepository.save(goal);
    }

    return ok(record.toClientDTO(goalId, nextValue));
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
