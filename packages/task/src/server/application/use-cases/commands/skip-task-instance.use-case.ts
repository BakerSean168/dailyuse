/**
 * Skip Task Instance Service
 *
 * 跳过任务实例
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type {
  SkipTaskInstanceReq,
  TaskInstanceOperationRes,
} from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

/**
 * Skip Task Instance Service
 */
export class SkipTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(
    id: string,
    identityId: string,
    request?: SkipTaskInstanceReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
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
