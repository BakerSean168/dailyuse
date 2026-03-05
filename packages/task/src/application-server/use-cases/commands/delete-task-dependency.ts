/**
 * Delete Task Dependency
 *
 * 删除任务依赖关系
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class DeleteTaskDependency {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(id: string): Promise<Result<void>> {
    const dependency = await this.dependencyRepository.findById(id);
    if (!dependency) {
      return error('NOT_FOUND', `TaskDependency ${id} not found`);
    }

    await this.dependencyRepository.delete(id);
    return ok(undefined);
  }
}
