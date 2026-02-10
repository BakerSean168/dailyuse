/**
 * Complete Task Instance
 *
 * 完成任务实例用例
 */

import type { ITaskInstanceApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { TaskInstance } from '@/domain-client';
import { TaskContainer } from '@/infrastructure-client';
import { TaskInstanceEvents } from './task-events';

/**
 * Complete Task Instance
 */
export class CompleteTaskInstance {
  private static instance: CompleteTaskInstance;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): CompleteTaskInstance {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    CompleteTaskInstance.instance = new CompleteTaskInstance(client);
    return CompleteTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CompleteTaskInstance {
    if (!CompleteTaskInstance.instance) {
      CompleteTaskInstance.instance = CompleteTaskInstance.createInstance();
    }
    return CompleteTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CompleteTaskInstance.instance = undefined as unknown as CompleteTaskInstance;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.completeTaskInstance(uuid);
    const instance = TaskInstance.fromClientDTO(instanceDTO);

    eventBus.emit(TaskInstanceEvents.INSTANCE_COMPLETED, { uuid, instance });

    return instance;
  }
}
