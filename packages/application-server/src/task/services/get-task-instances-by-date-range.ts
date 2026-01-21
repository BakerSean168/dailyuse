/**
 * Get Task Instances By Date Range Service
 *
 * 根据日期范围获取任务实例
 */

import type { ITaskInstanceRepository } from '@dailyuse/domain-server/task';
import type {
  TaskInstanceClientDTO,
  TaskInstancesResponse,
} from '@dailyuse/contracts/task';

/**
 * Get Task Instances By Date Range Service
 */
export class GetTaskInstancesByDateRange {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(accountUuid: string, startDate: number, endDate: number): Promise<TaskInstancesResponse> {
    const instances = await this.instanceRepository.findByDateRange(
      accountUuid,
      startDate,
      endDate,
    );

    return {
      instances: instances.map((i) => i.toClientDTO()),
      total: instances.length,
    };
  }
}

