/**
 * Get Task Instances By Date Range Service
 *
 * 鏍规嵁鏃ユ湡鑼冨洿鑾峰彇浠诲姟瀹炰緥
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type {
  GetTaskInstancesByRangeRes,
} from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

/**
 * Get Task Instances By Date Range Service
 */
export class GetTaskInstancesByDateRangeUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(identityId: string, startDate: number, endDate: number): Promise<Result<GetTaskInstancesByRangeRes>> {
    const instances = await this.instanceRepository.findByDateRange(
      identityId,
      startDate,
      endDate,
    );

    return ok({
      data: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    });
  }
}
