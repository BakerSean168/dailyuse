/**
 * List Task Dependencies
 *
 * 获取任务的依赖关系列表（前置任务 / 后续任务）
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import { dependencyServerToClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskDependenciesUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async executeDependencies(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    const dependencies = await this.dependencyRepository.findBySuccessorId(taskId);
    return ok(dependencies.map(dependencyServerToClientDTO));
  }

  async executeDependents(taskId: string): Promise<Result<TaskDependencyClientDTO[]>> {
    const dependents = await this.dependencyRepository.findByPredecessorId(taskId);
    return ok(dependents.map(dependencyServerToClientDTO));
  }
}
