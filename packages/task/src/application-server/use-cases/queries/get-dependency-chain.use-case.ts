/**
 * Get Dependency Chain
 *
 * 获取任务完整依赖链
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { DependencyChainClientDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateId } from '@dailyuse/contracts/primitives';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class GetDependencyChainUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(taskId: string): Promise<Result<DependencyChainClientDTO>> {
    const allPredecessors = await this.dependencyRepository.findAllPredecessorIds(taskId);
    const allSuccessors = await this.dependencyRepository.findAllSuccessorIds(taskId);

    const chain: DependencyChainClientDTO = {
      taskId: taskId as TaskTemplateId,
      allPredecessors: allPredecessors as TaskTemplateId[],
      allSuccessors: allSuccessors as TaskTemplateId[],
      depth: allPredecessors.length,
      isOnCriticalPath: false,
    };

    return ok(chain);
  }
}
