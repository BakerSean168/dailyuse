/**
 * Generate Task Instances
 *
 * 生成任务实例用例
 */

import type { ITaskTemplateApiClient } from '@/infrastructure-client';
import type { GenerateInstancesRequest } from '@dailyuse/contracts/task';
import { eventBus } from '@dailyuse/utils';
import { TaskInstance } from '@/domain-client';
import { TaskContainer } from '@/infrastructure-client';
import { TaskEvents } from './task-events';

/**
 * Generate Task Instances
 */
export class GenerateTaskInstances {
  private static instance: GenerateTaskInstances;

  private constructor(private readonly apiClient: ITaskTemplateApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskTemplateApiClient): GenerateTaskInstances {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getTemplateApiClient();
    GenerateTaskInstances.instance = new GenerateTaskInstances(client);
    return GenerateTaskInstances.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GenerateTaskInstances {
    if (!GenerateTaskInstances.instance) {
      GenerateTaskInstances.instance = GenerateTaskInstances.createInstance();
    }
    return GenerateTaskInstances.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GenerateTaskInstances.instance = undefined as unknown as GenerateTaskInstances;
  }

  /**
   * 执行用例
   */
  async execute(templateUuid: string, toDate: number): Promise<TaskInstance[]> {
    const request: GenerateInstancesRequest = {
      templateUuid,
      toDate,
    };
    const instanceDTOs = await this.apiClient.generateInstances(templateUuid, request);
    const instances = instanceDTOs.map(dto => TaskInstance.fromClientDTO(dto));

    eventBus.emit(TaskEvents.INSTANCES_GENERATED, {
      templateUuid,
      instances
    });

    return instances;
  }
}
