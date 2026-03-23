/**
 * Delete Task Instance Service
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import { eventBus } from '@dailyuse/utils';

export class DeleteTaskInstance {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string): Promise<Result<void>> {
    const instance = await this.instanceRepository.findById(id);

    // Delete remains idempotent: callers do not need to care whether the
    // instance still exists when issuing the command.
    await this.instanceRepository.delete(id);

    if (instance) {
      (eventBus as any).send('task:instance:deleted', {
        identityId: String(instance.identityId),
        taskInstanceId: instance.id,
        taskTemplateId: String(instance.templateId),
        deletedAt: Date.now(),
      });
    }

    return ok(undefined);
  }
}
