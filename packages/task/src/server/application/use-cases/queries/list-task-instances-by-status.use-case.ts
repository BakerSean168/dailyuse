/**
 * List Task Instances By Status Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskInstanceClientDTO, TaskInstanceStatus } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class ListTaskInstancesByStatusUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(identityId: string, status: TaskInstanceStatus): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByStatus(identityId, status);
    return ok(instances.map((i) => i.toClientDTO()));
  }
}
