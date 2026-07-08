/**
 * Generate Task Instances
 *
 * 为指定模板生成任务实例
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import { TaskInstanceGenerationService } from '../../../domain/services/index';
import type { TaskInstanceClientDTO } from '@dailyuse/contracts/task';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error, fail } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
import {
  createInlineTaskWriteTransactionRunner,
  mapTaskWriteErrorToResultError,
  type TaskWriteTransactionRunner,
} from './task-write-support';

export class GenerateTaskInstancesUseCase {
  private readonly generationService: TaskInstanceGenerationService;
  private readonly logger = createLogger('GenerateTaskInstancesUseCase');
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
    templateId: string,
    request: { fromDate: number; toDate: number },
  ): Promise<Result<TaskInstanceClientDTO[]>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository, instanceRepository }) => {
        const template = await templateRepository.findById(templateId);
        if (!template) {
          return error('NOT_FOUND', `TaskTemplate ${templateId} not found`);
        }

        const instances = this.generationService.generateInstances(template, {
          forceGenerate: true,
          targetDate: request.toDate,
        });

        if (instances.length > 0) {
          await instanceRepository.saveMany(instances);
          await templateRepository.save(template);
        }

        return ok(instances.map((instance) => instance.toClientDTO()));
      });
    } catch (caughtError) {
      this.logger.error('Failed to generate task instances', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to generate task instances'),
      );
    }
  }
}
