/**
 * Skip Task Instance Service
 *
 * 跳过任务实例
 */

import type { ITaskInstanceRepository } from '@/domain-server';
import type {
  TaskInstanceClientDTO,
  SkipTaskInstanceRequest,
  TaskInstanceResponse,
} from '@dailyuse/contracts/task';

/**
 * Skip Task Instance Service
 */
export class SkipTaskInstance {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(uuid: string, request?: SkipTaskInstanceRequest): Promise<TaskInstanceResponse> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      throw new Error(`TaskInstance ${uuid} not found`);
    }

    if (!instance.canSkip()) {
      throw new Error('Cannot skip this task instance');
    }

    instance.skip(request?.reason);
    await this.instanceRepository.save(instance);

    return {
      instance: instance.toClientDTO(),
    };
  }
}

