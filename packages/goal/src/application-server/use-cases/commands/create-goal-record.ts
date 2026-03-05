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
import type { GoalProgressCalculator } from '@/domain-server';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IdentityId, KeyResultId } from '@dailyuse/contracts/primitives';

export class CreateGoalRecord {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly goalRecordRepository: IGoalRecordRepository,
    private readonly goalProgressCalculator: GoalProgressCalculator,
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

    // 3. 创建 GoalRecord 实体
    const record = GoalRecord.create({
      keyResultId: keyResultId as KeyResultId,
      identityId: identityId as IdentityId,
      value: params.value,
      note: params.note,
    });

    // 4. 持久化
    await this.goalRecordRepository.save(record);

    // 5. 根据历史记录重算并同步 KR 当前值
    const progressResult = await this.goalProgressCalculator.recalculateKeyResultProgress(
      goal,
      keyResultId,
    );
    if (progressResult.changed) {
      await this.goalRepository.save(goal);
    }

    return ok(record.toClientDTO(goalId));
  }
}
