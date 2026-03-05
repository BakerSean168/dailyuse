/**
 * Check Expired Instances
 *
 * 检查并标记过期的任务实例
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import { TaskExpirationService } from '@/domain-server/services/TaskExpirationService';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class CheckExpiredInstances {
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
