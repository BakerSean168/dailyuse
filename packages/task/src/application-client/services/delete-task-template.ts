/**
 * Delete Task Template
 *
 * 删除任务模板用例
 */

import type { ITaskTemplateApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@/infrastructure-client';
import { TaskEvents, type TaskTemplateRefreshEvent } from './task-events';

/**
 * Delete Task Template
 */
export class DeleteTaskTemplate {
  private static instance: DeleteTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): DeleteTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    DeleteTaskTemplate.instance = new DeleteTaskTemplate(client);
    return DeleteTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteTaskTemplate {
    if (!DeleteTaskTemplate.instance) {
      DeleteTaskTemplate.instance = DeleteTaskTemplate.createInstance();
    }
    return DeleteTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteTaskTemplate.instance = undefined as unknown as DeleteTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteTaskTemplate(uuid);

    this.publishEvent(uuid, TaskEvents.TEMPLATE_DELETED);
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
