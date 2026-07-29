/**
 * Create Task Dependency
 *
 * 创建任务依赖关系
 */

import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { TaskDependencyClientDTO } from '@memoflow/contracts/task';
import { dependencyServerToClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';

export class CreateTaskDependencyUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(request: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: import('@memoflow/contracts/task').DependencyType;
    lagDays?: number;
    identityId: string;
  }): Promise<Result<TaskDependencyClientDTO>> {
    // Check for self-dependency
    if (request.predecessorTaskId === request.successorTaskId) {
      return error('VALIDATION_ERROR', '任务不能依赖自身');
    }

    // Check for duplicate
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessorId(
      request.predecessorTaskId,
      request.successorTaskId,
      request.identityId,
    );
    if (existing) {
      return error('DUPLICATE', '依赖关系已存在');
    }

    const dependency = await this.dependencyRepository.create({
      predecessorTaskId: request.predecessorTaskId,
      successorTaskId: request.successorTaskId,
      dependencyType: request.dependencyType,
      lagDays: request.lagDays,
      identityId: request.identityId,
    });

    return ok(dependencyServerToClientDTO(dependency));
  }
}
