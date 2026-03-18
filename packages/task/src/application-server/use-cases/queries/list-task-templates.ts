/**
 * List Task Templates Service
 *
 * Retrieves task templates by account, automatically checking
 * and replenishing instances for active templates.
 */

import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '@/domain-server/repositories/ITaskInstanceRepository';
import type { TaskTemplate } from '@/domain-server/aggregates/task-template';
import { TaskInstanceGenerationService } from '@/domain-server/services/TaskInstanceGenerationService';
import type {
  QueryTaskTemplatesInternal,
  QueryTaskTemplatesRes,
  TaskTemplateStatus as TaskTemplateStatusType,
} from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * List Task Templates Service
 */
export class ListTaskTemplates {
  private readonly generationService: TaskInstanceGenerationService;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  async execute(request: QueryTaskTemplatesInternal): Promise<Result<QueryTaskTemplatesRes>> {
    let templates: TaskTemplate[];

    // Query by different conditions
    if (request.status && request.status.length > 0) {
      templates = await this.templateRepository.findByStatus(
        request.identityId,
        request.status[0] as TaskTemplateStatusType,
      );
    } else if (request.folderId) {
      templates = await this.templateRepository.findByFolderId(request.folderId);
    } else if (request.goalId) {
      templates = await this.templateRepository.findByGoalId(request.goalId);
    } else if (request.tags && request.tags.length > 0) {
      templates = await this.templateRepository.findByTags(request.identityId, request.tags);
    } else {
      templates = await this.templateRepository.findByIdentityId(request.identityId);
    }

    // Auto-check and replenish instances for each ACTIVE template (async, non-blocking)
    for (const template of templates) {
      if (template.status === TaskTemplateStatus.Active) {
        this.checkAndRefillInstances(template).catch((error) => {
          console.error(`Failed to replenish instances for template "${template.title}":`, error);
        });
      }
    }

    return ok({
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    });
  }

  /** Checks and replenishes instances for a template if needed. */
  private async checkAndRefillInstances(template: TaskTemplate): Promise<void> {
    try {
      if (this.generationService.shouldRefillInstances(template)) {
        const instances = this.generationService.generateInstances(template);

        if (instances.length > 0) {
          await this.instanceRepository.saveMany(instances);
          await this.templateRepository.save(template);

          eventBus.send('task:instances:generated' as any, {
            eventType: 'task:instances:generated',
            aggregateId: template.id,
            identityId: template.identityId,
            payload: {
              templateId: template.id,
              templateTitle: template.title,
              instanceCount: instances.length,
            },
          });
        }
      }
    } catch (error) {
      console.error(`[ListTaskTemplates] Failed to replenish instances:`, error);
    }
  }
}
