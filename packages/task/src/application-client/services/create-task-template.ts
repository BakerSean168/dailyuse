/**
 * Create Task Template
 *
 * 创建任务模板用例
 */

import type { ITaskTemplateApiClient } from '../../infrastructure-client/adapters/types';
import type { CreateTaskTemplateRequest } from '@dailyuse/contracts/task';
import { TaskTemplate } from '../../domain-client/aggregates/task-template';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '../../infrastructure-client/task.container';
import { TaskEvents, type TaskTemplateRefreshEvent } from './task-events';

/**
 * Create Task Template
 */
export class CreateTaskTemplate {
  private static instance: CreateTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): CreateTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    CreateTaskTemplate.instance = new CreateTaskTemplate(client);
    return CreateTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateTaskTemplate {
    if (!CreateTaskTemplate.instance) {
      CreateTaskTemplate.instance = CreateTaskTemplate.createInstance();
    }
    return CreateTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateTaskTemplate.instance = undefined as unknown as CreateTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(request: CreateTaskTemplateRequest): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.createTaskTemplate(request);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(template.uuid, TaskEvents.TEMPLATE_CREATED);

    return template;
  }

  /**
   * 发布事件
   */
  private publishEvent(templateUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: TaskTemplateRefreshEvent = {
      templateUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(eventName, event);
  }
}
