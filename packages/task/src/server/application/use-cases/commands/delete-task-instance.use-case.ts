/**
 * Delete Task Instance Service
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskEventMap } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import { createTypedEventPublisher, eventBus } from '@dailyuse/utils/domain';

const taskEvents = createTypedEventPublisher<Pick<TaskEventMap, 'task:instance-deleted'>>(eventBus);

export class DeleteTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string): Promise<Result<void>> {
    const instance = await this.instanceRepository.findById(id);

    // Delete remains idempotent: callers do not need to care whether the
    // instance still exists when issuing the command.
    await this.instanceRepository.delete(id);

    if (instance) {
      taskEvents.send('task:instance-deleted', {
        identityId: instance.identityId,
        taskInstanceId: instance.id,
        taskTemplateId: instance.templateId,
        deletedAt: Date.now(),
      });
    }

    return ok(undefined);
  }
}
