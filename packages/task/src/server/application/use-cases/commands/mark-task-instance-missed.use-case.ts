import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { MarkTaskInstanceMissedReq, TaskInstanceOperationRes } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok, error, fail } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import { mapTaskWriteErrorToResultError, type TaskWriteTransactionRunner } from './task-write-support';
import { reevaluateTaskPlanOutcome } from './task-plan-outcome-reevaluation';

/** Explicit Missed fact; strict policy may atomically close the plan as Failed. */
export class MarkTaskInstanceMissedUseCase {
  private readonly logger = createLogger('MarkTaskInstanceMissedUseCase');
  constructor(
    private readonly instanceRepository: ITaskInstanceRepository,
    private readonly transactionRunner: TaskWriteTransactionRunner,
  ) {
    if (!transactionRunner) throw new Error('TaskWriteTransactionRunner must be explicitly provided to MarkTaskInstanceMissedUseCase');
  }

  async execute(id: string, identityId: string, request?: MarkTaskInstanceMissedReq): Promise<Result<TaskInstanceOperationRes>> {
    try {
      return await this.transactionRunner.run(async (repositories) => {
        const instance = await repositories.instanceRepository.findByIdForIdentity(identityId, id);
        if (!instance) return error('NOT_FOUND', `TaskInstance ${id} not found`);
        if (!instance.canMarkMissed()) return error('VALIDATION_ERROR', 'Cannot mark this task instance missed');
        instance.markMissed(request?.reason);
        await repositories.instanceRepository.save(instance);
        await reevaluateTaskPlanOutcome(repositories, identityId, String(instance.templateId), instance.id);
        return ok({ instance: instance.toClientDTO() });
      });
    } catch (caughtError) {
      this.logger.error('Failed to mark task instance missed', { error: caughtError });
      return fail(mapTaskWriteErrorToResultError(caughtError, 'Failed to mark task instance missed'));
    }
  }
}
