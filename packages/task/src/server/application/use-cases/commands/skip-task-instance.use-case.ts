import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { SkipTaskInstanceReq, TaskInstanceOperationRes } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error, fail } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import { mapTaskWriteErrorToResultError, type TaskWriteTransactionRunner } from './task-write-support';
import { reevaluateTaskPlanOutcome } from './task-plan-outcome-reevaluation';

/** Skipped is an explicit waiver and participates in plan re-evaluation atomically. */
export class SkipTaskInstanceUseCase {
  private readonly logger = createLogger('SkipTaskInstanceUseCase');
  constructor(
    private readonly instanceRepository: ITaskInstanceRepository,
    private readonly transactionRunner: TaskWriteTransactionRunner,
  ) {
    if (!transactionRunner) throw new Error('TaskWriteTransactionRunner must be explicitly provided to SkipTaskInstanceUseCase');
  }

  async execute(id: string, identityId: string, request?: SkipTaskInstanceReq): Promise<Result<TaskInstanceOperationRes>> {
    try {
      return await this.transactionRunner.run(async (repositories) => {
        const instance = await repositories.instanceRepository.findByIdForIdentity(identityId, id);
        if (!instance) return error('NOT_FOUND', `TaskInstance ${id} not found`);
        if (!instance.canSkip()) return error('VALIDATION_ERROR', 'Cannot skip this task instance');
        instance.skip(request?.reason);
        await repositories.instanceRepository.save(instance);
        await reevaluateTaskPlanOutcome(repositories, identityId, String(instance.templateId), instance.id);
        return ok({ instance: instance.toClientDTO() });
      });
    } catch (caughtError) {
      this.logger.error('Failed to skip task instance', { error: caughtError });
      return fail(mapTaskWriteErrorToResultError(caughtError, 'Failed to skip task instance'));
    }
  }
}
