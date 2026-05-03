/**
 * Get Dependency Chain
 *
 * 获取任务完整依赖链
 */

import type { ITaskDependencyRepository } from '@/domain-server/repositories/ITaskDependencyRepository';
import type { DependencyChainServerDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class GetDependencyChainUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(taskId: string): Promise<Result<DependencyChainServerDTO>> {
    const allPredecessors = await this.dependencyRepository.findAllPredecessorIds(taskId);
    const allSuccessors = await this.dependencyRepository.findAllSuccessorIds(taskId);

    const chain: DependencyChainServerDTO = {
      taskId,
      allPredecessors,
      allSuccessors,
      depth: allPredecessors.length,
      isOnCriticalPath: false,
    };

    return ok(chain);
  }
}
