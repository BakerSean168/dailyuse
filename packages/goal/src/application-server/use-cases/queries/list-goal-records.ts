/**
 * List Goal Records Use Case (Query)
 *
 * 查询目标进度记录
 * - 按 goalId 查询
 * - 按 keyResultId 查询
 */

import type { IGoalRecordRepository } from '@/domain-server';
import type { GoalRecord } from '@/domain-server';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export interface ListGoalRecordsParams {
  goalId?: string;
  keyResultId?: string;
  limit?: number;
  offset?: number;
}

export interface ListGoalRecordsResult {
  data: GoalRecordClientDTO[];
  total: number;
}

export class ListGoalRecords {
  constructor(
    private readonly goalRecordRepository: IGoalRecordRepository,
  ) {}

  async execute(params: ListGoalRecordsParams): Promise<Result<ListGoalRecordsResult>> {
    const { goalId, keyResultId, limit = 20, offset = 0 } = params;

    let records: GoalRecord[];
    if (keyResultId) {
      records = await this.goalRecordRepository.findByKeyResultId(keyResultId, {
        orderBy: 'desc',
        limit,
      });
    } else if (goalId) {
      records = await this.goalRecordRepository.findByGoalId(goalId, {
        orderBy: 'desc',
        limit,
      });
    } else {
      records = [];
    }

    // Apply offset manually (repository doesn't support offset)
    const sliced = records.slice(offset, offset + limit);

    return ok({
      data: sliced.map((r) => r.toClientDTO(goalId ?? '')),
      total: records.length,
    });
  }
}
