/**
 * Check Expired Task Instances
 *
 * 检查过期任务实例用例
 */

import type { ITaskInstanceApiClient } from '@dailyuse/infrastructure-client';
import { eventBus } from '@dailyuse/utils';
import { TaskInstance } from '@dailyuse/domain-client/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';
import { TaskInstanceEvents } from './task-events';

/**
 * Check Expired Task Instances
 */
export class CheckExpiredInstances {
  private static instance: CheckExpiredInstances;

  private constructor(private readonly apiClient: ITaskInstanceApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskInstanceApiClient): CheckExpiredInstances {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getInstanceApiClient();
    CheckExpiredInstances.instance = new CheckExpiredInstances(client);
    return CheckExpiredInstances.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): CheckExpiredInstances {
    if (!CheckExpiredInstances.instance) {
      CheckExpiredInstances.instance = CheckExpiredInstances.createInstance();
    }
    return CheckExpiredInstances.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    CheckExpiredInstances.instance = undefined as unknown as CheckExpiredInstances;
  }

  /**
   * 执行用例
   */
  async execute(): Promise<{ count: number; instances: TaskInstance[] }> {
    const result = await this.apiClient.checkExpiredInstances();
    const instances = result.instances.map(dto => TaskInstance.fromClientDTO(dto));

    if (instances.length > 0) {
      eventBus.emit(TaskInstanceEvents.INSTANCES_EXPIRED, { instances });
    }

    return {
      count: result.count,
      instances,
    };
  }
}
