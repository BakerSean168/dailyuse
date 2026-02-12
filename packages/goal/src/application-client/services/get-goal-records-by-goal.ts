/**
 * Get Goal Records By Goal
 *
 * 获取目标的所有记录用例
 * 
 * **返回 Entity 对象**
 */

import type { IGoalApiClient } from '@/infrastructure-client';
import { GoalContainer } from '@/infrastructure-client';
import { GoalRecord } from '@/domain-client';

/**
 * Get Goal Records By Goal
 */
export class GetGoalRecordsByGoal {
  private static instance: GetGoalRecordsByGoal;

  private constructor(private readonly apiClient: IGoalApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IGoalApiClient): GetGoalRecordsByGoal {
    const container = GoalContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetGoalRecordsByGoal.instance = new GetGoalRecordsByGoal(client);
    return GetGoalRecordsByGoal.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): GetGoalRecordsByGoal {
    if (!GetGoalRecordsByGoal.instance) {
      GetGoalRecordsByGoal.instance = GetGoalRecordsByGoal.createInstance();
    }
    return GetGoalRecordsByGoal.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetGoalRecordsByGoal.instance = undefined as unknown as GetGoalRecordsByGoal;
  }

  /**
   * 执行用例
   * @returns 返回 Entity 对象数组
   */
  async execute(
    goalUuid: string,
    params?: {
      page?: number;
      limit?: number;
      dateRange?: { start?: string; end?: string };
    },
  ): Promise<{ records: GoalRecord[]; total: number }> {
    const response = await this.apiClient.getGoalRecordsByGoal(goalUuid, params);
    return {
      records: response.records.map(dto => GoalRecord.fromClientDTO(dto)),
      total: response.total,
    };
  }
}
