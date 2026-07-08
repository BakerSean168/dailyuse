/**
 * Pause Task Template Use Case
 *
 * Business flow:
 * 1. Mark the template as paused.
 * 2. Stop future instance generation from the pause timestamp forward.
 * 3. Remove incomplete future instances that should no longer be executed.
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error, fail } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import {
  createInlineTaskWriteTransactionRunner,
  mapTaskWriteErrorToResultError,
  type TaskWriteTransactionRunner,
} from './task-write-support';

/**
 * Pause Task Template Use Case
 */
export class PauseTaskTemplateUseCase {
  private readonly logger = createLogger('PauseTaskTemplateUseCase');
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

  async execute(
    id: string,
    _reason?: string,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instancesDeleted: number }>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository, instanceRepository }) => {
        const template = await templateRepository.findById(id);
        if (!template) {
          return error('NOT_FOUND', `TaskTemplate ${id} not found`);
        }

        const effectiveFrom = Date.now();

        template.pause();
        await templateRepository.save(template);

        const instancesDeleted = await instanceRepository.deleteIncompleteInstancesFrom(
          id,
          effectiveFrom,
        );

        return ok({
          template: template.toClientDTO(),
          instancesDeleted,
        });
      });
    } catch (caughtError) {
      this.logger.error('Failed to pause task template', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to pause task template'),
      );
    }
  }
}
