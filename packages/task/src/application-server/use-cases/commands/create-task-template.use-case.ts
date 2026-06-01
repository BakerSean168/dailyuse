/**
 * Create Task Template Service
 *
 * Creates a task template (recurring task) and automatically
 * generates initial instances upon creation.
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/i-task-instance-repository';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/i-task-template-repository';
import { TaskTemplate } from '@/domain-server/aggregates/task-template';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '@/domain-server/value-objects';
import { TaskTemplateId } from '../../../domain-shared/value-objects/task-template-id';
import { TaskInstanceGenerationService } from '@/domain-server/services/index';
import type { TaskTemplateClientDTO, CreateTaskTemplateInput } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils/logger';
import type { Result } from '@dailyuse/contracts/result';
import { error, ok } from '@dailyuse/contracts/result';

/**
 * Create Task Template Service
 */
export class CreateTaskTemplateUseCase {
  private readonly generationService: TaskInstanceGenerationService;
  private readonly logger = createLogger('CreateTaskTemplateUseCase');

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  async execute(
    request: CreateTaskTemplateInput,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instanceCount: number }>> {
    if (request.parentTaskId) {
      const parentTemplate = await this.templateRepository.findById(request.parentTaskId);
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

    // Save to repository
    await this.templateRepository.save(template);

    let instanceCount = 0;

    // If status is ACTIVE, generate initial instances immediately
    if (template.status === TaskTemplateStatus.Active) {
      instanceCount = await this.generateInitialInstances(template);
    }

    return ok({
      template: template.toClientDTO(),
      instanceCount,
    });
  }

  /** Generates initial task instances for the template. */
  private async generateInitialInstances(template: TaskTemplate): Promise<number> {
    try {
      const instances = this.generationService.generateInstances(template);

      if (instances.length > 0) {
        await this.instanceRepository.saveMany(instances);
        await this.templateRepository.save(template);
      }

      return instances.length;
    } catch (error) {
      this.logger.error('Failed to generate initial instances', { error });
      return 0;
    }
  }
}
