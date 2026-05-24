/**
 * Delete Task Dependency
 *
 * 删除任务依赖关系
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/i-task-dependency-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class DeleteTaskDependencyUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(id: string): Promise<Result<void>> {
    const dependency = await this.dependencyRepository.findAggregateById(id);
    if (!dependency) {
      return error('NOT_FOUND', `TaskDependency ${id} not found`);
    }

    dependency.delete();
    await this.dependencyRepository.deleteAggregate(dependency);
    return ok(undefined);
  }
}
