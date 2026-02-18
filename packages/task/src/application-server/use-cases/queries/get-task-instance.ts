/**
 * Get Task Instance Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class GetTaskInstance {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string): Promise<Result<TaskInstanceClientDTO | null>> {
    const instance = await this.instanceRepository.findById(id);
    return ok(instance ? instance.toClientDTO() : null);
  }
}
