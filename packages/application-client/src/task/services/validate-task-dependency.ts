/**
 * Validate Task Dependency
 *
 * 验证任务依赖关系（不实际创建）用例
 */

import type { ITaskDependencyApiClient } from '@dailyuse/infrastructure-client';
import type {
  ValidateDependencyRequest,
  ValidateDependencyResponse,
} from '@dailyuse/contracts/task';
import { TaskContainer } from '@dailyuse/infrastructure-client';

/**
 * Validate Task Dependency
 */
export class ValidateTaskDependency {
  private static instance: ValidateTaskDependency;

  private constructor(private readonly apiClient: ITaskDependencyApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: ITaskDependencyApiClient): ValidateTaskDependency {
    const container = TaskContainer.getInstance();
    const client = apiClient || container.getDependencyApiClient();
    ValidateTaskDependency.instance = new ValidateTaskDependency(client);
    return ValidateTaskDependency.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): ValidateTaskDependency {
    if (!ValidateTaskDependency.instance) {
      ValidateTaskDependency.instance = ValidateTaskDependency.createInstance();
    }
    return ValidateTaskDependency.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    ValidateTaskDependency.instance = undefined as unknown as ValidateTaskDependency;
  }

  /**
   * 执行用例
   */
  async execute(request: ValidateDependencyRequest): Promise<ValidateDependencyResponse> {
    return this.apiClient.validateDependency(request);
  }
}
