/**
 * Get Dependency Chain
 *
 * 获取任务的完整依赖链用例
 */

import type { ITaskDependencyApiClient } from '@/infrastructure-client';
import type { DependencyChainClientDTO } from '@dailyuse/contracts/task';
import { TaskContainer } from '@/infrastructure-client';

/**
 * Get Dependency Chain
 */
export class GetDependencyChain {
  private static instance: GetDependencyChain;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): GetDependencyChain {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    GetDependencyChain.instance = new GetDependencyChain(client);
    return GetDependencyChain.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetDependencyChain {
    if (!GetDependencyChain.instance) {
      GetDependencyChain.instance = GetDependencyChain.createInstance();
    }
    return GetDependencyChain.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetDependencyChain.instance = undefined as unknown as GetDependencyChain;
  }

  /**
   * 执行用例
   */
  async execute(taskUuid: string): Promise<DependencyChainClientDTO> {
    return this.apiClient.getDependencyChain(taskUuid);
  }
}
