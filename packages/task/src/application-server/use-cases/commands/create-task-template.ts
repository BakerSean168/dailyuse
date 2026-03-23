/**
 * Create Task Template Service
 *
 * Creates a task template (recurring task) and automatically
 * generates initial instances upon creation.
 */

import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplate } from '@/domain-server/aggregates/task-template';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '@/domain-server/value-objects';
import { TaskInstanceGenerationService } from '@/domain-server/services/TaskInstanceGenerationService';
import type { TaskTemplateClientDTO, CreateTaskTemplateInput } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Create Task Template Service
 */
export class CreateTaskTemplate {
  private readonly generationService: TaskInstanceGenerationService;
  private readonly logger = createLogger('CreateTaskTemplate');

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  async execute(
    request: CreateTaskTemplateInput,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instanceCount: number }>> {
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
