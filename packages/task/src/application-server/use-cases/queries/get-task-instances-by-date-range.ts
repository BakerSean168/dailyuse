/**
 * Get Task Instances By Date Range Service
 *
 * 鏍规嵁鏃ユ湡鑼冨洿鑾峰彇浠诲姟瀹炰緥
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type {
  GetTaskInstancesByRangeRes,
} from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Instances By Date Range Service
 */
export class GetTaskInstancesByDateRange {
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

