/**
 * Update Task Metadata
 *
 * 更新任务元数据用例
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';
import type { UpdateTaskMetadataRequest } from '@dailyuse/contracts/schedule';

/**
 * Update Task Metadata
 */
export class UpdateTaskMetadata {
  private static instance: UpdateTaskMetadata;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): UpdateTaskMetadata {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    UpdateTaskMetadata.instance = new UpdateTaskMetadata(client);
    return UpdateTaskMetadata.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): UpdateTaskMetadata {
    if (!UpdateTaskMetadata.instance) {
      UpdateTaskMetadata.instance = UpdateTaskMetadata.createInstance();
    }
    return UpdateTaskMetadata.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateTaskMetadata.instance = undefined as unknown as UpdateTaskMetadata;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string, metadata: UpdateTaskMetadataRequest): Promise<void> {
    await this.apiClient.updateTaskMetadata(taskUuid, metadata);

    this.publishEvent(taskUuid, ScheduleTaskEvents.METADATA_UPDATED, metadata as Record<string, unknown>);
  }

  /**
   * 发布事件
   */
  private publishEvent(taskUuid: string, eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleTaskRefreshEvent = {
      taskUuid,
      reason: eventName,
      timestamp: Date.now(),
      metadata,
    };
    eventBus.emit(eventName, event);
  }
}
