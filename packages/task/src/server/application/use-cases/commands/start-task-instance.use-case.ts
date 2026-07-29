/**
 * Start Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskInstanceClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class StartTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string, identityId: string): Promise<Result<TaskInstanceClientDTO>> {
    const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
    }

    if (!instance.canStart()) {
      return error('VALIDATION_ERROR', 'Cannot start this task instance');
    }

    instance.start();
    await this.instanceRepository.save(instance);

    return ok(instance.toClientDTO());
  }
}
