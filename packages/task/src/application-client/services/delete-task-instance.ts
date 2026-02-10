/**
 * Delete Task Instance
 *
 * 删除任务实例用例
 */

import type { ITaskInstanceApiClient } from '@/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { TaskContainer } from '@/infrastructure-client';
import { TaskInstanceEvents } from './task-events';

/**
 * Delete Task Instance
 */
export class DeleteTaskInstance {
  private static instance: DeleteTaskInstance;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): DeleteTaskInstance {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    DeleteTaskInstance.instance = new DeleteTaskInstance(client);
    return DeleteTaskInstance.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): DeleteTaskInstance {
    if (!DeleteTaskInstance.instance) {
      DeleteTaskInstance.instance = DeleteTaskInstance.createInstance();
    }
    return DeleteTaskInstance.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    DeleteTaskInstance.instance = undefined as unknown as DeleteTaskInstance;
  }

  /**
   * 执行用例
   */
  async execute(uuid: string): Promise<void> {
    await this.apiClient.deleteTaskInstance(uuid);

    eventBus.emit(TaskInstanceEvents.INSTANCE_DELETED, { uuid });
  }
}
