/**
 * Delete Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class DeleteTaskInstance {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string): Promise<Result<void>> {
    await this.instanceRepository.delete(id);
    return ok(undefined);
  }
}
