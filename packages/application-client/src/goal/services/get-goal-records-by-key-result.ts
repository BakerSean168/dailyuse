/**
 * Get Goal Records By Key Result
 *
 * 获取关键结果的所有记录用例
 */

import type { IGoalApiClient } from '@dailyuse/infrastructure-client';
import type { GoalRecordsResponse } from '@dailyuse/contracts/goal';
import { GoalContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Goal Records By Key Result
 */
export class GetGoalRecordsByKeyResult {
  private static instance: GetGoalRecordsByKeyResult;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetGoalRecordsByKeyResult {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetGoalRecordsByKeyResult.instance = new GetGoalRecordsByKeyResult(client);
    return GetGoalRecordsByKeyResult.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoalRecordsByKeyResult {
    if (!GetGoalRecordsByKeyResult.instance) {
      GetGoalRecordsByKeyResult.instance = GetGoalRecordsByKeyResult.createInstance();
    }
    return GetGoalRecordsByKeyResult.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoalRecordsByKeyResult.instance = undefined as unknown as GetGoalRecordsByKeyResult;
  }

  /**
   * 执行用例
   */
  async execute(
    goalUuid: string,
    keyResultUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<GoalRecordsResponse> {
    return this.apiClient.getGoalRecordsByKeyResult(goalUuid, keyResultUuid, params);
  }
}
