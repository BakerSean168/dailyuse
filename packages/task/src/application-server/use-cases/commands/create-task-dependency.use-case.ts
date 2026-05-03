/**
 * Create Task Dependency
 *
 * 创建任务依赖关系
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class CreateTaskDependencyUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(request: {
    predecessorTaskId: string;
    successorTaskId: string;
    dependencyType?: import('@dailyuse/contracts/task').DependencyType;
    lagDays?: number;
    identityId: string;
  }): Promise<Result<TaskDependencyServerDTO>> {
    // Check for self-dependency
    if (request.predecessorTaskId === request.successorTaskId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: '任务不能依赖自身' } } as any;
    }

    // Check for duplicate
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessorId(
      request.predecessorTaskId,
      request.successorTaskId,
    );
    if (existing) {
      return { success: false, error: { code: 'DUPLICATE', message: '依赖关系已存在' } } as any;
    }

    const dependency = await this.dependencyRepository.create({
      predecessorTaskId: request.predecessorTaskId,
      successorTaskId: request.successorTaskId,
      dependencyType: request.dependencyType,
      lagDays: request.lagDays,
      identityId: request.identityId,
    });

    return ok(dependency);
  }
}
