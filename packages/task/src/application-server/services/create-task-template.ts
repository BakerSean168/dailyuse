/**
 * Create Task Template Service
 *
 * 鍒涘缓浠诲姟妯℃澘锛堝惊鐜换鍔★級
 * 鍒涘缓鍚庤嚜鍔ㄧ敓鎴愬垵濮嬪疄渚嬶紙100锟?鏈€锟?00涓級
 */

import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplate } from '../../domain-server/aggregates/task-template';
import { TaskTimeConfig, RecurrenceRule, TaskReminderConfig } from '../../domain-server/value-objects';
import { TaskInstanceGenerationService } from '../../domain-server/services/TaskInstanceGenerationService';
import type { TaskTemplateClientDTO, CreateTaskTemplateRequest } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Create Task Template Service
 */
export class CreateTaskTemplate {
  private readonly generationService: TaskInstanceGenerationService;

  constructor(
    private readonly templateRepository: ITaskTemplateRepository,
    private readonly instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService();
  }

  async execute(
    request: CreateTaskTemplateRequest,
  ): Promise<Result<{ template: TaskTemplateClientDTO; instanceCount: number }>> {

    const timeConfig = TaskTimeConfig.fromServerDTO(request.timeConfig);
    const recurrenceRule = request.recurrenceRule
      ? RecurrenceRule.fromServerDTO(request.recurrenceRule)
      : undefined;
    const reminderConfig = request.reminderConfig
      ? TaskReminderConfig.fromServerDTO(request.reminderConfig)
      : undefined;

    const template = TaskTemplate.create({
      identityId: request.identityId,
      title: request.name,
      description: request.description,
      taskType: request.taskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: request.importance,
      folderId: request.folderId,
      tags: request.tags,
      color: request.color,
    });

    // 淇濆瓨鍒颁粨鍌?
    await this.templateRepository.save(template);

    let instanceCount = 0;

    // 濡傛灉鐘舵€佹槸 ACTIVE锛岀珛鍗崇敓鎴愬垵濮嬪疄渚?
    if (template.status === TaskTemplateStatus.ACTIVE) {
      instanceCount = await this.generateInitialInstances(template);
    }

    return ok({
      template: template.toClientDTO(),
      instanceCount,
    });
  }

  /**
   * 鐢熸垚鍒濆瀹炰緥
   */
  private async generateInitialInstances(template: TaskTemplate): Promise<number> {
    try {
      const instances = this.generationService.generateInstances(template);

      if (instances.length > 0) {
        await this.instanceRepository.saveMany(instances);
        await this.templateRepository.save(template);

        // 鍙戝竷浜嬩欢
        eventBus.emit('task.instances.generated', {
          eventType: 'task_template.instances_generated',
          version: '1.0',
          aggregateId: template.id,
          occurredOn: new Date(),
          identityId: template.identityId,
          payload: {
            templateId: template.id,
            templateTitle: template.title,
            instanceCount: instances.length,
            strategy: instances.length <= 20 ? 'full' : 'summary',
          },
        });
      }

      return instances.length;
    } catch (error) {
      console.error(`[CreateTaskTemplate] 鐢熸垚鍒濆瀹炰緥澶辫触:`, error);
      return 0;
    }
  }
}
