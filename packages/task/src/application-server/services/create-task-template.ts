/**
 * Create Task Template Service
 *
 * 创建任务模板（循环任务）
 * 创建后自动生成初始实例（100�?最�?00个）
 */

import type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
} from '@/domain-server';
import {
  TaskTemplate,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskInstanceGenerationService,
} from '@/domain-server';
import type { TaskTemplateClientDTO, CreateTaskTemplateRequest } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';

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
  ): Promise<{ template: TaskTemplateClientDTO; instanceCount: number }> {
    // 转换值对�?
    const timeConfig = TaskTimeConfig.fromServerDTO(request.timeConfig);
    const recurrenceRule = request.recurrenceRule
      ? RecurrenceRule.fromServerDTO(request.recurrenceRule)
      : undefined;
    const reminderConfig = request.reminderConfig
      ? TaskReminderConfig.fromServerDTO(request.reminderConfig)
      : undefined;

    // 使用领域模型的工厂方法创�?
    const template = TaskTemplate.create({
      accountUuid: request.accountUuid,
      title: request.name,
      description: request.description,
      taskType: request.taskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: request.importance,
      folderUuid: request.folderUuid,
      tags: request.tags,
      color: request.color,
    });

    // 保存到仓�?
    await this.templateRepository.save(template);

    let instanceCount = 0;

    // 如果状态是 ACTIVE，立即生成初始实�?
    if (template.status === TaskTemplateStatus.ACTIVE) {
      instanceCount = await this.generateInitialInstances(template);
    }

    return {
      template: template.toClientDTO(),
      instanceCount,
    };
  }

  /**
   * 生成初始实例
   */
  private async generateInitialInstances(template: TaskTemplate): Promise<number> {
    try {
      const instances = this.generationService.generateInstances(template);

      if (instances.length > 0) {
        await this.instanceRepository.saveMany(instances);
        await this.templateRepository.save(template);

        // 发布事件
        eventBus.emit('task.instances.generated', {
          eventType: 'task_template.instances_generated',
          version: '1.0',
          aggregateId: template.uuid,
          occurredOn: new Date(),
          accountUuid: template.accountUuid,
          payload: {
            templateUuid: template.uuid,
            templateTitle: template.title,
            instanceCount: instances.length,
            strategy: instances.length <= 20 ? 'full' : 'summary',
          },
        });
      }

      return instances.length;
    } catch (error) {
      console.error(`�?[CreateTaskTemplate] 生成初始实例失败:`, error);
      return 0;
    }
  }
}
