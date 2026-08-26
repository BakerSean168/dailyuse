import type { AbandonTaskPlanReq, TaskTemplateClientDTO } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { error, fail, ok } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import { mapTaskWriteErrorToResultError, type TaskWriteTransactionRunner } from './task-write-support';

/** Explicit user abandonment. Delete is reserved for mistaken creation. */
export class AbandonTaskPlanUseCase {
  private readonly logger = createLogger('AbandonTaskPlanUseCase');
  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly transactionRunner: TaskWriteTransactionRunner,
  ) {
    if (!transactionRunner) throw new Error('TaskWriteTransactionRunner must be explicitly provided to AbandonTaskPlanUseCase');
  }

  async execute(id: string, identityId: string, request?: AbandonTaskPlanReq): Promise<Result<TaskTemplateClientDTO>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository }) => {
        const template = await templateRepository!.findByIdForIdentity(identityId, id);
        if (!template) return error('NOT_FOUND', `TaskTemplate ${id} not found`);
        template.abandon(request?.reason);
        await templateRepository!.save(template);
        return ok(template.toClientDTO());
      });
    } catch (caughtError) {
      this.logger.error('Failed to abandon task plan', { error: caughtError });
      return fail(mapTaskWriteErrorToResultError(caughtError, 'Failed to abandon task plan'));
    }
  }
}
