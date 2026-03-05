/**
 * Delete Goal Record Use Case
 *
 * 删除目标进度记录
 */

import type { IGoalRecordRepository } from '@/domain-server';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class DeleteGoalRecord {
  constructor(
    private readonly goalRecordRepository: IGoalRecordRepository,
  ) {}

  async execute(recordId: string): Promise<Result<void>> {
    try {
      await this.goalRecordRepository.delete(recordId);
      return ok(undefined);
    } catch (e) {
      return error('INTERNAL_ERROR', `Failed to delete record: ${recordId}`);
    }
  }
}
