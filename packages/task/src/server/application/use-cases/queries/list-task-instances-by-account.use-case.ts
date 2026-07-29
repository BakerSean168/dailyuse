/**
 * List Task Instances By Account Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskInstanceClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class ListTaskInstancesByAccountUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(identityId: string): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByIdentityId(identityId);
    return ok(instances.map((i) => i.toClientDTO()));
  }
}
