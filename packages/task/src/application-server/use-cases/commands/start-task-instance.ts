/**
 * Start Task Instance Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class StartTaskInstance {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string): Promise<Result<TaskInstanceClientDTO>> {
    const instance = await this.instanceRepository.findById(id);
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
