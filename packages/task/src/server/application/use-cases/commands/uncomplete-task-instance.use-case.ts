import type { TaskInstanceOperationRes } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';

export class UncompleteTaskInstanceUseCase {
  constructor(private readonly instanceRepository: ITaskInstanceRepository) {}

  async execute(id: string, identityId: string): Promise<Result<TaskInstanceOperationRes>> {
    const instance = await this.instanceRepository.findByIdForIdentity(identityId, id);
    if (!instance) {
      return error('NOT_FOUND', `TaskInstance ${id} not found`);
    }
    if (instance.status !== 'Completed') {
      return error('VALIDATION_ERROR', 'Only a completed task can be uncompleted');
    }

    instance.uncomplete();
    await this.instanceRepository.save(instance);
    return ok({ instance: instance.toClientDTO() });
  }
}
