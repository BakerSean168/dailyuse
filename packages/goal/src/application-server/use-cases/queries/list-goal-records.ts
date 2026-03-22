/**
 * List Goal Records Use Case (Query)
 *
 * 查询目标进度记录
 * - 按 goalId 查询
 * - 按 keyResultId 查询
 */

import type { IGoalRecordRepository, IGoalRepository } from '@/domain-server';
import type { GoalRecord } from '@/domain-server';
import { KeyResultProgress } from '@/domain-shared';
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
    private readonly goalRepository: IGoalRepository,
  ) {}

  async execute(params: ListGoalRecordsParams): Promise<Result<ListGoalRecordsResult>> {
    const { goalId, keyResultId, limit = 20, offset = 0 } = params;

    let records: GoalRecord[];
    if (keyResultId) {
      records = await this.goalRecordRepository.findByKeyResultId(keyResultId, {
        orderBy: 'desc',
      });
    } else if (goalId) {
      records = await this.goalRecordRepository.findByGoalId(goalId, {
        orderBy: 'desc',
      });
    } else {
      records = [];
    }

    // Apply offset manually (repository doesn't support offset)
    const sliced = records.slice(offset, offset + limit);

    const valueAfterByRecordId = await this.buildValueAfterMap(goalId, records);

    return ok({
      data: sliced.map((r) =>
        r.toClientDTO(goalId ?? '', valueAfterByRecordId.get(String(r.id)) ?? r.value),
      ),
      total: records.length,
    });
  }

  private async buildValueAfterMap(
    goalId: string | undefined,
    records: GoalRecord[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (!goalId || records.length === 0) {
      return result;
    }

    const goal = await this.goalRepository.findById(goalId, { includeChildren: true });
    if (!goal) {
      return result;
    }

    const keyResultById = new Map(goal.keyResults.map((kr) => [String(kr.id), kr]));
    const recordsByKeyResult = new Map<string, GoalRecord[]>();

    for (const record of records) {
      const key = String(record.keyResultId);
      const group = recordsByKeyResult.get(key) ?? [];
      group.push(record);
      recordsByKeyResult.set(key, group);
    }

    for (const [keyResultId, group] of recordsByKeyResult) {
      const keyResult = keyResultById.get(keyResultId);
      if (!keyResult) {
        group.forEach((record) => result.set(String(record.id), record.value));
        continue;
      }

      const progressTemplate = KeyResultProgress.fromDTO({
        ...keyResult.progress,
        currentValue: keyResult.progress.initialValue,
      });
      const history: number[] = [];
      const sorted = [...group].sort(
        (a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime() ||
          String(a.id).localeCompare(String(b.id)),
      );

      for (const record of sorted) {
        history.push(record.value);
        result.set(String(record.id), progressTemplate.recalculateFromHistory(history).currentValue);
      }
    }

    return result;
  }
}
