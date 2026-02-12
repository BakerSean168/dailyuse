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
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Skip Task Instance Service
 */
export class SkipTaskInstance {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(uuid: string, request?: SkipTaskInstanceRequest): Promise<Result<TaskInstanceResponse>> {
    const instance = await this.instanceRepository.findByUuid(uuid);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${uuid} not found`);
    }

    if (!instance.canSkip()) {
      return error('VALIDATION_ERROR', 'Cannot skip this task instance');
    }

    instance.skip(request?.reason);
    await this.instanceRepository.save(instance);

    return ok({
      instance: instance.toClientDTO(),
    });
  }
}

