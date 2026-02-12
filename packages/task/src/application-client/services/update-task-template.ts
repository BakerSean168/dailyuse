/**
 * Update Task Template
 *
 * 更新任务模板用例
 */

import type { ITaskTemplateApiClient } from '../../infrastructure-client/adapters/types';
import type { UpdateTaskTemplateRequest } from '@dailyuse/contracts/task';
import { TaskTemplate } from '../../domain-client/aggregates/task-template';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '../../infrastructure-client/task.container';
import { TaskEvents, type TaskTemplateRefreshEvent } from './task-events';

/**
 * Update Task Template
 */
export class UpdateTaskTemplate {
  private static instance: UpdateTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): UpdateTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    UpdateTaskTemplate.instance = new UpdateTaskTemplate(client);
    return UpdateTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateTaskTemplate {
    if (!UpdateTaskTemplate.instance) {
      UpdateTaskTemplate.instance = UpdateTaskTemplate.createInstance();
    }
    return UpdateTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateTaskTemplate.instance = undefined as unknown as UpdateTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string, request: UpdateTaskTemplateRequest): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.updateTaskTemplate(uuid, request);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(uuid, TaskEvents.TEMPLATE_UPDATED);

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
