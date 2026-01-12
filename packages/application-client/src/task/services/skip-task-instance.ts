/**
 * Skip Task Instance
 *
 * 跳过任务实例用例
 */

import type { ITaskInstanceApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { TaskInstance } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import { TaskInstanceEvents } from './task-events';

/**
 * Skip Task Instance
 */
export class SkipTaskInstance {
  private static instance: SkipTaskInstance;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): SkipTaskInstance {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    SkipTaskInstance.instance = new SkipTaskInstance(client);
    return SkipTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SkipTaskInstance {
    if (!SkipTaskInstance.instance) {
      SkipTaskInstance.instance = SkipTaskInstance.createInstance();
    }
    return SkipTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SkipTaskInstance.instance = undefined as unknown as SkipTaskInstance;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.skipTaskInstance(uuid);
    const instance = TaskInstance.fromClientDTO(instanceDTO);

    eventBus.emit(TaskInstanceEvents.INSTANCE_SKIPPED, { uuid, instance });

    return instance;
  }
}
