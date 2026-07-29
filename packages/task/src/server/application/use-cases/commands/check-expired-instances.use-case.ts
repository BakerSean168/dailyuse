/**
 * Check Expired Instances
 *
 * 检查并标记过期的任务实例
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import { TaskExpirationService } from '../../../domain/services/index';
import type { TaskInstanceClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class CheckExpiredInstancesUseCase {
  private readonly expirationService: TaskExpirationService;

  constructor(private readonly instanceRepository: ITaskInstanceRepository) {
    this.expirationService = new TaskExpirationService();
  }

  async execute(identityId: string): Promise<Result<TaskInstanceClientDTO[]>> {
    const instances = await this.instanceRepository.findByIdentityId(identityId);

    const expiredInstances = this.expirationService.markExpiredInstances(instances);

    if (expiredInstances.length > 0) {
      await this.instanceRepository.saveMany(expiredInstances);
    }

    return ok(expiredInstances.map((i) => i.toClientDTO()));
  }
}
