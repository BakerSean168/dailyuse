/**
 * List Task Templates Service
 *
 * Retrieves task templates by account, automatically checking
 * and replenishing instances for active templates.
 */

import type { ITaskTemplateRepository } from '../../../domain/repositories/i-task-template-repository';
import type { ITaskInstanceRepository } from '../../../domain/repositories/i-task-instance-repository';
import type { TaskTemplate } from '../../../domain/aggregates/task-template';
import { TaskInstanceGenerationService } from '../../../domain/services/index';
import type {
  QueryTaskTemplatesInternal,
  QueryTaskTemplatesRes,
  TaskTemplateStatus as TaskTemplateStatusType,
} from '@memoflow/contracts/task';
import { TaskTemplateStatus } from '@memoflow/contracts/task';
import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';

/**
 * List Task Templates Service
 */
export class ListTaskTemplatesUseCase {
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
      templates = await this.templateRepository.findByFolderId(request.identityId, request.folderId);
    } else if (request.goalId) {
      templates = await this.templateRepository.findByGoalId(request.identityId, request.goalId);
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

    const statsByTemplateId =
      (await this.instanceRepository.getTemplateStats(
        templates.map((template) => template.id),
        request.identityId,
      )) ??
      {};

    return ok({
      templates: templates.map((template) => {
        const dto = template.toClientDTO();
        const stats = statsByTemplateId[template.id];

        if (!stats) {
          return dto;
        }

        return {
          ...dto,
          instanceCount: stats.instanceCount,
          completedInstanceCount: stats.completedInstanceCount,
          pendingInstanceCount: stats.pendingInstanceCount,
          dueInstanceCount: stats.dueInstanceCount,
          completedDueInstanceCount: stats.completedDueInstanceCount,
          completionWindowDays: stats.completionWindowDays,
          futurePendingInstanceCount: stats.futurePendingInstanceCount,
          singleInstanceStatus: stats.singleInstanceStatus,
          completionRate: stats.completionRate,
        };
      }),
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
        }
      }
    } catch (error) {
      console.error(`[ListTaskTemplatesUseCase] Failed to replenish instances:`, error);
    }
  }
}
