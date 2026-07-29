/**
 * Validate Task Dependency
 *
 * 验证依赖关系（检查循环依赖等）
 */

import type { ITaskDependencyRepository } from '../../../domain/repositories/i-task-dependency-repository';
import type { TaskTemplateId } from '@memoflow/contracts/primitives';
import type { ValidateDependencyResponse } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

export class ValidateTaskDependencyUseCase {
  constructor(private readonly dependencyRepository: ITaskDependencyRepository) {}

  async execute(
    predecessorTaskId: string,
    successorTaskId: string,
    identityId: string,
  ): Promise<Result<ValidateDependencyResponse>> {
    // Self-dependency check
    if (predecessorTaskId === successorTaskId) {
      return ok({
        isValid: false,
        errors: ['任务不能依赖自身'],
        wouldCreateCycle: true,
        message: '任务不能依赖自身',
      });
    }

    // Duplicate check
    const existing = await this.dependencyRepository.findByPredecessorAndSuccessorId(
      predecessorTaskId,
      successorTaskId,
      identityId,
    );
    if (existing) {
      return ok({
        isValid: false,
        errors: ['依赖关系已存在'],
        message: '依赖关系已存在',
      });
    }

    // Circular dependency check — would adding this edge create a cycle?
    const allSuccessorsOfSuccessor = await this.dependencyRepository.findAllSuccessorIds(
      successorTaskId,
      identityId,
    );
    if (allSuccessorsOfSuccessor.includes(predecessorTaskId)) {
      return ok({
        isValid: false,
        errors: ['会产生循环依赖'],
        wouldCreateCycle: true,
        cyclePath: [predecessorTaskId, successorTaskId, ...allSuccessorsOfSuccessor] as TaskTemplateId[],
        message: '会产生循环依赖',
      });
    }

    return ok({
      isValid: true,
      message: '依赖关系验证通过',
    });
  }
}
