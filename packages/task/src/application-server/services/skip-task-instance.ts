/**
 * Skip Task Instance Service
 *
 * 璺宠繃浠诲姟瀹炰緥
 */

import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
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
    const instance = await this.instanceRepository.findById(uuid);
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

