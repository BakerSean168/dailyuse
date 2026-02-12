/**
 * Get Task Instances By Date Range Service
 *
 * 根据日期范围获取任务实例
 */

import type { ITaskInstanceRepository } from '@/domain-server';
import type {
  TaskInstanceClientDTO,
  TaskInstancesResponse,
} from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Task Instances By Date Range Service
 */
export class GetTaskInstancesByDateRange {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(accountUuid: string, startDate: number, endDate: number): Promise<Result<TaskInstancesResponse>> {
    const instances = await this.instanceRepository.findByDateRange(
      accountUuid,
      startDate,
      endDate,
    );

    return ok({
      instances: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    });
  }
}

