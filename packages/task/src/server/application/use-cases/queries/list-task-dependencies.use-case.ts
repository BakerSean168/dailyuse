/**
 * List Task Dependencies
 *
 * 获取任务的依赖关系列表（前置任务 / 后续任务）
 */

import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { TaskDependencyClientDTO } from '@memoflow/contracts/task';
import { dependencyServerToClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class ListTaskDependenciesUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async executeDependencies(
    taskId: string,
    identityId: string,
  ): Promise<Result<TaskDependencyClientDTO[]>> {
    const dependencies = await this.dependencyRepository.findBySuccessorId(taskId, identityId);
    return ok(dependencies.map(dependencyServerToClientDTO));
  }

  async executeDependents(
    taskId: string,
    identityId: string,
  ): Promise<Result<TaskDependencyClientDTO[]>> {
    const dependents = await this.dependencyRepository.findByPredecessorId(taskId, identityId);
    return ok(dependents.map(dependencyServerToClientDTO));
  }
}
