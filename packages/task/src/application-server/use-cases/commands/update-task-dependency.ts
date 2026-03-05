/**
 * Update Task Dependency
 *
 * 更新任务依赖关系
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { TaskDependencyServerDTO, DependencyType } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateTaskDependency {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(
    id: string,
    request: { dependencyType?: DependencyType; lagDays?: number },
  ): Promise<Result<TaskDependencyServerDTO>> {
    const dependency = await this.dependencyRepository.findById(id);
    if (!dependency) {
      return error('NOT_FOUND', `TaskDependency ${id} not found`);
    }

    const updated = await this.dependencyRepository.update(id, request);
    return ok(updated);
  }
}
