/**
 * Complete Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { CompleteTaskInstanceReq, TaskInstanceOperationRes } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/**
 * Complete Task Instance Service
 */
export class CompleteTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(
    id: string,
    request?: CompleteTaskInstanceReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await this.instanceRepository.findById(id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
    }

    if (!instance.canComplete()) {
      return error('VALIDATION_ERROR', 'Cannot complete this task instance');
    }

    // Mark as completed
    instance.complete(request?.duration, request?.note, request?.rating);
    await this.instanceRepository.save(instance);

    return ok({
      instance: instance.toClientDTO(),
    });
  }
}
