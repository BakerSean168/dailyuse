/**
 * Pause Task Template
 *
 * 暂停任务模板用例
 */

import type { ITaskTemplateApiClient } from '@dailyuse/infrastructure-client';
import { TaskTemplate } from '@dailyuse/domain-client/task';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import { TaskEvents, type TaskTemplateRefreshEvent } from './task-events';

/**
 * Pause Task Template
 */
export class PauseTaskTemplate {
  private static instance: PauseTaskTemplate;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): PauseTaskTemplate {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    PauseTaskTemplate.instance = new PauseTaskTemplate(client);
    return PauseTaskTemplate.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): PauseTaskTemplate {
    if (!PauseTaskTemplate.instance) {
      PauseTaskTemplate.instance = PauseTaskTemplate.createInstance();
    }
    return PauseTaskTemplate.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    PauseTaskTemplate.instance = undefined as unknown as PauseTaskTemplate;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskTemplate> {
    const templateDTO = await this.apiClient.pauseTaskTemplate(uuid);
    const template = TaskTemplate.fromClientDTO(templateDTO);

    this.publishEvent(uuid, TaskEvents.TEMPLATE_PAUSED);

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
