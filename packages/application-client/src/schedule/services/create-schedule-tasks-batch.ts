/**
 * Create Schedule Tasks Batch
 *
 * 批量创建调度任务用例
 * 
 * **返回 Entity 对象**
 */

import type { IScheduleTaskApiClient } from '@dailyuse/infrastructure-client';
import type { CreateScheduleTaskRequest } from '@dailyuse/contracts/schedule';
import { eventBus } from '@dailyuse/utils';
import { ScheduleContainer } from '@dailyuse/infrastructure-client';
import { ScheduleTaskEvents, type ScheduleTaskRefreshEvent } from './schedule-events';
import { ScheduleTask } from '@dailyuse/domain-client/schedule';

/**
 * Create Schedule Tasks Batch Input
 */
export type CreateScheduleTasksBatchInput = CreateScheduleTaskRequest[];

/**
 * Create Schedule Tasks Batch
 */
export class CreateScheduleTasksBatch {
  private static instance: CreateScheduleTasksBatch;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): CreateScheduleTasksBatch {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    CreateScheduleTasksBatch.instance = new CreateScheduleTasksBatch(client);
    return CreateScheduleTasksBatch.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateScheduleTasksBatch {
    if (!CreateScheduleTasksBatch.instance) {
      CreateScheduleTasksBatch.instance = CreateScheduleTasksBatch.createInstance();
    }
    return CreateScheduleTasksBatch.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateScheduleTasksBatch.instance = undefined as unknown as CreateScheduleTasksBatch;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(input: CreateScheduleTasksBatchInput): Promise<ScheduleTask[]> {
    const dtos = await this.apiClient.createTasksBatch(input);

    this.publishEvent(dtos.map(t => t.uuid), ScheduleTaskEvents.TASKS_BATCH_CREATED);

    return dtos.map(dto => ScheduleTask.fromClientDTO(dto));
  }

  /**
   * 发布事件
   */
  private publishEvent(taskUuids: string[], eventName: string, metadata?: Record<string, unknown>): void {
    const event: ScheduleTaskRefreshEvent = {
      taskUuid: taskUuids.join(','),
      reason: eventName,
      timestamp: Date.now(),
      metadata: { ...metadata, taskUuids },
    };
    eventBus.emit(eventName, event);
  }
}

/**
 * 便捷函数
 */
export const createScheduleTasksBatch = (input: CreateScheduleTasksBatchInput): Promise<ScheduleTask[]> =>
  CreateScheduleTasksBatch.getInstance().execute(input);
