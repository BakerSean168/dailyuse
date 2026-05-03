/**
 * List Task Dependencies
 *
 * 获取任务的依赖关系列表（前置任务 / 后续任务）
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListTaskDependenciesUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async executeDependencies(taskId: string): Promise<Result<TaskDependencyServerDTO[]>> {
    const dependencies = await this.dependencyRepository.findBySuccessorId(taskId);
    return ok(dependencies);
  }

  async executeDependents(taskId: string): Promise<Result<TaskDependencyServerDTO[]>> {
    const dependents = await this.dependencyRepository.findByPredecessorId(taskId);
    return ok(dependents);
  }
}
