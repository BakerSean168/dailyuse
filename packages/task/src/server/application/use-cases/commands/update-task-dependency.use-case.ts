/**
 * Update Task Dependency
 *
 * 更新任务依赖关系
 */

import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { TaskDependencyClientDTO, DependencyType } from '@memoflow/contracts/task';
import { dependencyServerToClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class UpdateTaskDependencyUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(
    id: string,
    identityId: string,
    request: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<Result<TaskDependencyClientDTO>> {
    const dependency = await this.dependencyRepository.findByIdForIdentity(identityId, id);
    if (!dependency) {
      return error('NOT_FOUND', `TaskDependency ${id} not found`);
    }

    const updated = await this.dependencyRepository.update(identityId, id, request);
    return ok(dependencyServerToClientDTO(updated));
  }
}
