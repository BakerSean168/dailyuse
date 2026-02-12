/**
 * Get Key Results
 *
 * 获取目标的关键结果列表用例
 * 
 * **返回 Entity 对象**
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';
import { KeyResult } from '@/domain-client';

/**
 * Get Key Results
 */
export class GetKeyResults {
  private static instance: GetKeyResults;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetKeyResults {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetKeyResults.instance = new GetKeyResults(client);
    return GetKeyResults.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetKeyResults {
    if (!GetKeyResults.instance) {
      GetKeyResults.instance = GetKeyResults.createInstance();
    }
    return GetKeyResults.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetKeyResults.instance = undefined as unknown as GetKeyResults;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(goalUuid: string): Promise<{ keyResults: KeyResult[] }> {
    const response = await this.apiClient.getKeyResultsByGoal(goalUuid);
    return {
      keyResults: response.keyResults.map(dto => KeyResult.fromServerDTO(dto)),
    };
  }
}

/**
 * 便捷函数
 */
export const getKeyResults = (goalUuid: string): Promise<{ keyResults: KeyResult[] }> =>
  GetKeyResults.getInstance().execute(goalUuid);
