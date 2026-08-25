import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { MarkTaskInstanceMissedReq, TaskInstanceOperationRes } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

/** Records an explicit Missed occurrence fact. This command is never clock-driven. */
export class MarkTaskInstanceMissedUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(
    id: string,
    identityId: string,
    request?: MarkTaskInstanceMissedReq,
  ): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
    }
    if (!instance.canMarkMissed()) {
      return error('VALIDATION_ERROR', 'Cannot mark this task instance missed');
    }

    instance.markMissed(request?.reason);
    await this.instanceRepository.save(instance);
    return ok({ instance: instance.toClientDTO() });
  }
}
