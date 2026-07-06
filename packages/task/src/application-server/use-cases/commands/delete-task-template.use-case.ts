/**
 * Delete Task Template Use Case
 *
 * Removes the template and clears its generated instances in one write boundary.
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/i-task-instance-repository';
import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import {
  createInlineTaskWriteTransactionRunner,
  mapTaskWriteErrorToResultError,
  type TaskWriteTransactionRunner,
} from './task-write-support';

/**
 * Delete Task Template Use Case
 */
export class DeleteTaskTemplateUseCase {
  private readonly logger = createLogger('DeleteTaskTemplateUseCase');
  private readonly transactionRunner: TaskWriteTransactionRunner;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
    transactionRunner?: TaskWriteTransactionRunner,
  ) {
    this.transactionRunner =
      transactionRunner ??
      createInlineTaskWriteTransactionRunner({
        templateRepository,
        instanceRepository,
      });
  }

  async execute(id: string, soft = false): Promise<Result<{ success: boolean }>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository, instanceRepository }) => {
        const template = await templateRepository.findById(id);
        if (!template) {
          // Idempotent delete: if the template is already gone, treat it as success.
          return ok({ success: true });
        }

        template.softDelete();
        await templateRepository.save(template);
        await instanceRepository.deleteByTemplateId(id);

        if (!soft) {
          await templateRepository.delete(id);
        }

        return ok({ success: true });
      });
    } catch (caughtError) {
      this.logger.error('Failed to delete task template', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to delete task template'),
      );
    }
  }
}
