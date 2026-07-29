/**
 * Delete Goal Record Use Case
 *
 * 删除目标进度记录（身份隔离）
 */

import type { IGoalRecordRepository } from '../../../domain';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class DeleteGoalRecordUseCase {
  constructor(
    private readonly goalRecordRepository: IGoalRecordRepository,
  ) {}

  async execute(recordId: string, identityId: string): Promise<Result<void>> {
    const record = await this.goalRecordRepository.findByIdForIdentity(identityId, recordId);
    if (!record) {
      return error('NOT_FOUND', `Goal record not found: ${recordId}`);
    }

    try {
      await this.goalRecordRepository.delete(identityId, recordId);
      return ok(undefined);
    } catch (_e) {
      return error('INTERNAL_ERROR', `Failed to delete record: ${recordId}`);
    }
  }
}
