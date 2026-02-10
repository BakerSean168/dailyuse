/**
 * Start Task Instance
 *
 * 开始任务实例用例
 */

import type { ITaskInstanceApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { TaskInstance } from '@/domain-client';
import { TaskContainer } from '@/infrastructure-client';
import { TaskInstanceEvents } from './task-events';

/**
 * Start Task Instance
 */
export class StartTaskInstance {
  private static instance: StartTaskInstance;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): StartTaskInstance {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    StartTaskInstance.instance = new StartTaskInstance(client);
    return StartTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): StartTaskInstance {
    if (!StartTaskInstance.instance) {
      StartTaskInstance.instance = StartTaskInstance.createInstance();
    }
    return StartTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    StartTaskInstance.instance = undefined as unknown as StartTaskInstance;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await this.apiClient.startTaskInstance(uuid);
    const instance = TaskInstance.fromClientDTO(instanceDTO);

    eventBus.emit(TaskInstanceEvents.INSTANCE_STARTED, { uuid, instance });

    return instance;
  }
}
