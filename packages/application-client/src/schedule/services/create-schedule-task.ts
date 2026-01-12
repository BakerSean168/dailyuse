/**
 * Create Schedule Task
 *
 * 创建调度任务用例
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
 * Create Schedule Task Input
 */
export type CreateScheduleTaskInput = CreateScheduleTaskRequest;

/**
 * Create Schedule Task
 */
export class CreateScheduleTask {
  private static instance: CreateScheduleTask;

  private constructor(private readonly apiClient: IScheduleTaskApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IScheduleTaskApiClient): CreateScheduleTask {
    const container = ScheduleContainer.getInstance();
    const client = apiClient || container.getTaskApiClient();
    CreateScheduleTask.instance = new CreateScheduleTask(client);
    return CreateScheduleTask.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CreateScheduleTask {
    if (!CreateScheduleTask.instance) {
      CreateScheduleTask.instance = CreateScheduleTask.createInstance();
    }
    return CreateScheduleTask.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CreateScheduleTask.instance = undefined as unknown as CreateScheduleTask;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象
   */
  async execute(input: CreateScheduleTaskInput): Promise<ScheduleTask> {
    const dto = await this.apiClient.createTask(input);

    this.publishEvent(dto.uuid, ScheduleTaskEvents.TASK_CREATED);

    return ScheduleTask.fromClientDTO(dto);
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

/**
 * 便捷函数
 */
export const createScheduleTask = (input: CreateScheduleTaskInput): Promise<ScheduleTask> =>
  CreateScheduleTask.getInstance().execute(input);
