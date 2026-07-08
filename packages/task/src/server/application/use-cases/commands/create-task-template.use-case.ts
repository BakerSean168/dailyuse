/**
 * Create Task Template Service
 *
 * Creates a task template (recurring task) and automatically
 * generates initial instances upon creation.
 */

import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import { TaskTemplate } from '../../../domain/aggregates/task-template';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '../../../domain/value-objects';
import { TaskTemplateId } from '../../../domain/value-objects/task-template-id';
import { TaskInstanceGenerationService } from '../../../domain/services/index';
import type { TaskTemplateClientDTO, CreateTaskTemplateInput } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils/logger';
import type { Result } from '@dailyuse/contracts/result';
import { error, fail, ok } from '@dailyuse/contracts/result';
import {
  createInlineTaskWriteTransactionRunner,
  mapTaskWriteErrorToResultError,
  type TaskWriteTransactionRunner,
} from './task-write-support';

/**
 * Create Task Template Service
 */
export class CreateTaskTemplateUseCase {
  private readonly generationService: TaskInstanceGenerationService;
  private readonly logger = createLogger('CreateTaskTemplateUseCase');
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
    request: CreateTaskTemplateInput,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instanceCount: number }>> {
    try {
      return await this.transactionRunner.run(async ({ templateRepository, instanceRepository }) => {
        if (request.parentTaskId) {
          const parentTemplate = await templateRepository.findById(request.parentTaskId);
          if (!parentTemplate) {
            return error('BAD_REQUEST', `Parent task template ${request.parentTaskId} not found`);
          }
        }

        const timeConfig = TaskTimeConfig.fromDTO(request.timeConfig);
        const recurrenceRule = request.recurrenceRule
          ? RecurrenceRule.fromDTO(request.recurrenceRule)
          : undefined;
        const reminderConfig = request.reminderConfig
          ? TaskReminderConfig.fromDTO(request.reminderConfig)
          : undefined;

        const template = TaskTemplate.create({
          identityId: request.identityId,
          title: request.name,
          description: request.description ?? undefined,
          taskType: request.taskType,
          timeConfig,
          recurrenceRule,
          reminderConfig,
          importance: request.importance,
          parentTaskId: request.parentTaskId ? TaskTemplateId.of(request.parentTaskId) : undefined,
          folderId: request.folderId ?? undefined,
          tags: request.tags,
          color: request.color ?? undefined,
          goalBinding: request.goalBinding
            ? {
                goalId: request.goalBinding.goalId,
                keyResultId: request.goalBinding.keyResultId,
                goalRecordValue: request.goalBinding.goalRecordValue,
                progressTrigger: request.goalBinding.progressTrigger,
              }
            : null,
        });

        await templateRepository.save(template);

        let instanceCount = 0;

        if (template.status === TaskTemplateStatus.Active) {
          instanceCount = await this.generateInitialInstances(
            template,
            templateRepository,
            instanceRepository,
          );
        }

        return ok({
          template: template.toClientDTO(),
          instanceCount,
        });
      });
    } catch (caughtError) {
      this.logger.error('Failed to create task template', { error: caughtError });
      return fail(
        mapTaskWriteErrorToResultError(caughtError, 'Failed to create task template'),
      );
    }
  }

  private async generateInitialInstances(
    template: TaskTemplate,
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
  ): Promise<number> {
    const instances = this.generationService.generateInstances(template);

    if (instances.length > 0) {
      await instanceRepository.saveMany(instances);
      await templateRepository.save(template);
    }

    return instances.length;
  }
}
