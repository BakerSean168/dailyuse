/**
 * Activate Task Template
 *
 * 激活任务模板用例
 */

import type { ITaskTemplateApiClient } from '@/infrastructure-client';
import { TaskTemplate, TaskInstance } from '@/domain-client';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@/infrastructure-client';
import { TaskEvents, type TaskTemplateRefreshEvent } from './task-events';

/**
 * Activate Task Template
 */
export class ActivateTaskTemplate {
  private static instance: ActivateTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): ActivateTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    ActivateTaskTemplate.instance = new ActivateTaskTemplate(client);
    return ActivateTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ActivateTaskTemplate {
    if (!ActivateTaskTemplate.instance) {
      ActivateTaskTemplate.instance = ActivateTaskTemplate.createInstance();
    }
    return ActivateTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ActivateTaskTemplate.instance = undefined as unknown as ActivateTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<{
    template: TaskTemplate;
    instances: TaskInstance[];
  }> {
    // 激活模板
    await this.apiClient.activateTaskTemplate(uuid);

    // 重新获取完整的模板数据（包含 instances）
    const fullTemplateDTO = await this.apiClient.getTaskTemplateById(uuid, true);
    const fullTemplate = TaskTemplate.fromClientDTO(fullTemplateDTO);

    // 提取 instances
    const instances = fullTemplate.instances || [];

    this.publishEvent(uuid, TaskEvents.TEMPLATE_ACTIVATED, {
      instanceCount: instances.length,
    });

    return {
      template: fullTemplate,
      instances,
    };
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
