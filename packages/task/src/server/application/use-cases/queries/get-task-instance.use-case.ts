/**
 * Get Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskInstanceClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class GetTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(
    id: string,
    identityId: string,
  ): Promise<Result<TaskInstanceClientDTO | null>> {
    const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
    return ok(instance ? instance.toClientDTO() : null);
  }
}
