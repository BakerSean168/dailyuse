/**
 * List Task Instances By Status Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/i-task-instance-repository';
import type { TaskInstanceClientDTO, TaskInstanceStatus } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskInstancesByStatusUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(identityId: string, status: TaskInstanceStatus): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByStatus(identityId, status);
    return ok(instances.map((i) => i.toClientDTO()));
  }
}
