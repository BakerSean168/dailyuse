/**
 * Activate Task Template Use Case
 *
 * Business flow:
 * 1. Mark the template as active.
 * 2. Generate the next task instances immediately.
 * 3. Persist both template state and generated instances in one write boundary.
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import { TaskInstanceGenerationService } from '../../../domain/services/index';
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
 * Activate Task Template Use Case
 */
export class ActivateTaskTemplateUseCase {
  private readonly generationService: TaskInstanceGenerationService;
  private readonly logger = createLogger('ActivateTaskTemplateUseCase');
  private readonly transactionRunner: TaskWriteTransactionRunner;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
    transactionRunner?: TaskWriteTransactionRunner,
  ) {
    this.generationService = new TaskInstanceGenerationService();
    this.transactionRunner =
      transactionRunner ??
      createInlineTaskWriteTransactionRunner({
        templateRepository,
        instanceRepository,
      });
  }

  async execute(
    id: string,
    identityId: string,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instancesGenerated: number }>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository, instanceRepository }) => {
        const template = await templateRepository.findByIdForIdentity(identityId, id);
        if (!template) {
          return error('NOT_FOUND', `TaskTemplate ${id} not found`);
        }

        template.activate();
        await templateRepository.save(template);

        const instances = this.generationService.generateInstances(template);
        let instancesGenerated = 0;

        if (instances.length > 0) {
          await instanceRepository.saveMany(instances);
          await templateRepository.save(template);
          instancesGenerated = instances.length;
        }

        return ok({
          template: template.toClientDTO(),
          instancesGenerated,
        });
      });
    } catch (caughtError) {
      this.logger.error('Failed to activate task template', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to activate task template'),
      );
    }
  }
}
