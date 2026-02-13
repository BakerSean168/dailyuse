/**
 * List Task Templates Service
 *
 * 鑾峰彇浠诲姟妯℃澘鍒楄〃锛堟寜璐︽埛锟?
 * 鑾峰彇鏃惰嚜鍔ㄦ鏌ュ苟琛ュ厖瀹炰緥
 */

import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { TaskTemplate } from '../../domain-server/aggregates/task-template';
import { TaskInstanceGenerationService } from '../../domain-server/services/TaskInstanceGenerationService';
import type {
  TaskTemplateClientDTO,
  QueryTaskTemplatesRequest,
  TaskTemplatesResponse,
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

  async execute(request: QueryTaskTemplatesRequest): Promise<Result<TaskTemplatesResponse>> {
    let templates: TaskTemplate[];

    // 鏍规嵁涓嶅悓鏉′欢鏌ヨ
    if (request.status && request.status.length > 0) {
      templates = await this.templateRepository.findByStatus(request.identityId, request.status[0]);
    } else if (request.folderId) {
      templates = await this.templateRepository.findByFolderId(request.folderId);
    } else if (request.goalId) {
      templates = await this.templateRepository.findByGoalId(request.goalId);
    } else if (request.tags && request.tags.length > 0) {
      templates = await this.templateRepository.findByTags(request.identityId, request.tags);
    } else {
      templates = await this.templateRepository.findByIdentityId(request.identityId);
    }

    // 鑷姩妫€鏌ュ苟琛ュ厖姣忎釜 ACTIVE 妯℃澘鐨勫疄渚嬶紙寮傛鎵ц锛屼笉闃诲锟?
    for (const template of templates) {
      if (template.status === TaskTemplateStatus.ACTIVE) {
        this.checkAndRefillInstances(template).catch((error) => {
          console.error(`锟?琛ュ厖妯℃澘 "${template.title}" 瀹炰緥澶辫触:`, error);
        });
      }
    }

    return ok({
      templates: templates.map((t) => t.toClientDTO()),
      total: templates.length,
    });
  }

  /**
   * 妫€鏌ュ苟琛ュ厖妯℃澘瀹炰緥
   */
  private async checkAndRefillInstances(template: TaskTemplate): Promise<void> {
    try {
      if (this.generationService.shouldRefillInstances(template)) {
        const instances = this.generationService.generateInstances(template);

        if (instances.length > 0) {
          await this.instanceRepository.saveMany(instances);
          await this.templateRepository.save(template);

          eventBus.emit('task.instances.generated', {
            eventType: 'task_template.instances_generated',
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
      console.error(`锟?[ListTaskTemplates] 琛ュ厖瀹炰緥澶辫触:`, error);
    }
  }
}

